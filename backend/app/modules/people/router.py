"""HTTP adapter for the Person Profile module."""

from typing import Annotated

from fastapi import APIRouter, Cookie, Depends, HTTPException, status
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.text import sanitize_multiline
from app.db import get_db
from app.models import PersonProfile, User, utcnow
from app.modules.identity.router import clean_name
from app.modules.identity.service import get_current_user

router = APIRouter()
SUPPORT_NEED_CODES = {"communication", "learning", "mobility", "sensory", "daily_living", "social_emotional"}


def validate_support_needs(values: list[str]) -> list[str]:
    if len(set(values)) != len(values) or any(value not in SUPPORT_NEED_CODES for value in values):
        raise ValueError("Kebutuhan dukungan tidak valid.")
    return values


def normalize_notes(value: str | None) -> str | None:
    if value is None:
        return None
    return sanitize_multiline(value, 1000) or None


class PersonCreateInput(BaseModel):
    display_name: str
    birth_year: int | None = Field(default=None, ge=1900, le=2026)
    support_needs: list[str] = Field(min_length=1, max_length=10)
    notes: str | None = Field(default=None, max_length=1000)
    consent: bool

    @field_validator("display_name")
    @classmethod
    def validate_display_name(cls, value: str) -> str:
        return clean_name(value)

    @field_validator("support_needs")
    @classmethod
    def validate_needs(cls, values: list[str]) -> list[str]:
        return validate_support_needs(values)

    @field_validator("notes")
    @classmethod
    def trim_notes(cls, value: str | None) -> str | None:
        return normalize_notes(value)

    @field_validator("consent")
    @classmethod
    def require_consent(cls, value: bool) -> bool:
        if not value:
            raise ValueError("Persetujuan wajib diberikan.")
        return value


class PersonUpdateInput(BaseModel):
    display_name: str | None = None
    birth_year: int | None = Field(default=None, ge=1900, le=2026)
    support_needs: list[str] | None = Field(default=None, min_length=1, max_length=10)
    notes: str | None = Field(default=None, max_length=1000)

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

    @field_validator("notes")
    @classmethod
    def trim_notes(cls, value: str | None) -> str | None:
        return normalize_notes(value)


class PersonOutput(BaseModel):
    id: str
    display_name: str
    birth_year: int | None
    support_needs: list[str]
    notes: str | None
    model_config = {"from_attributes": True}


def current_user(
    db: Session = Depends(get_db),
    session_token: Annotated[str | None, Cookie(alias=settings.SESSION_COOKIE_NAME)] = None,
) -> User:
    return get_current_user(db, session_token)


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
        notes=payload.notes,
        consented_at=utcnow(),
    )


@router.post("/onboarding", response_model=PersonOutput, status_code=status.HTTP_201_CREATED)
def complete_onboarding(
    payload: PersonCreateInput,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> PersonProfile:
    if user.onboarding_completed_at is not None:
        raise HTTPException(status_code=409, detail="Onboarding sudah diselesaikan.")
    person = build_person(payload, user)
    user.onboarding_completed_at = utcnow()
    db.add(person)
    db.commit()
    db.refresh(person)
    return person


@router.post("", response_model=PersonOutput, status_code=status.HTTP_201_CREATED)
def create_person(
    payload: PersonCreateInput,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> PersonProfile:
    if user.onboarding_completed_at is None:
        raise HTTPException(status_code=409, detail="Selesaikan onboarding sebelum membuat profil.")
    person = build_person(payload, user)
    db.add(person)
    db.commit()
    db.refresh(person)
    return person


@router.get("/me", response_model=PersonOutput)
def get_my_person(db: Session = Depends(get_db), user: User = Depends(current_user)) -> PersonProfile:
    person = db.scalar(
        select(PersonProfile)
        .where(PersonProfile.owner_user_id == user.id)
        .order_by(PersonProfile.created_at, PersonProfile.id)
    )
    if not person:
        raise HTTPException(status_code=404, detail="Profil belum dibuat.")
    return person


@router.get("", response_model=list[PersonOutput])
def list_my_people(db: Session = Depends(get_db), user: User = Depends(current_user)) -> list[PersonProfile]:
    return list(db.scalars(
        select(PersonProfile)
        .where(PersonProfile.owner_user_id == user.id)
        .order_by(PersonProfile.created_at, PersonProfile.id)
    ))


@router.get("/{person_id}", response_model=PersonOutput)
def get_person(person_id: str, db: Session = Depends(get_db), user: User = Depends(current_user)) -> PersonProfile:
    return owned_person_or_404(db, user, person_id)


@router.patch("/{person_id}", response_model=PersonOutput)
def update_person(
    person_id: str,
    payload: PersonUpdateInput,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> PersonProfile:
    person = owned_person_or_404(db, user, person_id)
    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(person, field, value)
    db.commit()
    db.refresh(person)
    return person


@router.delete("/{person_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_person(
    person_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> None:
    person = owned_person_or_404(db, user, person_id)
    db.delete(person)
    db.commit()
