"""Idempotency policy for Person Profile mutations."""

import hashlib
import json
from datetime import timedelta
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import IdempotencyRecord, utcnow


def validate_idempotency_key(value: str | None) -> str:
    if not value:
        raise HTTPException(status_code=400, detail="Idempotency-Key wajib disertakan.")
    try:
        UUID(value)
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail="Idempotency-Key harus berupa UUID yang valid.")
    return value


def request_hash(payload: dict) -> str:
    encoded = json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    return hashlib.sha256(encoded.encode()).hexdigest()


def find_record(db: Session, user_id: str, operation: str, key: str) -> IdempotencyRecord | None:
    return db.scalar(select(IdempotencyRecord).where(
        IdempotencyRecord.user_id == user_id,
        IdempotencyRecord.operation == operation,
        IdempotencyRecord.idempotency_key == key,
    ))


def store_record(
    db: Session,
    *,
    user_id: str,
    operation: str,
    key: str,
    payload_hash: str,
    status_code: int,
    response_body: dict,
) -> None:
    db.add(IdempotencyRecord(
        user_id=user_id,
        operation=operation,
        idempotency_key=key,
        request_hash=payload_hash,
        response_status=status_code,
        response_body=response_body,
        expires_at=utcnow() + timedelta(hours=24),
    ))
