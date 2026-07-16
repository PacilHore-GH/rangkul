"""HTTP adapter for the Person Profile module."""

from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.authorization import require_role
from app.core.schemas import StrictInputModel
from app.core.security import require_trusted_origin
from app.core.text import sanitize_multiline
from app.db import get_db
from app.models import PersonProfile, User, utcnow
from app.modules.identity.router import clean_name
from app.modules.people.idempotency import find_record, request_hash, store_record, validate_idempotency_key
from app.modules.people.policies import RELATIONSHIP_CODES, completeness_for
from app.modules.people.repository import (
    create_primary_relationship,
    primary_relationship,
    update_primary_relationship,
)

router = APIRouter()
SUPPORT_NEED_CODES = {"communication", "learning", "mobility", "sensory", "daily_living", "social_emotional"}
COMMUNICATION_CODES = {
    "short_instructions", "visual_support", "gesture", "aac", "sign_language", "extra_processing_time",
}
ACCESSIBILITY_CODES = {
    "reduced_noise", "reduced_motion", "high_contrast", "large_text", "wheelchair_access", "quiet_space",
}
LANGUAGE_CODES = {"id", "en", "jv", "su"}


def validate_support_needs(values: list[str]) -> list[str]:
    if len(set(values)) != len(values) or any(value not in SUPPORT_NEED_CODES for value in values):
        raise ValueError("Kebutuhan dukungan tidak valid.")
    return values


def normalize_notes(value: str | None) -> str | None:
    if value is None:
        return None
    return sanitize_multiline(value, 1000) or None


def validate_catalog(values: list[str], catalog: set[str], label: str) -> list[str]:
    if len(set(values)) != len(values) or any(value not in catalog for value in values):
        raise ValueError(f"{label} tidak valid.")
    return values


class PersonCreateInput(StrictInputModel):
    display_name: str
    birth_year: int | None = Field(default=None, ge=1900, le=2026)
    support_needs: list[str] = Field(min_length=1, max_length=10)
    communication_preferences: list[str] = Field(default_factory=list, max_length=10)
    accessibility_preferences: list[str] = Field(default_factory=list, max_length=10)
    primary_language: str = "id"
    notes: str | None = Field(default=None, max_length=1000)
    caregiver_relationship: str
    consent: bool

    @field_validator("display_name")
    @classmethod
    def validate_display_name(cls, value: str) -> str:
        return clean_name(value)

    @field_validator("support_needs")
    @classmethod
    def validate_needs(cls, values: list[str]) -> list[str]:
        return validate_support_needs(values)

    @field_validator("communication_preferences")
    @classmethod
    def validate_communication(cls, values: list[str]) -> list[str]:
        return validate_catalog(values, COMMUNICATION_CODES, "Preferensi komunikasi")

    @field_validator("accessibility_preferences")
    @classmethod
    def validate_accessibility(cls, values: list[str]) -> list[str]:
        return validate_catalog(values, ACCESSIBILITY_CODES, "Preferensi aksesibilitas")

    @field_validator("primary_language")
    @classmethod
    def validate_language(cls, value: str) -> str:
        if value not in LANGUAGE_CODES:
            raise ValueError("Bahasa utama tidak valid.")
        return value

    @field_validator("notes")
    @classmethod
    def trim_notes(cls, value: str | None) -> str | None:
        return normalize_notes(value)

    @field_validator("caregiver_relationship")
    @classmethod
    def validate_relationship(cls, value: str) -> str:
        if value not in RELATIONSHIP_CODES or value == "unspecified":
            raise ValueError("Hubungan caregiver tidak valid.")
        return value

    @field_validator("consent")
    @classmethod
    def require_consent(cls, value: bool) -> bool:
        if not value:
            raise ValueError("Persetujuan wajib diberikan.")
        return value


class PersonUpdateInput(StrictInputModel):
    display_name: str | None = None
    birth_year: int | None = Field(default=None, ge=1900, le=2026)
    support_needs: list[str] | None = Field(default=None, min_length=1, max_length=10)
    communication_preferences: list[str] | None = Field(default=None, max_length=10)
    accessibility_preferences: list[str] | None = Field(default=None, max_length=10)
    primary_language: str | None = None
    notes: str | None = Field(default=None, max_length=1000)
    caregiver_relationship: str | None = None

    @field_validator("display_name")
    @classmethod
    def validate_display_name(cls, value: str | None) -> str | None:
        if value is None:
            raise ValueError("Nama panggilan tidak boleh kosong.")
        return clean_name(value)

    @field_validator("support_needs")
    @classmethod
    def validate_needs(cls, values: list[str] | None) -> list[str] | None:
        if values is None:
            raise ValueError("Kebutuhan dukungan tidak boleh kosong.")
        return validate_support_needs(values)

    @field_validator("communication_preferences")
    @classmethod
    def validate_communication(cls, values: list[str] | None) -> list[str] | None:
        if values is None:
            raise ValueError("Preferensi komunikasi tidak boleh null.")
        return validate_catalog(values, COMMUNICATION_CODES, "Preferensi komunikasi")

    @field_validator("accessibility_preferences")
    @classmethod
    def validate_accessibility(cls, values: list[str] | None) -> list[str] | None:
        if values is None:
            raise ValueError("Preferensi aksesibilitas tidak boleh null.")
        return validate_catalog(values, ACCESSIBILITY_CODES, "Preferensi aksesibilitas")

    @field_validator("primary_language")
    @classmethod
    def validate_language(cls, value: str | None) -> str | None:
        if value is None or value not in LANGUAGE_CODES:
            raise ValueError("Bahasa utama tidak valid.")
        return value

    @field_validator("notes")
    @classmethod
    def trim_notes(cls, value: str | None) -> str | None:
        return normalize_notes(value)

    @field_validator("caregiver_relationship")
    @classmethod
    def validate_relationship(cls, value: str | None) -> str | None:
        if value is None or value not in RELATIONSHIP_CODES or value == "unspecified":
            raise ValueError("Hubungan caregiver tidak valid.")
        return value


class CompletenessSection(BaseModel):
    code: str
    completed: bool


class CompletenessOutput(BaseModel):
    percentage: int
    sections: list[CompletenessSection]


class PersonOutput(BaseModel):
    id: str
    display_name: str
    birth_year: int | None
    support_needs: list[str]
    communication_preferences: list[str]
    accessibility_preferences: list[str]
    primary_language: str
    notes: str | None
    caregiver_relationship: str
    completeness: CompletenessOutput
    model_config = {"from_attributes": True}


family_user = require_role("family")


def person_output(db: Session, person: PersonProfile, user: User) -> dict:
    relationship = primary_relationship(db, person.id, user.id)
    relationship_type = relationship.relationship_type if relationship else "unspecified"
    return {
        "id": person.id,
        "display_name": person.display_name,
        "birth_year": person.birth_year,
        "support_needs": person.support_needs,
        "communication_preferences": person.communication_preferences,
        "accessibility_preferences": person.accessibility_preferences,
        "primary_language": person.primary_language,
        "notes": person.notes,
        "caregiver_relationship": relationship_type,
        "completeness": completeness_for(person, relationship_type),
    }


def owned_person_or_404(db: Session, user: User, person_id: str) -> PersonProfile:
    person = db.scalar(select(PersonProfile).where(
        PersonProfile.id == person_id,
        PersonProfile.owner_user_id == user.id,
    ))
    if not person:
        raise HTTPException(status_code=404, detail="Profil tidak ditemukan.")
    return person


def build_person(payload: PersonCreateInput, user: User) -> PersonProfile:
    return PersonProfile(
        owner_user_id=user.id,
        display_name=payload.display_name,
        birth_year=payload.birth_year,
        support_needs=payload.support_needs,
        communication_preferences=payload.communication_preferences,
        accessibility_preferences=payload.accessibility_preferences,
        primary_language=payload.primary_language,
        notes=payload.notes,
        consented_at=utcnow(),
    )


def commit_idempotent_create(
    db: Session,
    *,
    user_id: str,
    operation: str,
    key: str,
    payload_hash: str,
) -> JSONResponse | None:
    try:
        db.commit()
        return None
    except IntegrityError:
        db.rollback()
        existing = find_record(db, user_id, operation, key)
        if not existing:
            raise
        if existing.request_hash != payload_hash:
            raise HTTPException(status_code=409, detail="Idempotency-Key sudah digunakan untuk payload berbeda.")
        return JSONResponse(existing.response_body, status_code=existing.response_status)


@router.post("/onboarding", response_model=PersonOutput, status_code=status.HTTP_201_CREATED)
def complete_onboarding(
    payload: PersonCreateInput,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(family_user),
    idempotency_key: Annotated[str | None, Header(alias="Idempotency-Key")] = None,
) -> PersonProfile | JSONResponse:
    require_trusted_origin(request)
    key = validate_idempotency_key(idempotency_key)
    payload_hash = request_hash(payload.model_dump(mode="json"))
    existing = find_record(db, user.id, "people_onboarding", key)
    if existing:
        if existing.request_hash != payload_hash:
            raise HTTPException(status_code=409, detail="Idempotency-Key sudah digunakan untuk payload berbeda.")
        return JSONResponse(existing.response_body, status_code=existing.response_status)
    if user.onboarding_completed_at is not None:
        raise HTTPException(status_code=409, detail="Onboarding sudah diselesaikan.")
    person = build_person(payload, user)
    user.onboarding_completed_at = utcnow()
    db.add(person)
    db.flush()
    create_primary_relationship(db, person.id, user.id, payload.caregiver_relationship)
    db.flush()
    body = person_output(db, person, user)
    store_record(db, user_id=user.id, operation="people_onboarding", key=key,
                 payload_hash=payload_hash, status_code=201, response_body=body)
    replay = commit_idempotent_create(
        db,
        user_id=user.id,
        operation="people_onboarding",
        key=key,
        payload_hash=payload_hash,
    )
    if replay:
        return replay
    db.refresh(person)
    return body


@router.post("", response_model=PersonOutput, status_code=status.HTTP_201_CREATED)
def create_person(
    payload: PersonCreateInput,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(family_user),
    idempotency_key: Annotated[str | None, Header(alias="Idempotency-Key")] = None,
) -> PersonProfile | JSONResponse:
    require_trusted_origin(request)
    if user.onboarding_completed_at is None:
        raise HTTPException(status_code=409, detail="Selesaikan onboarding sebelum membuat profil.")
    key = validate_idempotency_key(idempotency_key)
    payload_hash = request_hash(payload.model_dump(mode="json"))
    existing = find_record(db, user.id, "people_create", key)
    if existing:
        if existing.request_hash != payload_hash:
            raise HTTPException(status_code=409, detail="Idempotency-Key sudah digunakan untuk payload berbeda.")
        return JSONResponse(existing.response_body, status_code=existing.response_status)
    person = build_person(payload, user)
    db.add(person)
    db.flush()
    create_primary_relationship(db, person.id, user.id, payload.caregiver_relationship)
    db.flush()
    body = person_output(db, person, user)
    store_record(db, user_id=user.id, operation="people_create", key=key,
                 payload_hash=payload_hash, status_code=201, response_body=body)
    replay = commit_idempotent_create(
        db,
        user_id=user.id,
        operation="people_create",
        key=key,
        payload_hash=payload_hash,
    )
    if replay:
        return replay
    db.refresh(person)
    return body


@router.get("/me", response_model=PersonOutput)
def get_my_person(db: Session = Depends(get_db), user: User = Depends(family_user)) -> dict:
    person = db.scalar(
        select(PersonProfile)
        .where(PersonProfile.owner_user_id == user.id)
        .order_by(PersonProfile.created_at, PersonProfile.id)
    )
    if not person:
        raise HTTPException(status_code=404, detail="Profil belum dibuat.")
    return person_output(db, person, user)


@router.get("", response_model=list[PersonOutput])
def list_my_people(db: Session = Depends(get_db), user: User = Depends(family_user)) -> list[dict]:
    people = list(db.scalars(
        select(PersonProfile)
        .where(PersonProfile.owner_user_id == user.id)
        .order_by(PersonProfile.created_at, PersonProfile.id)
    ))
    return [person_output(db, person, user) for person in people]


@router.get("/{person_id}", response_model=PersonOutput)
def get_person(person_id: str, db: Session = Depends(get_db), user: User = Depends(family_user)) -> dict:
    return person_output(db, owned_person_or_404(db, user, person_id), user)


@router.patch("/{person_id}", response_model=PersonOutput)
def update_person(
    person_id: str,
    payload: PersonUpdateInput,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(family_user),
) -> dict:
    require_trusted_origin(request)
    person = owned_person_or_404(db, user, person_id)
    updates = payload.model_dump(exclude_unset=True)
    relationship_type = updates.pop("caregiver_relationship", None)
    for field, value in updates.items():
        setattr(person, field, value)
    if relationship_type:
        relationship = primary_relationship(db, person.id, user.id)
        if relationship:
            update_primary_relationship(relationship, relationship_type)
        else:
            create_primary_relationship(db, person.id, user.id, relationship_type)
    db.commit()
    db.refresh(person)
    return person_output(db, person, user)


@router.delete("/{person_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_person(
    person_id: str,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(family_user),
) -> None:
    require_trusted_origin(request)
    person = owned_person_or_404(db, user, person_id)
    db.delete(person)
    db.commit()
