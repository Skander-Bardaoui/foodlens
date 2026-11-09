"""store recipe payload columns as jsonb

Revision ID: 0003_jsonb_payloads
Revises: 0002_rename_image_url
Create Date: 2026-11-09
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0003_jsonb_payloads"
down_revision = "0002_rename_image_url"
branch_labels = None
depends_on = None

PAYLOAD_COLUMNS = ("top3", "ingredients", "steps")


def upgrade() -> None:
    for column in PAYLOAD_COLUMNS:
        op.alter_column(
            "analyses",
            column,
            type_=postgresql.JSONB(astext_type=sa.Text()),
            existing_type=sa.JSON(),
            existing_nullable=False,
            postgresql_using=f"{column}::jsonb",
        )


def downgrade() -> None:
    for column in PAYLOAD_COLUMNS:
        op.alter_column(
            "analyses",
            column,
            type_=sa.JSON(),
            existing_type=postgresql.JSONB(astext_type=sa.Text()),
            existing_nullable=False,
            postgresql_using=f"{column}::json",
        )
