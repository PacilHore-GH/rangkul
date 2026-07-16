from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Facility


def list_facilities(db: Session, *, include_inactive: bool) -> list[Facility]:
    query = select(Facility).order_by(Facility.name, Facility.id)
    if not include_inactive:
        query = query.where(Facility.is_active.is_(True))
    return list(db.scalars(query))


def get_facility(db: Session, facility_id: str, *, include_inactive: bool) -> Facility | None:
    query = select(Facility).where(Facility.id == facility_id)
    if not include_inactive:
        query = query.where(Facility.is_active.is_(True))
    return db.scalar(query)
