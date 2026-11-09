"""create analyses table

Revision ID: 0001_create_analyses
Revises:
Create Date: 2026-11-09
"""

import sqlalchemy as sa
from alembic import op

revision = "0001_create_analyses"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "analyses",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("label", sa.String(length=255), nullable=False),
        sa.Column("confidence", sa.Float(), nullable=False),
        sa.Column("uncertain", sa.Boolean(), nullable=False),
        sa.Column("top3", sa.JSON(), nullable=False),
        sa.Column("ingredients", sa.JSON(), nullable=False),
        sa.Column("steps", sa.JSON(), nullable=False),
        sa.Column("image_url", sa.String(length=512), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_analyses_label"), "analyses", ["label"], unique=False)
    op.create_index(
        op.f("ix_analyses_created_at"), "analyses", ["created_at"], unique=False
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_analyses_created_at"), table_name="analyses")
    op.drop_index(op.f("ix_analyses_label"), table_name="analyses")
    op.drop_table("analyses")
