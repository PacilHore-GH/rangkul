"""Create auth and onboarding tables."""

from alembic import op
import sqlalchemy as sa

revision = "20260716_01"
down_revision = None
branch_labels = None
depends_on = None


def _table_exists(table_name: str) -> bool:
    return sa.inspect(op.get_bind()).has_table(table_name)


def _index_exists(table_name: str, index_name: str) -> bool:
    if not _table_exists(table_name):
        return False
    indexes = sa.inspect(op.get_bind()).get_indexes(table_name)
    return any(index["name"] == index_name for index in indexes)


def upgrade() -> None:
    # Legacy development builds created the schema through SQLAlchemy
    # ``create_all`` before Alembic was introduced. Adopt those tables in
    # place so existing data is preserved while Alembic records its baseline.
    if not _table_exists("users"):
        op.create_table("users", sa.Column("id", sa.String(36), primary_key=True), sa.Column("email", sa.String(254), nullable=False), sa.Column("password_hash", sa.String(255), nullable=False), sa.Column("full_name", sa.String(80), nullable=False), sa.Column("role", sa.String(20), nullable=False), sa.Column("created_at", sa.DateTime(timezone=True), nullable=False))
    if not _index_exists("users", "ix_users_email"):
        op.create_index("ix_users_email", "users", ["email"], unique=True)

    if not _table_exists("sessions"):
        op.create_table("sessions", sa.Column("id", sa.String(36), primary_key=True), sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False), sa.Column("token_hash", sa.String(64), nullable=False, unique=True), sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False), sa.Column("revoked_at", sa.DateTime(timezone=True)), sa.Column("created_at", sa.DateTime(timezone=True), nullable=False))
    if not _index_exists("sessions", "ix_sessions_user_id"):
        op.create_index("ix_sessions_user_id", "sessions", ["user_id"])

    if not _table_exists("password_reset_tokens"):
        op.create_table("password_reset_tokens", sa.Column("id", sa.String(36), primary_key=True), sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False), sa.Column("token_hash", sa.String(64), nullable=False, unique=True), sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False), sa.Column("used_at", sa.DateTime(timezone=True)))
    if not _index_exists("password_reset_tokens", "ix_password_reset_tokens_user_id"):
        op.create_index("ix_password_reset_tokens_user_id", "password_reset_tokens", ["user_id"])

    if not _table_exists("person_profiles"):
        op.create_table("person_profiles", sa.Column("id", sa.String(36), primary_key=True), sa.Column("owner_user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False), sa.Column("display_name", sa.String(80), nullable=False), sa.Column("birth_year", sa.Integer()), sa.Column("support_needs", sa.JSON(), nullable=False), sa.Column("notes", sa.Text()), sa.Column("consented_at", sa.DateTime(timezone=True), nullable=False), sa.Column("created_at", sa.DateTime(timezone=True), nullable=False), sa.UniqueConstraint("owner_user_id", name="uq_person_profile_owner"))


def downgrade() -> None:
    op.drop_table("person_profiles")
    op.drop_index("ix_password_reset_tokens_user_id", table_name="password_reset_tokens")
    op.drop_table("password_reset_tokens")
    op.drop_index("ix_sessions_user_id", table_name="sessions")
    op.drop_table("sessions")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
