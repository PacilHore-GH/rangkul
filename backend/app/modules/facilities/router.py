from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.authorization import require_role
from app.core.idempotency import find_record, request_hash, store_record, validate_idempotency_key
from app.core.security import require_trusted_origin
from app.db import get_db
from app.models import User
from app.modules.facilities.schemas import FacilityCreateInput, FacilityOutput, FacilityUpdateInput
from app.modules.facilities.service import create_facility, list_facilities, require_facility, update_facility

public_router = APIRouter()
admin_router = APIRouter()


@public_router.get("", response_model=list[FacilityOutput])
def public_list(db: Session = Depends(get_db), user: User = Depends(require_role("family", "admin"))):
    return list_facilities(db, include_inactive=user.role == "admin")


@public_router.get("/{facility_id}", response_model=FacilityOutput)
def public_detail(
    facility_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("family", "admin")),
):
    return require_facility(db, facility_id, include_inactive=user.role == "admin")


@admin_router.get("", response_model=list[FacilityOutput])
def admin_list(db: Session = Depends(get_db), _user: User = Depends(require_role("admin"))):
    return list_facilities(db, include_inactive=True)


@admin_router.post("", response_model=FacilityOutput, status_code=status.HTTP_201_CREATED)
def admin_create(
    payload: FacilityCreateInput,
    request: Request,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role("admin")),
    idempotency_key: Annotated[str | None, Header(alias="Idempotency-Key")] = None,
):
    require_trusted_origin(request)
    key = validate_idempotency_key(idempotency_key)
    body_hash = request_hash(payload.model_dump(mode="json"))
    existing = find_record(db, admin.id, "facility_create", key)
    if existing:
        if existing.request_hash != body_hash:
            raise HTTPException(status_code=409, detail="Idempotency-Key sudah digunakan untuk payload berbeda.")
        return JSONResponse(existing.response_body, status_code=existing.response_status)
    facility = create_facility(db, payload)
    body = FacilityOutput.model_validate(facility).model_dump(mode="json")
    store_record(
        db, user_id=admin.id, operation="facility_create", key=key,
        payload_hash=body_hash, status_code=201, response_body=body,
    )
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        existing = find_record(db, admin.id, "facility_create", key)
        if existing and existing.request_hash == body_hash:
            return JSONResponse(existing.response_body, status_code=existing.response_status)
        raise
    db.refresh(facility)
    return facility


@admin_router.patch("/{facility_id}", response_model=FacilityOutput)
def admin_update(
    facility_id: str,
    payload: FacilityUpdateInput,
    request: Request,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
):
    require_trusted_origin(request)
    return update_facility(db, require_facility(db, facility_id, include_inactive=True), payload)


@admin_router.delete("/{facility_id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete(
    facility_id: str,
    request: Request,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
) -> None:
    require_trusted_origin(request)
    facility = require_facility(db, facility_id, include_inactive=True)
    db.delete(facility)
    db.commit()
