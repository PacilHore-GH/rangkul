"""HTTP adapter for the Person Profile module."""

from typing import Annotated

from fastapi import APIRouter, Cookie, Depends, HTTPException, status
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db import get_db
from app.models import PersonProfile, utcnow
from app.modules.identity.router import clean_name
from app.modules.identity.service import get_current_user

router = APIRouter()
SUPPORT_NEED_CODES = {"communication", "learning", "mobility", "sensory", "daily_living", "social_emotional"}


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
        if len(set(values)) != len(values) or any(value not in SUPPORT_NEED_CODES for value in values):
            raise ValueError("Kebutuhan dukungan tidak valid.")
        return values

    @field_validator("notes")
    @classmethod
    def trim_notes(cls, value: str | None) -> str | None:
        return value.strip() if value else None

    @field_validator("consent")
    @classmethod
    def require_consent(cls, value: bool) -> bool:
        if not value:
            raise ValueError("Persetujuan wajib diberikan.")
        return value


class PersonOutput(BaseModel):
    id: str
    display_name: str
    birth_year: int | None
    support_needs: list[str]
    notes: str | None
    model_config = {"from_attributes": True}


def current_user(db: Session = Depends(get_db), session_token: Annotated[str | None, Cookie(alias=settings.SESSION_COOKIE_NAME)] = None):
    return get_current_user(db, session_token)


@router.post("", response_model=PersonOutput, status_code=status.HTTP_201_CREATED)
def create_person(payload: PersonCreateInput, db: Session = Depends(get_db), user=Depends(current_user)) -> PersonProfile:
    if db.scalar(select(PersonProfile.id).where(PersonProfile.owner_user_id == user.id)):
        raise HTTPException(status_code=409, detail="Satu akun hanya dapat memiliki satu profil pada MVP ini.")
    person = PersonProfile(owner_user_id=user.id, display_name=payload.display_name, birth_year=payload.birth_year,
                           support_needs=payload.support_needs, notes=payload.notes, consented_at=utcnow())
    db.add(person)
    db.commit()
    db.refresh(person)
    return person


@router.get("/me", response_model=PersonOutput)
def get_my_person(db: Session = Depends(get_db), user=Depends(current_user)) -> PersonProfile:
    person = db.scalar(select(PersonProfile).where(PersonProfile.owner_user_id == user.id))
    if not person:
        raise HTTPException(status_code=404, detail="Profil belum dibuat.")
    return person
