import os

# Tests must not inherit deployment/editor variables from the parent process.
# Some Git clients set DEBUG=release, which is not a valid boolean for Settings.
os.environ["DEBUG"] = "False"
os.environ["DATABASE_URL"] = "sqlite:///./test_rangkul.db"
os.environ["JWT_SECRET_KEY"] = "test-secret-key-with-at-least-thirty-two-characters"
os.environ["COOKIE_SECURE"] = "False"
os.environ["COOKIE_SAMESITE"] = "lax"
os.environ["TRUSTED_ORIGINS"] = '["http://testserver"]'
os.environ["CSRF_ENABLED"] = "True"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db import Base, get_db
from app.main import app


@pytest.fixture()
def client(tmp_path):
    engine = create_engine(f"sqlite:///{tmp_path / 'test.db'}", connect_args={"check_same_thread": False})
    testing_session = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)

    def override_db():
        db = testing_session()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_db
    with TestClient(app, headers={
        "Origin": "http://testserver",
        "Idempotency-Key": "11111111-1111-4111-8111-111111111111",
    }) as test_client:
        yield test_client, testing_session
    app.dependency_overrides.clear()
