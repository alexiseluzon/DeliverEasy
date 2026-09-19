"""add push_token to users

Revision ID: 7f3a9c1e5b2d
Revises: 2339776abb23
Create Date: 2026-09-20 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '7f3a9c1e5b2d'
down_revision: Union[str, None] = '2339776abb23'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('push_token', sa.String(length=255), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'push_token')