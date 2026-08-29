"""Initial Schema Migration

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-08-29 13:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 1. learners
    op.create_table(
        'learners',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('goal_text', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )

    # 2. graphs
    op.create_table(
        'graphs',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('learner_id', sa.String(length=36), nullable=False),
        sa.Column('goal_text', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['learner_id'], ['learners.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # 3. nodes
    op.create_table(
        'nodes',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('graph_id', sa.String(length=36), nullable=False),
        sa.Column('label', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('rubric', postgresql.JSONB(astext_type=sa.Text()).with_variant(sa.JSON(), 'sqlite'), nullable=True),
        sa.Column('resources', postgresql.JSONB(astext_type=sa.Text()).with_variant(sa.JSON(), 'sqlite'), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='locked'),
        sa.Column('p_init', sa.Float(), nullable=False, server_default='0.1'),
        sa.Column('p_transit', sa.Float(), nullable=False, server_default='0.1'),
        sa.Column('p_slip', sa.Float(), nullable=False, server_default='0.1'),
        sa.Column('p_guess', sa.Float(), nullable=False, server_default='0.2'),
        sa.Column('p_mastery', sa.Float(), nullable=False, server_default='0.0'),
        sa.ForeignKeyConstraint(['graph_id'], ['graphs.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # 4. edges
    op.create_table(
        'edges',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('graph_id', sa.String(length=36), nullable=False),
        sa.Column('from_node_id', sa.String(length=36), nullable=False),
        sa.Column('to_node_id', sa.String(length=36), nullable=False),
        sa.Column('edge_type', sa.String(length=50), nullable=False),
        sa.ForeignKeyConstraint(['from_node_id'], ['nodes.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['graph_id'], ['graphs.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['to_node_id'], ['nodes.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # 5. evidence_events
    op.create_table(
        'evidence_events',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('node_id', sa.String(length=36), nullable=False),
        sa.Column('learner_id', sa.String(length=36), nullable=False),
        sa.Column('type', sa.String(length=50), nullable=False),
        sa.Column('raw_score', sa.Float(), nullable=False),
        sa.Column('correct', sa.Boolean(), nullable=False),
        sa.Column('rubric_result', postgresql.JSONB(astext_type=sa.Text()).with_variant(sa.JSON(), 'sqlite'), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['learner_id'], ['learners.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['node_id'], ['nodes.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # 6. graph_diffs
    op.create_table(
        'graph_diffs',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('graph_id', sa.String(length=36), nullable=False),
        sa.Column('trigger_event_id', sa.String(length=36), nullable=True),
        sa.Column('nodes_added', postgresql.JSONB(astext_type=sa.Text()).with_variant(sa.JSON(), 'sqlite'), nullable=True),
        sa.Column('edges_added', postgresql.JSONB(astext_type=sa.Text()).with_variant(sa.JSON(), 'sqlite'), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['graph_id'], ['graphs.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['trigger_event_id'], ['evidence_events.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )

def downgrade() -> None:
    op.drop_table('graph_diffs')
    op.drop_table('evidence_events')
    op.drop_table('edges')
    op.drop_table('nodes')
    op.drop_table('graphs')
    op.drop_table('learners')
