"""Allow one caregiver to manage multiple Person Profiles."""

from alembic import op
import sqlalchemy as sa

revision = "20260716_03"
down_revision = "20260716_02"
branch_labels = None
depends_on = None


def _has_owner_unique_constraint() -> bool:
    constraints = sa.inspect(op.get_bind()).get_unique_constraints("person_profiles")
    return any(constraint["name"] == "uq_person_profile_owner" for constraint in constraints)


def upgrade() -> None:
    if _has_owner_unique_constraint():
        with op.batch_alter_table("person_profiles") as batch_op:
            batch_op.drop_constraint("uq_person_profile_owner", type_="unique")
    op.create_index(
        "ix_person_profiles_owner_user_id",
        "person_profiles",
        ["owner_user_id"],
        unique=False,
        if_not_exists=True,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_person_profiles_owner_user_id",
        table_name="person_profiles",
        if_exists=True,
    )
    with op.batch_alter_table("person_profiles") as batch_op:
        batch_op.create_unique_constraint("uq_person_profile_owner", ["owner_user_id"])
