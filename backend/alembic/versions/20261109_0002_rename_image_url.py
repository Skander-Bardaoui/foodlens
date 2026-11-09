"""rename image_url to image_path

Revision ID: 0002_rename_image_url
Revises: 0001_create_analyses
Create Date: 2026-11-09
"""

import sqlalchemy as sa
from alembic import op

revision = "0002_rename_image_url"
down_revision = "0001_create_analyses"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column(
        "analyses",
        "image_url",
        new_column_name="image_path",
        existing_type=sa.String(length=512),
        existing_nullable=False,
    )


def downgrade() -> None:
    op.alter_column(
        "analyses",
        "image_path",
        new_column_name="image_url",
        existing_type=sa.String(length=512),
        existing_nullable=False,
    )
