"""Shared password-strength policy for account creation and credential reset."""

import re

MIN_PASSWORD_LENGTH = 12
MAX_PASSWORD_LENGTH = 128


def validate_password_strength(password: str) -> str:
    if not MIN_PASSWORD_LENGTH <= len(password) <= MAX_PASSWORD_LENGTH:
        raise ValueError(f"Kata sandi harus terdiri dari {MIN_PASSWORD_LENGTH}–{MAX_PASSWORD_LENGTH} karakter.")
    if any(character.isspace() for character in password):
        raise ValueError("Kata sandi tidak boleh mengandung spasi.")
    if not re.search(r"[a-z]", password):
        raise ValueError("Kata sandi harus memiliki huruf kecil.")
    if not re.search(r"[A-Z]", password):
        raise ValueError("Kata sandi harus memiliki huruf besar.")
    if not re.search(r"\d", password):
        raise ValueError("Kata sandi harus memiliki angka.")
    if not re.search(r"[^\w\s]", password):
        raise ValueError("Kata sandi harus memiliki simbol.")
    return password
