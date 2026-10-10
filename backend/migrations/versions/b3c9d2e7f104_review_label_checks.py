"""review label checks: model confidence, host check time, original machine label

Revision ID: b3c9d2e7f104
Revises: 468a1928ece1
Create Date: 2026-10-10 19:30:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b3c9d2e7f104'
down_revision: Union[str, Sequence[str], None] = '468a1928ece1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table('reviews', schema=None) as batch_op:
        batch_op.add_column(sa.Column('label_confidence', sa.Float(), nullable=True))
        batch_op.add_column(sa.Column('label_checked_at', sa.DateTime(timezone=True), nullable=True))
        batch_op.add_column(sa.Column('machine_label', sa.JSON(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('reviews', schema=None) as batch_op:
        batch_op.drop_column('machine_label')
        batch_op.drop_column('label_checked_at')
        batch_op.drop_column('label_confidence')
