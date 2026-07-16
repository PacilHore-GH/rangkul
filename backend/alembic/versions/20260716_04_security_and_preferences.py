"""Add preferences, rate limits, and idempotency records."""

from alembic import op
import sqlalchemy as sa

revision = "20260716_04"
down_revision = "20260716_03"
branch_labels = None
depends_on = None


def upgrade() -> None:
    inspector = sa.inspect(op.get_bind())
    columns = {column["name"] for column in inspector.get_columns("person_profiles")}
    if "communication_preferences" not in columns:
        op.add_column("person_profiles", sa.Column("communication_preferences", sa.JSON(), nullable=True))
    if "accessibility_preferences" not in columns:
        op.add_column("person_profiles", sa.Column("accessibility_preferences", sa.JSON(), nullable=True))
    if "primary_language" not in columns:
        op.add_column("person_profiles", sa.Column("primary_language", sa.String(10), nullable=True))
    op.execute("UPDATE person_profiles SET communication_preferences = '[]', accessibility_preferences = '[]', primary_language = 'id'")
    with op.batch_alter_table("person_profiles") as batch_op:
        batch_op.alter_column("communication_preferences", nullable=False)
        batch_op.alter_column("accessibility_preferences", nullable=False)
        batch_op.alter_column("primary_language", nullable=False)

    if not inspector.has_table("rate_limit_counters"):
        op.create_table(
            "rate_limit_counters",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("scope", sa.String(50), nullable=False),
        sa.Column("subject_hash", sa.String(64), nullable=False),
        sa.Column("window_started_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("count", sa.Integer(), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("scope", "subject_hash", "window_started_at", name="uq_rate_limit_window"),
        )
    if not inspector.has_table("idempotency_records"):
        op.create_table(
            "idempotency_records",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("operation", sa.String(50), nullable=False),
        sa.Column("idempotency_key", sa.String(64), nullable=False),
        sa.Column("request_hash", sa.String(64), nullable=False),
        sa.Column("response_status", sa.Integer(), nullable=False),
        sa.Column("response_body", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("user_id", "operation", "idempotency_key", name="uq_idempotency_operation"),
        )


def downgrade() -> None:
    op.drop_table("idempotency_records")
    op.drop_table("rate_limit_counters")
    with op.batch_alter_table("person_profiles") as batch_op:
        batch_op.drop_column("primary_language")
        batch_op.drop_column("accessibility_preferences")
        batch_op.drop_column("communication_preferences")
