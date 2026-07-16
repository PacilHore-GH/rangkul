"""Add an onboarding milestone independent from Person Profile existence."""

from alembic import op
import sqlalchemy as sa

revision = "20260716_02"
down_revision = "20260716_01"
branch_labels = None
depends_on = None


def upgrade() -> None:
    columns = {column["name"] for column in sa.inspect(op.get_bind()).get_columns("users")}
    if "onboarding_completed_at" not in columns:
        op.add_column("users", sa.Column("onboarding_completed_at", sa.DateTime(timezone=True), nullable=True))
    op.execute(
        "UPDATE users SET onboarding_completed_at = created_at "
        "WHERE id IN (SELECT owner_user_id FROM person_profiles)"
    )


def downgrade() -> None:
    op.drop_column("users", "onboarding_completed_at")
