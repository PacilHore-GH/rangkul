from datetime import timedelta
from uuid import uuid4

import pytest
from fastapi import HTTPException

from app.core.security import enforce_rate_limit
from app.main import app
from app.modules.identity.mailer import FakeMailer, get_mailer
from app.models import utcnow


REGISTER = {
    "email": "secure-owner@example.com",
    "password": "Password-Aman12!",
    "full_name": "Pemilik Aman",
    "terms_accepted": True,
}
PERSON = {
    "display_name": "Adit",
    "birth_year": 2020,
    "support_needs": ["communication"],
    "communication_preferences": ["visual_support"],
    "accessibility_preferences": ["reduced_noise"],
    "primary_language": "id",
    "notes": None,
    "caregiver_relationship": "parent",
    "consent": True,
}


def test_strict_auth_and_person_payloads_reject_privileged_extra_fields(client):
    http, _ = client
    assert http.post("/api/v1/auth/register", json={**REGISTER, "role": "admin"}).status_code == 422
    assert http.post("/api/v1/auth/register", json=REGISTER).status_code == 201
    assert http.post(
        "/api/v1/people/onboarding",
        json={**PERSON, "owner_user_id": "attacker"},
    ).status_code == 422


def test_password_reset_response_is_generic_and_uses_fake_mailer_only_for_registered_email(client):
    http, _ = client
    fake = FakeMailer()
    app.dependency_overrides[get_mailer] = lambda: fake
    try:
        assert http.post("/api/v1/auth/register", json=REGISTER).status_code == 201
        bodies = []
        for email in [REGISTER["email"], "missing@example.com", "invalid", "   "]:
            response = http.post("/api/v1/auth/password-reset/request", json={"email": email})
            assert response.status_code == 202
            bodies.append(response.json())
        assert len({str(body) for body in bodies}) == 1
        assert len(fake.sent) == 1
        assert fake.sent[0].recipient == REGISTER["email"]
        assert "token=" in fake.sent[0].reset_url
    finally:
        app.dependency_overrides.pop(get_mailer, None)


def test_password_reset_stays_generic_when_delivery_provider_fails(client):
    class FailingMailer:
        def send_password_reset(self, **_kwargs):
            raise RuntimeError("provider unavailable")

    http, _ = client
    app.dependency_overrides[get_mailer] = lambda: FailingMailer()
    try:
        http.post("/api/v1/auth/register", json=REGISTER)
        response = http.post("/api/v1/auth/password-reset/request", json={"email": REGISTER["email"]})
        assert response.status_code == 202
        assert response.json() == {"message": "Jika email terdaftar, tautan reset telah dikirim."}
    finally:
        app.dependency_overrides.pop(get_mailer, None)


def test_login_rate_limit_normalizes_email_and_returns_retry_after(client):
    http, _ = client
    http.post("/api/v1/auth/register", json=REGISTER)
    http.post("/api/v1/auth/logout")
    responses = [
        http.post("/api/v1/auth/login", json={
            "email": f" {REGISTER['email'].upper()} ",
            "password": "wrong-password",
        })
        for _ in range(6)
    ]
    assert [response.status_code for response in responses[:5]] == [401] * 5
    assert responses[5].status_code == 429
    assert int(responses[5].headers["retry-after"]) > 0


def test_rate_limit_boundary_and_new_window(client):
    _, session_factory = client
    db = session_factory()
    start = utcnow().replace(microsecond=0)
    for _ in range(3):
        enforce_rate_limit(
            db,
            scope="boundary",
            subject="same-user",
            limit=3,
            window_seconds=60,
            now=start,
        )
    with pytest.raises(HTTPException) as exc:
        enforce_rate_limit(
            db,
            scope="boundary",
            subject="same-user",
            limit=3,
            window_seconds=60,
            now=start,
        )
    assert getattr(exc.value, "status_code", None) == 429
    enforce_rate_limit(
        db,
        scope="boundary",
        subject="same-user",
        limit=3,
        window_seconds=60,
        now=start + timedelta(seconds=60),
    )
    db.close()


def test_csrf_rejects_foreign_or_missing_origin_but_allows_get(client):
    http, _ = client
    assert http.post(
        "/api/v1/auth/register",
        json=REGISTER,
        headers={"Origin": "https://rangkul.example.evil"},
    ).status_code == 403
    assert http.post(
        "/api/v1/auth/register",
        json=REGISTER,
        headers={"Origin": ""},
    ).status_code == 403
    assert http.get("/api/v1/auth/me", headers={"Origin": ""}).status_code == 401


def test_create_person_is_idempotent_and_preferences_are_returned(client):
    http, _ = client
    http.post("/api/v1/auth/register", json=REGISTER)
    onboarding_key = str(uuid4())
    first = http.post(
        "/api/v1/people/onboarding",
        json=PERSON,
        headers={"Idempotency-Key": onboarding_key},
    )
    replay = http.post(
        "/api/v1/people/onboarding",
        json=PERSON,
        headers={"Idempotency-Key": onboarding_key},
    )
    assert first.status_code == replay.status_code == 201
    assert first.json() == replay.json()
    assert first.json()["communication_preferences"] == ["visual_support"]
    assert first.json()["accessibility_preferences"] == ["reduced_noise"]

    create_key = str(uuid4())
    second_payload = {**PERSON, "display_name": "Naya"}
    created = http.post("/api/v1/people", json=second_payload, headers={"Idempotency-Key": create_key})
    repeated = http.post("/api/v1/people", json=second_payload, headers={"Idempotency-Key": create_key})
    conflict = http.post(
        "/api/v1/people",
        json={**second_payload, "display_name": "Beda"},
        headers={"Idempotency-Key": create_key},
    )
    assert created.status_code == repeated.status_code == 201
    assert created.json() == repeated.json()
    assert conflict.status_code == 409
    assert len(http.get("/api/v1/people").json()) == 2


def test_create_person_requires_valid_idempotency_key(client):
    http, _ = client
    http.post("/api/v1/auth/register", json=REGISTER)
    http.post("/api/v1/people/onboarding", json=PERSON, headers={"Idempotency-Key": str(uuid4())})
    assert http.post(
        "/api/v1/people",
        json={**PERSON, "display_name": "Naya"},
        headers={"Idempotency-Key": ""},
    ).status_code == 400
    assert http.post(
        "/api/v1/people",
        json={**PERSON, "display_name": "Naya"},
        headers={"Idempotency-Key": "not-a-uuid"},
    ).status_code == 400


def test_preference_catalog_and_boundaries_are_validated(client):
    http, _ = client
    http.post("/api/v1/auth/register", json=REGISTER)
    invalid_payloads = [
        {**PERSON, "communication_preferences": ["unknown"]},
        {**PERSON, "communication_preferences": ["visual_support", "visual_support"]},
        {**PERSON, "communication_preferences": ["visual_support"] * 11},
        {**PERSON, "accessibility_preferences": ["unknown"]},
        {**PERSON, "primary_language": "xx"},
    ]
    for payload in invalid_payloads:
        assert http.post(
            "/api/v1/people/onboarding",
            json=payload,
            headers={"Idempotency-Key": str(uuid4())},
        ).status_code == 422
