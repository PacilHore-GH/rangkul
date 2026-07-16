"""Persistence operations for Person relationships."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import PersonRelationship, utcnow


def primary_relationship(db: Session, person_id: str, user_id: str) -> PersonRelationship | None:
    return db.scalar(select(PersonRelationship).where(
        PersonRelationship.person_id == person_id,
        PersonRelationship.user_id == user_id,
        PersonRelationship.is_primary.is_(True),
        PersonRelationship.status == "active",
    ))


def create_primary_relationship(
    db: Session, person_id: str, user_id: str, relationship_type: str,
) -> PersonRelationship:
    relationship = PersonRelationship(
        person_id=person_id,
        user_id=user_id,
        relationship_type=relationship_type,
        is_primary=True,
        status="active",
    )
    db.add(relationship)
    return relationship


def update_primary_relationship(relationship: PersonRelationship, relationship_type: str) -> None:
    relationship.relationship_type = relationship_type
    relationship.updated_at = utcnow()
