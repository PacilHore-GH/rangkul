"""Application services for identity and session lifecycle."""

import hashlib
import secrets
from datetime import timedelta

import bcrypt
import jwt
from fastapi import HTTPException, status
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models import PasswordResetToken, Session as UserSession, User, utcnow


def normalize_email(email: str) -> str:
    return email.strip().lower()


def hash_password(password: str) -> str:
    # bcrypt rejects inputs above 72 bytes. Pre-hashing preserves the full
    # password (including Unicode) instead of silently truncating it.
    return bcrypt.hashpw(hashlib.sha256(password.encode("utf-8")).digest(), bcrypt.gensalt()).decode()


def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(hashlib.sha256(password.encode("utf-8")).digest(), password_hash.encode())


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def _expired(value) -> bool:
    if value.tzinfo is None:  # SQLite test adapter returns naive values.
        value = value.replace(tzinfo=utcnow().tzinfo)
    return value <= utcnow()


def create_session(db: Session, user: User) -> str:
    raw_token = secrets.token_urlsafe(32)
    expires_at = utcnow() + timedelta(hours=settings.SESSION_EXPIRE_HOURS)
    db.add(UserSession(user_id=user.id, token_hash=_hash_token(raw_token), expires_at=expires_at))
    db.commit()
    return jwt.encode({"sid": raw_token, "exp": expires_at}, settings.JWT_SECRET_KEY, algorithm="HS256")


def get_current_user(db: Session, encoded_token: str | None) -> User:
    if not encoded_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Autentikasi diperlukan.")
    try:
        raw_token = jwt.decode(encoded_token, settings.JWT_SECRET_KEY, algorithms=["HS256"])["sid"]
    except (jwt.InvalidTokenError, KeyError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sesi tidak valid.")
    session = db.scalar(select(UserSession).where(UserSession.token_hash == _hash_token(raw_token)))
    if not session or session.revoked_at or _expired(session.expires_at):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sesi tidak valid.")
    user = db.get(User, session.user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sesi tidak valid.")
    return user


def revoke_session(db: Session, encoded_token: str | None) -> None:
    if not encoded_token:
        return
    try:
        raw_token = jwt.decode(encoded_token, settings.JWT_SECRET_KEY, algorithms=["HS256"])["sid"]
    except (jwt.InvalidTokenError, KeyError):
        return
    session = db.scalar(select(UserSession).where(UserSession.token_hash == _hash_token(raw_token)))
    if session and not session.revoked_at:
        session.revoked_at = utcnow()
        db.commit()


def create_reset_token(db: Session, user: User) -> str:
    token = secrets.token_urlsafe(32)
    db.add(PasswordResetToken(user_id=user.id, token_hash=_hash_token(token),
                              expires_at=utcnow() + timedelta(minutes=settings.RESET_TOKEN_EXPIRE_MINUTES)))
    db.commit()
    return token


def consume_reset_token(db: Session, token: str, new_password: str) -> None:
    record = db.scalar(select(PasswordResetToken).where(PasswordResetToken.token_hash == _hash_token(token)))
    if not record or record.used_at or _expired(record.expires_at):
        raise HTTPException(status_code=400, detail="Token reset tidak valid atau kedaluwarsa.")
    user = db.get(User, record.user_id)
    record.used_at = utcnow()
    user.password_hash = hash_password(new_password)
    db.execute(update(UserSession).where(UserSession.user_id == user.id, UserSession.revoked_at.is_(None)).values(revoked_at=utcnow()))
    db.commit()
