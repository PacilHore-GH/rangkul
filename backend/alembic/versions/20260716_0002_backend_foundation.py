from __future__ import annotations

from alembic import op
import sqlalchemy as sa

from app.db import Base
import app.models  # noqa: F401

revision = "20260716_0002"
down_revision = "20260716_05"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        bind.execute(sa.text("CREATE EXTENSION IF NOT EXISTS vector"))
    Base.metadata.create_all(bind)


def downgrade() -> None:
    bind = op.get_bind()
    Base.metadata.drop_all(bind)
