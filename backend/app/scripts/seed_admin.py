"""Idempotently provision the internal demo administrator."""

import os

from email_validator import EmailNotValidError, validate_email
from sqlalchemy import select

from app.db import SessionLocal
from app.models import User
from app.modules.identity.password_policy import validate_password_strength
from app.modules.identity.service import hash_password, normalize_email


def seed_admin(email: str, password: str, full_name: str) -> User:
    email = normalize_email(email)
    try:
        email = normalize_email(validate_email(email, check_deliverability=False).normalized)
    except EmailNotValidError as exc:
        raise ValueError("ADMIN_EMAIL tidak valid.") from exc
    password = validate_password_strength(password)
    full_name = " ".join(full_name.split())
    if not 1 <= len(full_name) <= 80:
        raise ValueError("ADMIN_FULL_NAME harus berisi 1-80 karakter.")

    db = SessionLocal()
    try:
        existing = db.scalar(select(User).where(User.email == email))
        if existing:
            if existing.role != "admin":
                raise ValueError("Email sudah digunakan oleh akun non-Admin.")
            return existing
        admin = User(
            email=email,
            password_hash=hash_password(password),
            full_name=full_name,
            role="admin",
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
        return admin
    finally:
        db.close()


def main() -> None:
    email = os.environ.get("ADMIN_EMAIL", "")
    password = os.environ.get("ADMIN_PASSWORD", "")
    full_name = os.environ.get("ADMIN_FULL_NAME", "Admin Rangkul")
    admin = seed_admin(email, password, full_name)
    print(f"Admin siap: {admin.email}")


if __name__ == "__main__":
    main()
