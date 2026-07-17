from __future__ import annotations

from io import BytesIO
from uuid import UUID

from conftest import register_and_login


def auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def test_registration_login_and_refresh(client):
    registered = register_and_login(client, "family@example.com", "family_member_caregiver")
    assert registered["user"]["role"] == "family_member_caregiver"

    login = client.post("/api/v1/auth/login", json={"email": "family@example.com", "password": "Secret123!"})
    assert login.status_code == 200

    refresh = client.post("/api/v1/auth/refresh", json={"refresh_token": login.json()["tokens"]["refresh_token"]})
    assert refresh.status_code == 200
    assert refresh.json()["token_type"] == "bearer"


def test_family_person_profile_access_and_professional_boundary(client):
    family = register_and_login(client, "family@example.com", "family_member_caregiver")
    professional = register_and_login(client, "pro@example.com", "professional")
    outsider = register_and_login(client, "other@example.com", "family_member_caregiver")

    profile = client.post(
        "/api/v1/auth/people",
        json={"display_name": "Raka"},
        headers=auth_headers(family["tokens"]["access_token"]),
    )
    assert profile.status_code == 201
    person_id = profile.json()["id"]

    grant = client.post(
        f"/api/v1/auth/people/{person_id}/access-grants",
        json={
            "user_id": professional["user"]["id"],
            "access_role": "professional",
            "can_view_raw_media": False,
        },
        headers=auth_headers(family["tokens"]["access_token"]),
    )
    assert grant.status_code == 201

    templates = client.get("/api/v1/checkpoint-templates")
    template_id = templates.json()[0]["id"]

    outsider_create = client.post(
        f"/api/v1/people/{person_id}/checkpoints",
        json={
            "template_id": template_id,
            "capture_mode": "voice",
            "raw_retention_mode": "privacy_first",
            "consent": {"capture": True, "analysis": True, "professional_sharing": True},
            "client_request_id": "11111111-1111-1111-1111-111111111111",
        },
        headers=auth_headers(outsider["tokens"]["access_token"]),
    )
    assert outsider_create.status_code == 404

    professional_create = client.post(
        f"/api/v1/people/{person_id}/checkpoints",
        json={
            "template_id": template_id,
            "capture_mode": "voice",
            "raw_retention_mode": "privacy_first",
            "consent": {"capture": True, "analysis": True, "professional_sharing": True},
            "client_request_id": "22222222-2222-2222-2222-222222222222",
        },
        headers=auth_headers(professional["tokens"]["access_token"]),
    )
    assert professional_create.status_code == 201


def test_checkpoint_presigned_upload_submit_and_results(client):
    family = register_and_login(client, "family@example.com", "family_member_caregiver")
    profile = client.post(
        "/api/v1/auth/people",
        json={"display_name": "Raka"},
        headers=auth_headers(family["tokens"]["access_token"]),
    )
    person_id = profile.json()["id"]
    template_id = client.get("/api/v1/checkpoint-templates").json()[0]["id"]

    checkpoint = client.post(
        f"/api/v1/people/{person_id}/checkpoints",
        json={
            "template_id": template_id,
            "capture_mode": "voice",
            "raw_retention_mode": "privacy_first",
            "consent": {"capture": True, "analysis": True, "professional_sharing": True},
            "client_request_id": "33333333-3333-3333-3333-333333333333",
        },
        headers=auth_headers(family["tokens"]["access_token"]),
    )
    assert checkpoint.status_code == 201
    checkpoint_id = checkpoint.json()["id"]

    presign = client.post(
        f"/api/v1/checkpoints/{checkpoint_id}/assets/presign",
        json={"filename": "voice.wav", "content_type": "audio/wav", "size_bytes": 5},
        headers=auth_headers(family["tokens"]["access_token"]),
    )
    assert presign.status_code == 200
    object_key = presign.json()["object_key"]

    upload = client.put(
        f"/api/v1/storage/local-upload/{object_key}",
        files={"file": ("voice.wav", BytesIO(b"12345"), "audio/wav")},
    )
    assert upload.status_code == 200

    complete = client.post(
        f"/api/v1/checkpoints/{checkpoint_id}/assets/complete",
        json={"object_key": object_key, "content_type": "audio/wav", "size_bytes": 5, "sha256": None},
        headers=auth_headers(family["tokens"]["access_token"]),
    )
    assert complete.status_code == 200
    assert complete.json()["status"] == "asset_uploaded"

    submit = client.post(
        f"/api/v1/checkpoints/{checkpoint_id}/submit",
        headers=auth_headers(family["tokens"]["access_token"]),
    )
    assert submit.status_code == 200

    results = client.get(f"/api/v1/checkpoints/{checkpoint_id}/results", headers=auth_headers(family["tokens"]["access_token"]))
    assert results.status_code == 200
    assert results.json()["speech"]["embedding_dimension"] == 1280

    report = client.get(f"/api/v1/checkpoints/{checkpoint_id}/report", headers=auth_headers(family["tokens"]["access_token"]))
    assert report.status_code == 200
    assert report.json()["requires_professional_approval"] is True


def test_duplicate_submit_is_idempotent(client):
    family = register_and_login(client, "family@example.com", "family_member_caregiver")
    profile = client.post("/api/v1/auth/people", json={"display_name": "Raka"}, headers=auth_headers(family["tokens"]["access_token"]))
    person_id = profile.json()["id"]
    template_id = client.get("/api/v1/checkpoint-templates").json()[0]["id"]
    checkpoint = client.post(
        f"/api/v1/people/{person_id}/checkpoints",
        json={
            "template_id": template_id,
            "capture_mode": "voice",
            "raw_retention_mode": "privacy_first",
            "consent": {"capture": True, "analysis": True, "professional_sharing": True},
            "client_request_id": "44444444-4444-4444-4444-444444444444",
        },
        headers=auth_headers(family["tokens"]["access_token"]),
    )
    checkpoint_id = checkpoint.json()["id"]
    presign = client.post(
        f"/api/v1/checkpoints/{checkpoint_id}/assets/presign",
        json={"filename": "voice.wav", "content_type": "audio/wav", "size_bytes": 5},
        headers=auth_headers(family["tokens"]["access_token"]),
    )
    object_key = presign.json()["object_key"]
    client.put(f"/api/v1/storage/local-upload/{object_key}", files={"file": ("voice.wav", BytesIO(b"12345"), "audio/wav")})
    client.post(
        f"/api/v1/checkpoints/{checkpoint_id}/assets/complete",
        json={"object_key": object_key, "content_type": "audio/wav", "size_bytes": 5},
        headers=auth_headers(family["tokens"]["access_token"]),
    )
    first = client.post(f"/api/v1/checkpoints/{checkpoint_id}/submit", headers=auth_headers(family["tokens"]["access_token"]))
    second = client.post(f"/api/v1/checkpoints/{checkpoint_id}/submit", headers=auth_headers(family["tokens"]["access_token"]))
    assert first.status_code == 200
    assert second.status_code == 200
    assert second.json()["processing_version"] == first.json()["processing_version"]


def test_unauthorized_object_access_returns_not_found(client):
    family = register_and_login(client, "family@example.com", "family_member_caregiver")
    outsider = register_and_login(client, "other@example.com", "family_member_caregiver")
    profile = client.post("/api/v1/auth/people", json={"display_name": "Raka"}, headers=auth_headers(family["tokens"]["access_token"]))
    person_id = profile.json()["id"]
    template_id = client.get("/api/v1/checkpoint-templates").json()[0]["id"]
    checkpoint = client.post(
        f"/api/v1/people/{person_id}/checkpoints",
        json={
            "template_id": template_id,
            "capture_mode": "voice",
            "raw_retention_mode": "privacy_first",
            "consent": {"capture": True, "analysis": True, "professional_sharing": True},
            "client_request_id": "55555555-5555-5555-5555-555555555555",
        },
        headers=auth_headers(family["tokens"]["access_token"]),
    )
    checkpoint_id = checkpoint.json()["id"]
    presign = client.post(
        f"/api/v1/checkpoints/{checkpoint_id}/assets/presign",
        json={"filename": "voice.wav", "content_type": "audio/wav", "size_bytes": 5},
        headers=auth_headers(family["tokens"]["access_token"]),
    )
    object_key = presign.json()["object_key"]
    client.put(f"/api/v1/storage/local-upload/{object_key}", files={"file": ("voice.wav", BytesIO(b"12345"), "audio/wav")})
    client.post(
        f"/api/v1/checkpoints/{checkpoint_id}/assets/complete",
        json={"object_key": object_key, "content_type": "audio/wav", "size_bytes": 5},
        headers=auth_headers(family["tokens"]["access_token"]),
    )

    from app.db import SessionLocal
    from app.models import CheckpointAsset
    from sqlalchemy import select

    with SessionLocal() as session:
        asset = session.scalar(select(CheckpointAsset).where(CheckpointAsset.checkpoint_id == UUID(checkpoint_id)))

    response = client.get(
        f"/api/v1/checkpoints/{checkpoint_id}/assets/{asset.id}/download",
        headers=auth_headers(outsider["tokens"]["access_token"]),
    )
    assert response.status_code == 404
