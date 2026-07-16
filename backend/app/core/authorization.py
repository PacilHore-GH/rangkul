"""Reusable authenticated-user and role authorization dependencies."""

from typing import Annotated, Callable

from fastapi import Cookie, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db import get_db
from app.models import User
from app.modules.identity.service import get_current_user


def current_user(
    db: Session = Depends(get_db),
    session_token: Annotated[str | None, Cookie(alias=settings.SESSION_COOKIE_NAME)] = None,
) -> User:
    return get_current_user(db, session_token)


def require_role(*roles: str) -> Callable:
    def dependency(user: User = Depends(current_user)) -> User:
        if user.role not in roles:
            raise HTTPException(status_code=403, detail="Anda tidak memiliki akses untuk tindakan ini.")
        return user

    return dependency
