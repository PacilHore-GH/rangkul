import hashlib
from datetime import timedelta

import jwt

from app.core.config import settings
from app.models import Session, utcnow


REGISTER = {
    "email": "session-owner@example.com",
    "password": "Password-Aman12!",
    "full_name": "Pemilik Session",
    "terms_accepted": True,
}


def test_session_cookie_and_jwt_are_bound_to_the_server_session(client):
    http, session_factory = client
    response = http.post("/api/v1/auth/register", json=REGISTER)

    encoded_token = response.cookies[settings.SESSION_COOKIE_NAME]
    set_cookie = response.headers["set-cookie"].lower()
    claims = jwt.decode(encoded_token, settings.JWT_SECRET_KEY, algorithms=["HS256"])

    assert "httponly" in set_cookie
    assert "samesite=lax" in set_cookie
    assert "path=/" in set_cookie
    assert claims["typ"] == "session"
    assert claims["sub"] == response.json()["id"]
    assert isinstance(claims["sid"], str)
    assert isinstance(claims["jti"], str)
    assert claims["iat"] < claims["exp"]

    db = session_factory()
    session = db.get(Session, claims["sid"])
    assert session is not None
    assert session.user_id == claims["sub"]
    assert session.token_hash == hashlib.sha256(claims["jti"].encode()).hexdigest()
    assert session.token_hash != claims["jti"]
    assert encoded_token not in session.token_hash
    db.close()


def test_signed_jwt_with_wrong_user_binding_or_malformed_claims_is_rejected(client):
    http, _ = client
    response = http.post("/api/v1/auth/register", json=REGISTER)
    encoded_token = response.cookies[settings.SESSION_COOKIE_NAME]
    claims = jwt.decode(encoded_token, settings.JWT_SECRET_KEY, algorithms=["HS256"])

    wrong_subject = jwt.encode(
        {**claims, "sub": "another-user"},
        settings.JWT_SECRET_KEY,
        algorithm="HS256",
    )
    malformed_jti = jwt.encode(
        {**claims, "jti": 123},
        settings.JWT_SECRET_KEY,
        algorithm="HS256",
    )

    http.cookies.set(settings.SESSION_COOKIE_NAME, wrong_subject)
    assert http.get("/api/v1/auth/me").status_code == 401
    http.cookies.set(settings.SESSION_COOKIE_NAME, malformed_jti)
    assert http.get("/api/v1/auth/me").status_code == 401


def test_jwt_expiry_and_server_session_expiry_are_both_enforced(client):
    http, session_factory = client
    response = http.post("/api/v1/auth/register", json=REGISTER)
    encoded_token = response.cookies[settings.SESSION_COOKIE_NAME]
    claims = jwt.decode(encoded_token, settings.JWT_SECRET_KEY, algorithms=["HS256"])

    expired_jwt = jwt.encode(
        {**claims, "exp": utcnow() - timedelta(seconds=1)},
        settings.JWT_SECRET_KEY,
        algorithm="HS256",
    )
    http.cookies.set(settings.SESSION_COOKIE_NAME, expired_jwt)
    assert http.get("/api/v1/auth/me").status_code == 401

    db = session_factory()
    session = db.get(Session, claims["sid"])
    session.expires_at = utcnow() - timedelta(seconds=1)
    db.commit()
    db.close()
    http.cookies.set(settings.SESSION_COOKIE_NAME, encoded_token)
    assert http.get("/api/v1/auth/me").status_code == 401
