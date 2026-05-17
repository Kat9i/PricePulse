"""Начальная схема БД — все 7 таблиц

Revision ID: 0001
Revises:
Create Date: 2026-05-17
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Таблица пользователей (users, не user — зарезервировано в PostgreSQL)
    op.create_table(
        "users",
        sa.Column("telegram_user_id", sa.BigInteger(), nullable=False),
        sa.Column("region", sa.String(100), nullable=False),
        sa.Column("plan", sa.String(10), nullable=False, server_default="free"),
        sa.Column("subscription_until", sa.DateTime(timezone=True), nullable=True),
        sa.Column("auto_renew", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text("NOW()")),
        sa.PrimaryKeyConstraint("telegram_user_id"),
    )

    # Таблица товаров
    op.create_table(
        "product",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column("sku", sa.String(50), nullable=False),
        sa.Column("platform", sa.String(10), nullable=False),
        sa.Column("title", sa.Text(), nullable=False),
        sa.Column("image_url", sa.Text(), nullable=True),
        sa.Column("url", sa.Text(), nullable=False),
        sa.Column("current_min_price", sa.Integer(), nullable=True),
        sa.Column("in_stock", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("last_checked_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("sku", "platform", name="uq_product_sku_platform"),
    )

    # Таблица отслеживаний
    op.create_table(
        "tracking",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("product_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("target_price", sa.Integer(), nullable=True),
        sa.Column("target_percent", sa.Numeric(5, 2), nullable=True),
        sa.Column("status", sa.String(10), nullable=False, server_default="active"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text("NOW()")),
        sa.ForeignKeyConstraint(["user_id"], ["users.telegram_user_id"]),
        sa.ForeignKeyConstraint(["product_id"], ["product.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "product_id", name="uq_tracking_user_product"),
    )

    # Таблица продавцов
    op.create_table(
        "seller",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column("product_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("seller_name", sa.Text(), nullable=False),
        sa.Column("price", sa.Integer(), nullable=False),
        sa.Column("offer_url", sa.Text(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text("NOW()")),
        sa.ForeignKeyConstraint(["product_id"], ["product.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("product_id", "seller_name", name="uq_seller_product_name"),
    )

    # Таблица истории цен
    op.create_table(
        "price_history",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column("product_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("price", sa.Integer(), nullable=False),
        sa.Column("recorded_at", sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text("NOW()")),
        sa.ForeignKeyConstraint(["product_id"], ["product.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    # Таблица уведомлений
    op.create_table(
        "notification",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("product_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("type", sa.String(20), nullable=False),
        sa.Column("sent_at", sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text("NOW()")),
        sa.ForeignKeyConstraint(["user_id"], ["users.telegram_user_id"]),
        sa.ForeignKeyConstraint(["product_id"], ["product.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    # Таблица платежей
    op.create_table(
        "payment",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("amount", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(20), nullable=False),
        sa.Column("type", sa.String(20), nullable=False),
        sa.Column("yukassa_id", sa.String(100), unique=True, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text("NOW()")),
        sa.ForeignKeyConstraint(["user_id"], ["users.telegram_user_id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    # Индексы для производительности
    op.create_index("idx_tracking_status", "tracking", ["status"])
    op.create_index("idx_tracking_user_id", "tracking", ["user_id"])
    op.create_index("idx_price_history_product", "price_history",
                    ["product_id", "recorded_at"])


def downgrade() -> None:
    op.drop_index("idx_price_history_product", "price_history")
    op.drop_index("idx_tracking_user_id", "tracking")
    op.drop_index("idx_tracking_status", "tracking")
    op.drop_table("payment")
    op.drop_table("notification")
    op.drop_table("price_history")
    op.drop_table("seller")
    op.drop_table("tracking")
    op.drop_table("product")
    op.drop_table("users")
