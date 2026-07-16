"""Start a disposable SQLite-backed API for Playwright."""

import os
from pathlib import Path

from alembic import command
from alembic.config import Config
import uvicorn

os.environ.update({
    "DEBUG": "False",
    "DATABASE_URL": "sqlite:///./e2e_rangkul.db",
    "JWT_SECRET_KEY": "e2e-secret-key-with-at-least-thirty-two-characters",
    "COOKIE_SECURE": "False",
    "COOKIE_SAMESITE": "lax",
    "CSRF_ENABLED": "True",
    "TRUSTED_ORIGINS": '["http://127.0.0.1:3000","http://localhost:3000"]',
    "CORS_ORIGINS": '["http://127.0.0.1:3000","http://localhost:3000"]',
    "MAILER_BACKEND": "fake",
})

database_path = Path("e2e_rangkul.db").resolve()
if database_path.name != "e2e_rangkul.db":
    raise RuntimeError("Refusing to remove an unexpected database path.")
database_path.unlink(missing_ok=True)

command.upgrade(Config("alembic.ini"), "head")
uvicorn.run("app.main:app", host="127.0.0.1", port=8000)
