import pytest

from app.models import User
from app.modules.identity.service import hash_password
from app.scripts import seed_admin as seed_module


def test_seed_admin_is_idempotent(client, monkeypatch):
    _, session_factory = client
    monkeypatch.setattr(seed_module, "SessionLocal", session_factory)
    first = seed_module.seed_admin(" ADMIN@EXAMPLE.COM ", "Password-Admin12!", " Admin Rangkul ")
    second = seed_module.seed_admin("admin@example.com", "Password-Admin12!", "Admin Rangkul")
    assert first.id == second.id
    db = session_factory()
    assert db.query(User).filter_by(role="admin").count() == 1
    db.close()


def test_seed_admin_rejects_invalid_input_and_role_conflict(client, monkeypatch):
    _, session_factory = client
    monkeypatch.setattr(seed_module, "SessionLocal", session_factory)
    with pytest.raises(ValueError):
        seed_module.seed_admin("invalid", "Password-Admin12!", "Admin")
    with pytest.raises(ValueError):
        seed_module.seed_admin("admin@example.com", "weak", "Admin")
    db = session_factory()
    db.add(User(
        email="family@example.com",
        password_hash=hash_password("Password-Admin12!"),
        full_name="Family",
        role="family",
    ))
    db.commit()
    db.close()
    with pytest.raises(ValueError):
        seed_module.seed_admin("family@example.com", "Password-Admin12!", "Admin")
