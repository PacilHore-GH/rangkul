"""Add caregiver relationships, role constraint, and facilities."""

from datetime import datetime, timezone
from uuid import uuid4

from alembic import op
import sqlalchemy as sa

revision = "20260716_05"
down_revision = "20260716_04"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    checks = {item.get("name") for item in inspector.get_check_constraints("users")}
    if "ck_users_role" not in checks:
        with op.batch_alter_table("users") as batch_op:
            batch_op.create_check_constraint(
                "ck_users_role", "role IN ('family', 'professional', 'admin')",
            )

    if not inspector.has_table("person_relationships"):
        op.create_table(
            "person_relationships",
            sa.Column("id", sa.String(36), primary_key=True),
            sa.Column("person_id", sa.String(36), sa.ForeignKey("person_profiles.id", ondelete="CASCADE")),
            sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE")),
            sa.Column("relationship_type", sa.String(30), nullable=False),
            sa.Column("is_primary", sa.Boolean(), nullable=False),
            sa.Column("status", sa.String(20), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
            sa.UniqueConstraint("person_id", "user_id", "is_primary", name="uq_person_primary_relationship"),
            sa.CheckConstraint(
                "relationship_type IN ('parent','guardian','sibling','extended_family','caregiver','other','unspecified')",
                name="ck_person_relationship_type",
            ),
            sa.CheckConstraint("status IN ('active','revoked')", name="ck_person_relationship_status"),
        )
        op.create_index("ix_person_relationships_person_id", "person_relationships", ["person_id"])
        op.create_index("ix_person_relationships_user_id", "person_relationships", ["user_id"])

    profiles = bind.execute(sa.text(
        "SELECT p.id, p.owner_user_id FROM person_profiles p "
        "LEFT JOIN person_relationships r "
        "ON r.person_id = p.id AND r.user_id = p.owner_user_id AND r.is_primary = true "
        "WHERE r.id IS NULL"
    )).mappings()
    now = datetime.now(timezone.utc)
    relationship_table = sa.table(
        "person_relationships",
        sa.column("id"), sa.column("person_id"), sa.column("user_id"),
        sa.column("relationship_type"), sa.column("is_primary"), sa.column("status"),
        sa.column("created_at"), sa.column("updated_at"),
    )
    for profile in profiles:
        bind.execute(relationship_table.insert().values(
            id=str(uuid4()),
            person_id=profile["id"],
            user_id=profile["owner_user_id"],
            relationship_type="unspecified",
            is_primary=True,
            status="active",
            created_at=now,
            updated_at=now,
        ))

    if not inspector.has_table("facilities"):
        op.create_table(
            "facilities",
            sa.Column("id", sa.String(36), primary_key=True),
            sa.Column("name", sa.String(120), nullable=False),
            sa.Column("facility_type", sa.String(30), nullable=False),
            sa.Column("description", sa.Text()),
            sa.Column("services", sa.JSON(), nullable=False),
            sa.Column("address", sa.String(300), nullable=False),
            sa.Column("city", sa.String(80), nullable=False),
            sa.Column("province", sa.String(80), nullable=False),
            sa.Column("latitude", sa.Float()),
            sa.Column("longitude", sa.Float()),
            sa.Column("phone", sa.String(30)),
            sa.Column("website", sa.String(500)),
            sa.Column("source_name", sa.String(120), nullable=False),
            sa.Column("source_url", sa.String(500), nullable=False),
            sa.Column("is_active", sa.Boolean(), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
            sa.CheckConstraint(
                "facility_type IN ('hospital','clinic','therapy_center','school','community_service')",
                name="ck_facility_type",
            ),
        )


def downgrade() -> None:
    op.drop_table("facilities")
    op.drop_index("ix_person_relationships_user_id", table_name="person_relationships")
    op.drop_index("ix_person_relationships_person_id", table_name="person_relationships")
    op.drop_table("person_relationships")
    with op.batch_alter_table("users") as batch_op:
        batch_op.drop_constraint("ck_users_role", type_="check")
