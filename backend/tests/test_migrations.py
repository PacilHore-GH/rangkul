from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, inspect, text

from app.db import Base


def test_upgrade_adopts_an_existing_unversioned_schema(tmp_path, monkeypatch):
    """A legacy create_all database must be adopted without deleting its data."""
    database_path = tmp_path / "legacy.db"
    database_url = f"sqlite:///{database_path.as_posix()}"
    engine = create_engine(database_url)
    Base.metadata.create_all(engine)

    with engine.begin() as connection:
        connection.execute(
            text(
                "INSERT INTO users "
                "(id, email, password_hash, full_name, role, created_at) "
                "VALUES ('legacy-user', 'legacy@example.com', 'hash', "
                "'Legacy User', 'family', CURRENT_TIMESTAMP)"
            )
        )

    monkeypatch.setenv("DATABASE_URL", database_url)
    config = Config("alembic.ini")
    command.upgrade(config, "head")

    with engine.connect() as connection:
        assert connection.execute(text("SELECT version_num FROM alembic_version")).scalar_one() == "20260716_03"
        assert connection.execute(text("SELECT email FROM users WHERE id = 'legacy-user'")).scalar_one() == (
            "legacy@example.com"
        )
        assert "onboarding_completed_at" in {
            column["name"] for column in inspect(connection).get_columns("users")
        }
