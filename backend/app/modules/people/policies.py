"""Extensible Person Profile catalogs and completeness policies."""

from dataclasses import dataclass

from app.models import PersonProfile

RELATIONSHIP_CODES = {
    "parent", "guardian", "sibling", "extended_family", "caregiver", "other", "unspecified",
}


@dataclass(frozen=True)
class CompletenessRule:
    code: str
    predicate: callable


COMPLETENESS_RULES = (
    CompletenessRule(
        "basic",
        lambda person, relationship: bool(person.display_name and relationship and relationship != "unspecified"),
    ),
    CompletenessRule("support_needs", lambda person, relationship: bool(person.support_needs)),
    CompletenessRule(
        "preferences",
        lambda person, relationship: bool(
            person.primary_language
            and (person.communication_preferences or person.accessibility_preferences)
        ),
    ),
    CompletenessRule("notes", lambda person, relationship: bool(person.notes)),
)


def completeness_for(person: PersonProfile, relationship: str) -> dict:
    sections = [
        {"code": rule.code, "completed": bool(rule.predicate(person, relationship))}
        for rule in COMPLETENESS_RULES
    ]
    completed = sum(section["completed"] for section in sections)
    return {"percentage": completed * 100 // len(sections), "sections": sections}
