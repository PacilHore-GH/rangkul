import pytest

from app.models import User
from app.services import create_reset_token


VALID_REGISTER = {"email": "ibu@example.com", "password": "sangat-aman12", "full_name": "Ibu Rani", "terms_accepted": True}


def register(client, **changes):
    payload = {**VALID_REGISTER, **changes}
    return client.post("/api/v1/auth/register", json=payload)


def test_register_login_logout_and_profile_happy_path(client):
    http, _ = client
    response = register(http, email=" IBU@Example.com ")
    assert response.status_code == 201
    assert response.json()["email"] == "ibu@example.com"
    assert response.json()["role"] == "family"
    assert response.json()["has_profile"] is False
    assert http.get("/api/v1/auth/me").status_code == 200
    assert http.post("/api/v1/auth/logout").status_code == 204
    assert http.get("/api/v1/auth/me").status_code == 401
    assert http.post("/api/v1/auth/login", json={"email": "IBU@EXAMPLE.COM", "password": VALID_REGISTER["password"]}).status_code == 200


@pytest.mark.parametrize("password, expected", [("x" * 11, 422), ("x" * 12, 201), ("x" * 13, 201), ("x" * 127, 201), ("x" * 128, 201), ("x" * 129, 422)])
def test_register_password_bva(client, password, expected):
    http, _ = client
    response = register(http, email=f"{len(password)}@example.com", password=password)
    assert response.status_code == expected


@pytest.mark.parametrize("email", ["", "   ", "invalid", "a" * 245 + "@example.com"])
def test_register_rejects_invalid_email(client, email):
    http, _ = client
    assert register(http, email=email).status_code == 422


def test_register_rejects_duplicate_after_normalization_and_missing_terms(client):
    http, _ = client
    assert register(http, email="Care@Example.com").status_code == 201
    assert register(http, email=" care@example.com ").status_code == 409
    assert register(http, email="other@example.com", terms_accepted=False).status_code == 422


@pytest.mark.parametrize("name, expected", [(" ", 422), ("A", 201), ("A" * 80, 201), ("A" * 81, 422)])
def test_register_name_bva(client, name, expected):
    http, _ = client
    assert register(http, email=f"name{len(name)}@example.com", full_name=name).status_code == expected


def test_login_has_generic_invalid_credentials_and_protected_route_needs_cookie(client):
    http, _ = client
    assert http.get("/api/v1/auth/me").status_code == 401
    register(http)
    http.post("/api/v1/auth/logout")
    wrong_email = http.post("/api/v1/auth/login", json={"email": "no@example.com", "password": "wrong-password"})
    wrong_password = http.post("/api/v1/auth/login", json={"email": VALID_REGISTER["email"], "password": "wrong-password"})
    assert wrong_email.status_code == wrong_password.status_code == 401
    assert wrong_email.json()["detail"] == wrong_password.json()["detail"]


def test_reset_is_private_one_use_and_revokes_sessions(client):
    http, session_factory = client
    register(http)
    db = session_factory()
    user = db.query(User).filter_by(email=VALID_REGISTER["email"]).one()
    token = create_reset_token(db, user)
    db.close()
    assert http.post("/api/v1/auth/password-reset/request", json={"email": "missing@example.com"}).status_code == 202
    assert http.post("/api/v1/auth/password-reset/request", json={"email": VALID_REGISTER["email"]}).json() == {"message": "Jika email terdaftar, tautan reset telah dikirim."}
    response = http.post("/api/v1/auth/password-reset/confirm", json={"token": token, "new_password": "password-baru12"})
    assert response.status_code == 204
    assert http.get("/api/v1/auth/me").status_code == 401
    assert http.post("/api/v1/auth/password-reset/confirm", json={"token": token, "new_password": "password-baru12"}).status_code == 400
    assert http.post("/api/v1/auth/login", json={"email": VALID_REGISTER["email"], "password": "password-baru12"}).status_code == 200


@pytest.mark.parametrize("payload, expected", [
    ({"display_name": " ", "support_needs": ["communication"], "consent": True}, 422),
    ({"display_name": "A", "birth_year": 1899, "support_needs": ["communication"], "consent": True}, 422),
    ({"display_name": "A", "birth_year": 1900, "support_needs": ["communication"], "consent": True}, 201),
    ({"display_name": "A" * 80, "birth_year": 2026, "support_needs": ["communication"] * 1, "consent": True}, 201),
    ({"display_name": "A" * 81, "support_needs": ["communication"], "consent": True}, 422),
    ({"display_name": "A", "support_needs": [], "consent": True}, 422),
    ({"display_name": "A", "support_needs": ["not-a-code"], "consent": True}, 422),
    ({"display_name": "A", "support_needs": ["communication"], "notes": "x" * 1001, "consent": True}, 422),
    ({"display_name": "A", "support_needs": ["communication"], "consent": False}, 422),
])
def test_onboarding_input_bva_and_unhappy_cases(client, payload, expected):
    http, _ = client
    register(http, email=f"case{abs(hash(str(payload))) % 100000}@example.com")
    assert http.post("/api/v1/people", json=payload).status_code == expected


def test_onboarding_happy_path_second_profile_and_unauthorized(client):
    http, _ = client
    assert http.post("/api/v1/people", json={}).status_code == 401
    register(http)
    payload = {"display_name": "Adit", "birth_year": 2020, "support_needs": ["communication", "sensory"], "notes": "Suka rutinitas.", "consent": True}
    assert http.post("/api/v1/people", json=payload).status_code == 201
    assert http.get("/api/v1/people/me").json()["display_name"] == "Adit"
    assert http.post("/api/v1/people", json=payload).status_code == 409
