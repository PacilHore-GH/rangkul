"""HTTP adapter for the Identity module."""

import logging
from typing import Annotated

from email_validator import EmailNotValidError, validate_email
from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response, status
from pydantic import BaseModel, EmailStr, Field, field_validator
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.schemas import StrictInputModel
from app.core.security import enforce_rate_limit, require_trusted_origin
from app.core.text import sanitize_single_line
from app.db import get_db
from app.models import PersonProfile, User
from app.modules.identity.password_policy import MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH, validate_password_strength
from app.modules.identity.mailer import Mailer, get_mailer
from app.modules.identity.service import (
    consume_reset_token, create_reset_token, create_session, get_current_user,
    hash_password, normalize_email, revoke_session, verify_password,
)

router = APIRouter()
logger = logging.getLogger(__name__)


def clean_name(value: str) -> str:
    value = sanitize_single_line(value, 1000)
    if not value or len(value) > 80:
        raise ValueError("Harus berisi 1–80 karakter.")
    return value


class RegisterInput(StrictInputModel):
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


class LoginInput(StrictInputModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class ResetRequestInput(StrictInputModel):
    email: str


class ResetConfirmInput(StrictInputModel):
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
def register(
    payload: RegisterInput,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
) -> UserOutput:
    require_trusted_origin(request)
    enforce_rate_limit(db, scope="register_ip", subject=request.client.host if request.client else "unknown",
                       limit=5, window_seconds=900)
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
def login(
    payload: LoginInput,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
) -> UserOutput:
    require_trusted_origin(request)
    normalized_email = normalize_email(str(payload.email))
    ip = request.client.host if request.client else "unknown"
    enforce_rate_limit(db, scope="login_ip", subject=ip, limit=10, window_seconds=900)
    enforce_rate_limit(db, scope="login_email", subject=normalized_email, limit=5, window_seconds=900)
    user = db.scalar(select(User).where(User.email == normalized_email))
    if not user or user.role != "family" or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Email atau kata sandi tidak valid.")
    _set_session_cookie(response, create_session(db, user))
    return _user_output(db, user)


@router.post("/admin/login", response_model=UserOutput)
def admin_login(
    payload: LoginInput,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
) -> UserOutput:
    require_trusted_origin(request)
    normalized_email = normalize_email(str(payload.email))
    ip = request.client.host if request.client else "unknown"
    enforce_rate_limit(db, scope="admin_login_ip", subject=ip, limit=10, window_seconds=900)
    enforce_rate_limit(db, scope="admin_login_email", subject=normalized_email, limit=5, window_seconds=900)
    user = db.scalar(select(User).where(User.email == normalized_email))
    if not user or user.role != "admin" or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Email atau kata sandi tidak valid.")
    _set_session_cookie(response, create_session(db, user))
    return _user_output(db, user)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(request: Request, response: Response,
           session_token: Annotated[str | None, Cookie(alias=settings.SESSION_COOKIE_NAME)] = None,
           db: Session = Depends(get_db)) -> None:
    require_trusted_origin(request)
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
def request_reset(
    payload: ResetRequestInput,
    request: Request,
    db: Session = Depends(get_db),
    mailer: Mailer = Depends(get_mailer),
) -> dict:
    require_trusted_origin(request)
    ip = request.client.host if request.client else "unknown"
    normalized_email = normalize_email(payload.email)
    enforce_rate_limit(db, scope="reset_ip", subject=ip, limit=5, window_seconds=900)
    enforce_rate_limit(db, scope="reset_email", subject=normalized_email, limit=3, window_seconds=1800)
    try:
        validated = validate_email(normalized_email, check_deliverability=False).normalized.lower()
    except EmailNotValidError:
        validated = None
    user = db.scalar(select(User).where(User.email == validated)) if validated else None
    if user:
        token = create_reset_token(db, user)
        reset_url = f"{settings.FRONTEND_URL.rstrip('/')}/reset-password?token={token}"
        try:
            mailer.send_password_reset(
                recipient=user.email,
                reset_url=reset_url,
                expires_minutes=settings.RESET_TOKEN_EXPIRE_MINUTES,
            )
        except Exception:
            logger.exception("Password reset delivery failed.")
    return {"message": "Jika email terdaftar, tautan reset telah dikirim."}


@router.post("/password-reset/confirm", status_code=status.HTTP_204_NO_CONTENT)
def confirm_reset(
    payload: ResetConfirmInput,
    request: Request,
    db: Session = Depends(get_db),
) -> None:
    require_trusted_origin(request)
    enforce_rate_limit(
        db,
        scope="reset_confirm_ip",
        subject=request.client.host if request.client else "unknown",
        limit=10,
        window_seconds=900,
    )
    consume_reset_token(db, payload.token, payload.new_password)
