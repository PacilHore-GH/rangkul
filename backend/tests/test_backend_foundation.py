from __future__ import annotations

from io import BytesIO
from uuid import uuid4

from sqlalchemy import select

from app.core.config import settings
from app.models import CheckpointAsset, PersonRelationship, User, utcnow
from app.modules.identity.service import create_session, hash_password


PASSWORD = "Secret-Test12!"


def session_headers(token: str) -> dict[str, str]:
    return {"Cookie": f"{settings.SESSION_COOKIE_NAME}={token}"}


def create_identity(client, email: str, role: str = "family") -> dict:
    _, session_factory = client
    with session_factory() as db:
        user = User(
            email=email,
            password_hash=hash_password(PASSWORD),
            full_name="Test User",
            role=role,
            onboarding_completed_at=utcnow() if role == "family" else None,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        token = create_session(db, user)
        return {"user": {"id": user.id, "role": user.role}, "token": token}


def create_person(client, identity: dict, display_name: str = "Raka") -> str:
    http, _ = client
    response = http.post(
        "/api/v1/people",
        json={
            "display_name": display_name,
            "birth_year": 2020,
            "support_needs": ["communication"],
            "communication_preferences": [],
            "accessibility_preferences": [],
            "primary_language": "id",
            "notes": None,
            "caregiver_relationship": "parent",
            "consent": True,
        },
        headers={**session_headers(identity["token"]), "Idempotency-Key": str(uuid4())},
    )
    assert response.status_code == 201, response.text
    return response.json()["id"]


def create_checkpoint(client, identity: dict, person_id: str, request_id: str) -> dict:
    http, _ = client
    template_id = http.get("/api/v1/checkpoint-templates").json()[0]["id"]
    response = http.post(
        f"/api/v1/people/{person_id}/checkpoints",
        json={
            "template_id": template_id,
            "capture_mode": "voice",
            "raw_retention_mode": "privacy_first",
            "consent": {"capture": True, "analysis": True, "professional_sharing": True},
            "client_request_id": request_id,
        },
        headers=session_headers(identity["token"]),
    )
    assert response.status_code == 201, response.text
    return response.json()


def upload_checkpoint_asset(client, identity: dict, checkpoint_id: str) -> str:
    http, _ = client
    headers = session_headers(identity["token"])
    presign = http.post(
        f"/api/v1/checkpoints/{checkpoint_id}/assets/presign",
        json={"filename": "voice.wav", "content_type": "audio/wav", "size_bytes": 5},
        headers=headers,
    )
    assert presign.status_code == 200, presign.text
    object_key = presign.json()["object_key"]
    upload = http.put(
        f"/api/v1/storage/local-upload/{object_key}",
        files={"file": ("voice.wav", BytesIO(b"12345"), "audio/wav")},
    )
    assert upload.status_code == 200, upload.text
    complete = http.post(
        f"/api/v1/checkpoints/{checkpoint_id}/assets/complete",
        json={"object_key": object_key, "content_type": "audio/wav", "size_bytes": 5, "sha256": None},
        headers=headers,
    )
    assert complete.status_code == 200, complete.text
    return object_key


def test_registration_login_and_current_session(client):
    http, _ = client
    registered = http.post(
        "/api/v1/auth/register",
        json={
            "email": "family@example.com",
            "password": PASSWORD,
            "full_name": "Family Member",
            "terms_accepted": True,
        },
    )
    assert registered.status_code == 201
    assert registered.json()["role"] == "family"

    login = http.post("/api/v1/auth/login", json={"email": "family@example.com", "password": PASSWORD})
    assert login.status_code == 200
    assert http.get("/api/v1/auth/me").status_code == 200


def test_family_person_profile_access_and_professional_boundary(client):
    http, session_factory = client
    family = create_identity(client, "family@example.com")
    professional = create_identity(client, "pro@example.com", "professional")
    outsider = create_identity(client, "other@example.com")
    person_id = create_person(client, family)

    with session_factory() as db:
        db.add(
            PersonRelationship(
                person_id=person_id,
                user_id=professional["user"]["id"],
                relationship_type="caregiver",
                is_primary=False,
                status="active",
            )
        )
        db.commit()

    template_id = http.get("/api/v1/checkpoint-templates").json()[0]["id"]
    payload = {
        "template_id": template_id,
        "capture_mode": "voice",
        "raw_retention_mode": "privacy_first",
        "consent": {"capture": True, "analysis": True, "professional_sharing": True},
        "client_request_id": "11111111-1111-4111-8111-111111111111",
    }
    outsider_create = http.post(
        f"/api/v1/people/{person_id}/checkpoints",
        json=payload,
        headers=session_headers(outsider["token"]),
    )
    assert outsider_create.status_code == 404

    payload["client_request_id"] = "22222222-2222-4222-8222-222222222222"
    professional_create = http.post(
        f"/api/v1/people/{person_id}/checkpoints",
        json=payload,
        headers=session_headers(professional["token"]),
    )
    assert professional_create.status_code == 201


def test_checkpoint_presigned_upload_submit_and_results(client):
    http, _ = client
    family = create_identity(client, "family@example.com")
    person_id = create_person(client, family)
    checkpoint = create_checkpoint(client, family, person_id, "33333333-3333-4333-8333-333333333333")
    checkpoint_id = checkpoint["id"]
    upload_checkpoint_asset(client, family, checkpoint_id)

    headers = session_headers(family["token"])
    submit = http.post(f"/api/v1/checkpoints/{checkpoint_id}/submit", headers=headers)
    assert submit.status_code == 200
    results = http.get(f"/api/v1/checkpoints/{checkpoint_id}/results", headers=headers)
    assert results.status_code == 200
    assert results.json()["speech"]["embedding_dimension"] == 1280
    report = http.get(f"/api/v1/checkpoints/{checkpoint_id}/report", headers=headers)
    assert report.status_code == 200
    assert report.json()["requires_professional_approval"] is True


def test_duplicate_submit_is_idempotent(client):
    http, _ = client
    family = create_identity(client, "family@example.com")
    person_id = create_person(client, family)
    checkpoint = create_checkpoint(client, family, person_id, "44444444-4444-4444-8444-444444444444")
    checkpoint_id = checkpoint["id"]
    upload_checkpoint_asset(client, family, checkpoint_id)
    headers = session_headers(family["token"])

    first = http.post(f"/api/v1/checkpoints/{checkpoint_id}/submit", headers=headers)
    second = http.post(f"/api/v1/checkpoints/{checkpoint_id}/submit", headers=headers)
    assert first.status_code == 200
    assert second.status_code == 200
    assert second.json()["processing_version"] == first.json()["processing_version"]


def test_unauthorized_object_access_returns_not_found(client):
    http, session_factory = client
    family = create_identity(client, "family@example.com")
    outsider = create_identity(client, "other@example.com")
    person_id = create_person(client, family)
    checkpoint = create_checkpoint(client, family, person_id, "55555555-5555-4555-8555-555555555555")
    checkpoint_id = checkpoint["id"]
    upload_checkpoint_asset(client, family, checkpoint_id)

    with session_factory() as db:
        asset = db.scalar(select(CheckpointAsset).where(CheckpointAsset.checkpoint_id == checkpoint_id))
        assert asset is not None
        asset_id = asset.id

    response = http.get(
        f"/api/v1/checkpoints/{checkpoint_id}/assets/{asset_id}/download",
        headers=session_headers(outsider["token"]),
    )
    assert response.status_code == 404
