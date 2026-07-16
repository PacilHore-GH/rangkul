"""HTTP adapter for the Identity module."""

from typing import Annotated

from fastapi import APIRouter, Cookie, Depends, HTTPException, Response, status
from pydantic import BaseModel, EmailStr, Field, field_validator
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.text import sanitize_single_line
from app.db import get_db
from app.models import PersonProfile, User
from app.modules.identity.password_policy import MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH, validate_password_strength
from app.modules.identity.service import (
    consume_reset_token, create_reset_token, create_session, get_current_user,
    hash_password, normalize_email, revoke_session, verify_password,
)

router = APIRouter()


def clean_name(value: str) -> str:
    value = sanitize_single_line(value, 1000)
    if not value or len(value) > 80:
        raise ValueError("Harus berisi 1–80 karakter.")
    return value


class RegisterInput(BaseModel):
    email: EmailStr
    password: str = Field(min_length=MIN_PASSWORD_LENGTH, max_length=MAX_PASSWORD_LENGTH)
    full_name: str
    terms_accepted: bool

    @field_validator("full_name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        return clean_name(value)

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        return validate_password_strength(value)

    @field_validator("terms_accepted")
    @classmethod
    def require_terms(cls, value: bool) -> bool:
        if not value:
            raise ValueError("Persetujuan syarat penggunaan wajib.")
        return value


class LoginInput(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class ResetRequestInput(BaseModel):
    email: EmailStr


class ResetConfirmInput(BaseModel):
    token: str = Field(min_length=1)
    new_password: str = Field(min_length=MIN_PASSWORD_LENGTH, max_length=MAX_PASSWORD_LENGTH)

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, value: str) -> str:
        return validate_password_strength(value)


class UserOutput(BaseModel):
    id: str
    email: EmailStr
    full_name: str
    role: str
    has_profile: bool
    onboarding_completed: bool


def _user_output(db: Session, user: User) -> UserOutput:
    return UserOutput(id=user.id, email=user.email, full_name=user.full_name, role=user.role,
                      has_profile=db.scalar(select(PersonProfile.id).where(PersonProfile.owner_user_id == user.id)) is not None,
                      onboarding_completed=user.onboarding_completed_at is not None)


def _set_session_cookie(response: Response, token: str) -> None:
    response.set_cookie(settings.SESSION_COOKIE_NAME, token, httponly=True, secure=settings.COOKIE_SECURE,
                        samesite=settings.COOKIE_SAMESITE,
                        max_age=settings.SESSION_EXPIRE_HOURS * 3600, path="/")


@router.post("/register", response_model=UserOutput, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterInput, response: Response, db: Session = Depends(get_db)) -> UserOutput:
    email = normalize_email(str(payload.email))
    if db.scalar(select(User.id).where(User.email == email)):
        raise HTTPException(status_code=409, detail="Email sudah terdaftar.")
    user = User(email=email, password_hash=hash_password(payload.password), full_name=payload.full_name, role="family")
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Email sudah terdaftar.")
    db.refresh(user)
    _set_session_cookie(response, create_session(db, user))
    return _user_output(db, user)


@router.post("/login", response_model=UserOutput)
def login(payload: LoginInput, response: Response, db: Session = Depends(get_db)) -> UserOutput:
    user = db.scalar(select(User).where(User.email == normalize_email(str(payload.email))))
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Email atau kata sandi tidak valid.")
    _set_session_cookie(response, create_session(db, user))
    return _user_output(db, user)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(response: Response, session_token: Annotated[str | None, Cookie(alias=settings.SESSION_COOKIE_NAME)] = None,
           db: Session = Depends(get_db)) -> None:
    get_current_user(db, session_token)
    revoke_session(db, session_token)
    response.delete_cookie(
        settings.SESSION_COOKIE_NAME,
        path="/",
        secure=settings.COOKIE_SECURE,
        httponly=True,
        samesite=settings.COOKIE_SAMESITE,
    )


@router.get("/me", response_model=UserOutput)
def me(session_token: Annotated[str | None, Cookie(alias=settings.SESSION_COOKIE_NAME)] = None,
       db: Session = Depends(get_db)) -> UserOutput:
    return _user_output(db, get_current_user(db, session_token))


@router.post("/password-reset/request", status_code=status.HTTP_202_ACCEPTED)
def request_reset(payload: ResetRequestInput, db: Session = Depends(get_db)) -> dict:
    user = db.scalar(select(User).where(User.email == normalize_email(str(payload.email))))
    if user:
        token = create_reset_token(db, user)
        print(f"[Rangkul reset link] /reset-password?token={token}")
    return {"message": "Jika email terdaftar, tautan reset telah dikirim."}


@router.post("/password-reset/confirm", status_code=status.HTTP_204_NO_CONTENT)
def confirm_reset(payload: ResetConfirmInput, db: Session = Depends(get_db)) -> None:
    consume_reset_token(db, payload.token, payload.new_password)
