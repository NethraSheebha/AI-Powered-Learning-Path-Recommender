"""Add quiz_questions JSONB column to nodes.

Revision ID: 002_add_quiz_questions
Revises: 001_initial_schema
Create Date: 2026-08-31 20:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "002_add_quiz_questions"
down_revision: Union[str, None] = "001_initial_schema"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

JSON_TYPE = postgresql.JSONB(astext_type=sa.Text()).with_variant(sa.JSON(), "sqlite")


def upgrade() -> None:
    op.add_column("nodes", sa.Column("quiz_questions", JSON_TYPE, nullable=True))


def downgrade() -> None:
    op.drop_column("nodes", "quiz_questions")
