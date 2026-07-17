"""CSRF origin and database-backed rate-limit policies."""

import hashlib
import hmac
from datetime import datetime, timedelta
from urllib.parse import urlparse

from fastapi import HTTPException, Request, status
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models import RateLimitCounter, utcnow


def require_trusted_origin(request: Request) -> None:
    if not settings.CSRF_ENABLED or request.method in {"GET", "HEAD", "OPTIONS"}:
        return
    supplied = request.headers.get("origin")
    if not supplied:
        referer = request.headers.get("referer")
        if referer:
            parsed = urlparse(referer)
            supplied = f"{parsed.scheme}://{parsed.netloc}"
    trusted = {origin.rstrip("/") for origin in settings.TRUSTED_ORIGINS}
    if not supplied or supplied.rstrip("/") not in trusted:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Asal permintaan tidak diizinkan.")


def _subject_hash(value: str) -> str:
    return hmac.new(settings.JWT_SECRET_KEY.encode(), value.encode(), hashlib.sha256).hexdigest()


def enforce_rate_limit(
    db: Session,
    *,
    scope: str,
    subject: str,
    limit: int,
    window_seconds: int,
    now: datetime | None = None,
) -> None:
    now = now or utcnow()
    timestamp = int(now.timestamp())
    window_start = (now - timedelta(seconds=timestamp % window_seconds)).replace(microsecond=0)
    subject_hash = _subject_hash(subject)
    db.execute(
        delete(RateLimitCounter)
        .where(RateLimitCounter.expires_at <= now)
        .execution_options(synchronize_session=False)
    )
    counter = db.scalar(select(RateLimitCounter).where(
        RateLimitCounter.scope == scope,
        RateLimitCounter.subject_hash == subject_hash,
        RateLimitCounter.window_started_at == window_start,
    ))
    if counter and counter.count >= limit:
        expires_at = counter.expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=now.tzinfo)
        retry_after = max(1, int((expires_at - now).total_seconds()))
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Terlalu banyak percobaan. Tunggu beberapa menit lalu coba lagi.",
            headers={"Retry-After": str(retry_after)},
        )
    if counter:
        counter.count += 1
    else:
        db.add(RateLimitCounter(
            scope=scope,
            subject_hash=subject_hash,
            window_started_at=window_start,
            count=1,
            expires_at=window_start + timedelta(seconds=window_seconds),
        ))
    db.commit()
