from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models import Facility, utcnow
from app.modules.facilities.repository import get_facility, list_facilities
from app.modules.facilities.schemas import FacilityCreateInput, FacilityUpdateInput


def serialize_payload(payload: FacilityCreateInput | FacilityUpdateInput, *, exclude_unset: bool = False) -> dict:
    values = payload.model_dump(mode="json", exclude_unset=exclude_unset)
    return values


def create_facility(db: Session, payload: FacilityCreateInput) -> Facility:
    facility = Facility(**serialize_payload(payload))
    db.add(facility)
    db.flush()
    return facility


def update_facility(db: Session, facility: Facility, payload: FacilityUpdateInput) -> Facility:
    updates = serialize_payload(payload, exclude_unset=True)
    latitude = updates.get("latitude", facility.latitude)
    longitude = updates.get("longitude", facility.longitude)
    if (latitude is None) != (longitude is None):
        raise HTTPException(status_code=422, detail="Latitude dan longitude harus diisi berpasangan.")
    for field, value in updates.items():
        setattr(facility, field, value)
    facility.updated_at = utcnow()
    db.commit()
    db.refresh(facility)
    return facility


def require_facility(db: Session, facility_id: str, *, include_inactive: bool) -> Facility:
    facility = get_facility(db, facility_id, include_inactive=include_inactive)
    if not facility:
        raise HTTPException(status_code=404, detail="Fasilitas tidak ditemukan.")
    return facility


__all__ = ["create_facility", "list_facilities", "require_facility", "update_facility"]
