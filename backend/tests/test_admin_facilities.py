from types import SimpleNamespace
from uuid import uuid4

import pytest

from app.models import User
from app.modules.identity.service import hash_password
from app.modules.people.policies import completeness_for

ADMIN_PASSWORD = "Password-Admin12!"
FACILITY = {
    "name": " RS <b>Harapan</b> ",
    "facility_type": "hospital",
    "description": "Layanan <script>buruk()</script>ramah keluarga.",
    "services": ["Terapi okupasi", "Psikologi"],
    "address": "Jl. Sehat 1",
    "city": "Bandung",
    "province": "Jawa Barat",
    "latitude": -6.9,
    "longitude": 107.6,
    "phone": "022-123",
    "website": "https://example.com",
    "source_name": "Dinas Kesehatan",
    "source_url": "https://example.com/source",
    "is_active": True,
}


def add_user(session_factory, *, email: str, role: str, password: str = ADMIN_PASSWORD) -> User:
    db = session_factory()
    user = User(email=email, password_hash=hash_password(password), full_name="Demo User", role=role)
    db.add(user)
    db.commit()
    db.refresh(user)
    db.close()
    return user


def login(http, path: str, email: str, password: str = ADMIN_PASSWORD):
    return http.post(path, json={"email": email, "password": password})


def test_admin_login_is_separate_and_admin_cannot_access_people(client):
    http, session_factory = client
    add_user(session_factory, email="admin@example.com", role="admin")
    assert login(http, "/api/v1/auth/login", "admin@example.com").status_code == 401
    logged_in = login(http, "/api/v1/auth/admin/login", "admin@example.com")
    assert logged_in.status_code == 200
    assert logged_in.json()["role"] == "admin"
    assert http.get("/api/v1/auth/me").json()["role"] == "admin"
    assert http.get("/api/v1/people").status_code == 403
    assert http.post("/api/v1/people/onboarding", json={}).status_code == 403
    assert http.post("/api/v1/auth/logout").status_code == 204


def test_family_cannot_login_as_admin(client):
    http, _ = client
    http.post("/api/v1/auth/register", json={
        "email": "family@example.com",
        "password": ADMIN_PASSWORD,
        "full_name": "Family",
        "terms_accepted": True,
    })
    http.post("/api/v1/auth/logout")
    assert login(http, "/api/v1/auth/admin/login", "family@example.com").status_code == 401


def test_admin_facility_crud_and_family_visibility(client):
    http, session_factory = client
    add_user(session_factory, email="admin@example.com", role="admin")
    login(http, "/api/v1/auth/admin/login", "admin@example.com")
    key = str(uuid4())
    created = http.post(
        "/api/v1/admin/facilities",
        json=FACILITY,
        headers={"Idempotency-Key": key},
    )
    assert created.status_code == 201
    assert created.json()["name"] == "RS Harapan"
    facility_id = created.json()["id"]
    replay = http.post(
        "/api/v1/admin/facilities",
        json=FACILITY,
        headers={"Idempotency-Key": key},
    )
    assert replay.status_code == 201
    assert replay.json()["id"] == facility_id
    assert http.post(
        "/api/v1/admin/facilities",
        json={**FACILITY, "name": "Berbeda"},
        headers={"Idempotency-Key": key},
    ).status_code == 409
    assert len(http.get("/api/v1/admin/facilities").json()) == 1

    updated = http.patch(f"/api/v1/admin/facilities/{facility_id}", json={"is_active": False})
    assert updated.status_code == 200
    assert updated.json()["is_active"] is False
    assert http.get(f"/api/v1/facilities/{facility_id}").status_code == 200

    http.post("/api/v1/auth/logout")
    http.post("/api/v1/auth/register", json={
        "email": "family@example.com",
        "password": ADMIN_PASSWORD,
        "full_name": "Family",
        "terms_accepted": True,
    })
    assert http.get("/api/v1/facilities").json() == []
    assert http.get(f"/api/v1/facilities/{facility_id}").status_code == 404
    assert http.post("/api/v1/admin/facilities", json=FACILITY).status_code == 403


@pytest.mark.parametrize("field,value,status_code", [
    ("latitude", -90, 201),
    ("latitude", 90, 201),
    ("latitude", -90.001, 422),
    ("latitude", 90.001, 422),
    ("longitude", -180, 201),
    ("longitude", 180, 201),
    ("longitude", -180.001, 422),
    ("longitude", 180.001, 422),
])
def test_facility_coordinate_boundaries(client, field, value, status_code):
    http, session_factory = client
    add_user(session_factory, email="admin@example.com", role="admin")
    login(http, "/api/v1/auth/admin/login", "admin@example.com")
    payload = {**FACILITY, field: value}
    response = http.post(
        "/api/v1/admin/facilities",
        json=payload,
        headers={"Idempotency-Key": str(uuid4())},
    )
    assert response.status_code == status_code


@pytest.mark.parametrize("payload", [
    {**FACILITY, "name": " "},
    {**FACILITY, "facility_type": "unknown"},
    {**FACILITY, "services": ["Sama", "Sama"]},
    {**FACILITY, "website": "bukan-url"},
    {**FACILITY, "source_url": "bukan-url"},
    {**FACILITY, "longitude": None},
    {**FACILITY, "owner_user_id": "attacker"},
])
def test_facility_rejects_invalid_and_extra_input(client, payload):
    http, session_factory = client
    add_user(session_factory, email="admin@example.com", role="admin")
    login(http, "/api/v1/auth/admin/login", "admin@example.com")
    assert http.post(
        "/api/v1/admin/facilities",
        json=payload,
        headers={"Idempotency-Key": str(uuid4())},
    ).status_code == 422


def test_completeness_policy_uses_registered_sections():
    person = SimpleNamespace(
        display_name="",
        support_needs=[],
        communication_preferences=[],
        accessibility_preferences=[],
        primary_language="",
        notes=None,
    )
    assert completeness_for(person, "")["percentage"] == 0
    person.display_name = "Adit"
    assert completeness_for(person, "unspecified")["percentage"] == 0
    assert completeness_for(person, "parent")["percentage"] == 25
    person.support_needs = ["communication"]
    assert completeness_for(person, "parent")["percentage"] == 50
    person.communication_preferences = ["visual_support"]
    person.primary_language = "id"
    assert completeness_for(person, "parent")["percentage"] == 75
    person.notes = "Catatan"
    assert completeness_for(person, "parent")["percentage"] == 100
