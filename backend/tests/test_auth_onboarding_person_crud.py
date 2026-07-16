from uuid import uuid4

from app.models import User
import pytest


REGISTER = {
    "email": "owner@example.com",
    "password": "Password-Aman12!",
    "full_name": "Ibu Rani",
    "terms_accepted": True,
}
PERSON = {
    "display_name": "Adit",
    "birth_year": 2020,
    "support_needs": ["communication", "sensory"],
    "notes": "Suka rutinitas.",
    "caregiver_relationship": "parent",
    "consent": True,
}


def test_logout_requires_a_valid_authenticated_session(client):
    http, _ = client
    assert http.post("/api/v1/auth/logout").status_code == 401

    assert http.post("/api/v1/auth/register", json=REGISTER).status_code == 201
    assert http.post("/api/v1/auth/logout").status_code == 204
    assert http.post("/api/v1/auth/logout").status_code == 401
    assert http.get("/api/v1/auth/me").status_code == 401


def test_onboarding_is_authenticated_and_can_only_be_completed_once(client):
    http, _ = client
    assert http.post("/api/v1/people/onboarding", json=PERSON).status_code == 401

    registered = http.post("/api/v1/auth/register", json=REGISTER)
    assert registered.status_code == 201
    assert registered.json()["onboarding_completed"] is False

    completed = http.post("/api/v1/people/onboarding", json=PERSON)
    assert completed.status_code == 201
    assert http.get("/api/v1/auth/me").json()["onboarding_completed"] is True
    assert http.post(
        "/api/v1/people/onboarding",
        json=PERSON,
        headers={"Idempotency-Key": str(uuid4())},
    ).status_code == 409


def test_person_profile_owner_can_manage_multiple_people_without_reopening_onboarding(client):
    http, _ = client
    http.post("/api/v1/auth/register", json=REGISTER)
    created = http.post("/api/v1/people/onboarding", json=PERSON)
    person_id = created.json()["id"]

    fetched = http.get(f"/api/v1/people/{person_id}")
    assert fetched.status_code == 200
    assert fetched.json()["display_name"] == "Adit"

    updated = http.patch(f"/api/v1/people/{person_id}", json={
        "display_name": "Adit Pratama",
        "birth_year": None,
        "support_needs": ["learning"],
        "notes": "",
    })
    assert updated.status_code == 200
    assert updated.json() == {
        "id": person_id,
        "display_name": "Adit Pratama",
        "birth_year": None,
        "support_needs": ["learning"],
        "communication_preferences": [],
        "accessibility_preferences": [],
        "primary_language": "id",
        "notes": None,
        "caregiver_relationship": "parent",
        "completeness": {
            "percentage": 50,
            "sections": [
                {"code": "basic", "completed": True},
                {"code": "support_needs", "completed": True},
                {"code": "preferences", "completed": False},
                {"code": "notes", "completed": False},
            ],
        },
    }

    second = http.post("/api/v1/people", json={
        **PERSON,
        "display_name": "Naya",
        "support_needs": ["learning"],
    })
    assert second.status_code == 201
    assert second.json()["id"] != person_id

    listed = http.get("/api/v1/people")
    assert listed.status_code == 200
    assert [person["display_name"] for person in listed.json()] == ["Adit Pratama", "Naya"]

    assert http.delete(f"/api/v1/people/{person_id}").status_code == 204
    assert http.get(f"/api/v1/people/{person_id}").status_code == 404
    current_user = http.get("/api/v1/auth/me").json()
    assert current_user["onboarding_completed"] is True
    assert current_user["has_profile"] is True
    assert [person["display_name"] for person in http.get("/api/v1/people").json()] == ["Naya"]
    assert http.post(
        "/api/v1/people/onboarding",
        json=PERSON,
        headers={"Idempotency-Key": str(uuid4())},
    ).status_code == 409


def test_person_crud_requires_completed_onboarding_and_enforces_ownership(client):
    owner, _ = client
    owner.post("/api/v1/auth/register", json=REGISTER)
    assert owner.post("/api/v1/people", json=PERSON).status_code == 409
    owned_id = owner.post("/api/v1/people/onboarding", json=PERSON).json()["id"]

    owner.post("/api/v1/auth/logout")
    owner.post("/api/v1/auth/register", json={
        **REGISTER,
        "email": "other@example.com",
        "full_name": "Ayah Budi",
    })

    assert owner.get(f"/api/v1/people/{owned_id}").status_code == 404
    assert owner.patch(f"/api/v1/people/{owned_id}", json={"display_name": "Bocor"}).status_code == 404
    assert owner.delete(f"/api/v1/people/{owned_id}").status_code == 404


def test_person_update_revalidates_every_mutable_field(client):
    http, _ = client
    http.post("/api/v1/auth/register", json=REGISTER)
    person_id = http.post("/api/v1/people/onboarding", json=PERSON).json()["id"]

    invalid_updates = [
        {"display_name": None},
        {"display_name": " "},
        {"display_name": "A" * 81},
        {"birth_year": 1899},
        {"birth_year": 2027},
        {"support_needs": None},
        {"support_needs": []},
        {"support_needs": ["unknown"]},
        {"support_needs": ["communication", "communication"]},
        {"notes": "x" * 1001},
    ]
    for payload in invalid_updates:
        assert http.patch(f"/api/v1/people/{person_id}", json=payload).status_code == 422

    unchanged = http.get(f"/api/v1/people/{person_id}").json()
    assert unchanged["display_name"] == PERSON["display_name"]
    assert unchanged["birth_year"] == PERSON["birth_year"]


def test_person_create_and_update_sanitize_text_at_the_server_boundary(client):
    http, _ = client
    http.post("/api/v1/auth/register", json=REGISTER)
    created = http.post("/api/v1/people/onboarding", json={
        **PERSON,
        "display_name": " <b>Adit</b>\u0000 ",
        "notes": "Catatan <b>aman</b><script>alert(1)</script>",
    })
    assert created.status_code == 201
    assert created.json()["display_name"] == "Adit"
    assert created.json()["notes"] == "Catatan aman"

    updated = http.patch(f"/api/v1/people/{created.json()['id']}", json={
        "display_name": "<i>Adit Pratama</i>",
        "notes": "<style>body{display:none}</style>Rutinitas pagi",
    })
    assert updated.status_code == 200
    assert updated.json()["display_name"] == "Adit Pratama"
    assert updated.json()["notes"] == "Rutinitas pagi"


def test_deleting_profile_does_not_clear_onboarding_marker(client):
    http, session_factory = client
    http.post("/api/v1/auth/register", json=REGISTER)
    person_id = http.post("/api/v1/people/onboarding", json=PERSON).json()["id"]
    http.delete(f"/api/v1/people/{person_id}")

    db = session_factory()
    user = db.query(User).filter_by(email=REGISTER["email"]).one()
    assert user.onboarding_completed_at is not None
    db.close()


@pytest.mark.parametrize("relationship", [
    "parent", "guardian", "sibling", "extended_family", "caregiver", "other",
])
def test_person_accepts_every_supported_caregiver_relationship(client, relationship):
    http, _ = client
    http.post("/api/v1/auth/register", json={**REGISTER, "email": f"{relationship}@example.com"})
    created = http.post("/api/v1/people/onboarding", json={
        **PERSON,
        "caregiver_relationship": relationship,
    })
    assert created.status_code == 201
    assert created.json()["caregiver_relationship"] == relationship


@pytest.mark.parametrize("relationship", [None, "", "unspecified", "professional", "PARENT"])
def test_person_rejects_missing_or_invalid_caregiver_relationship(client, relationship):
    http, _ = client
    http.post("/api/v1/auth/register", json=REGISTER)
    payload = {**PERSON}
    if relationship is None:
        payload.pop("caregiver_relationship")
    else:
        payload["caregiver_relationship"] = relationship
    assert http.post("/api/v1/people/onboarding", json=payload).status_code == 422


def test_owner_can_update_primary_caregiver_relationship(client):
    http, _ = client
    http.post("/api/v1/auth/register", json=REGISTER)
    person_id = http.post("/api/v1/people/onboarding", json=PERSON).json()["id"]
    updated = http.patch(f"/api/v1/people/{person_id}", json={"caregiver_relationship": "guardian"})
    assert updated.status_code == 200
    assert updated.json()["caregiver_relationship"] == "guardian"
