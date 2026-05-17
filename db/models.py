import uuid
from datetime import datetime
from sqlalchemy import (
    BigInteger, Boolean, Column, DateTime, Integer,
    Numeric, String, Text, UniqueConstraint, ForeignKey, func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, relationship


class Base(DeclarativeBase):
    pass


# Примечание: таблица называется "users" (не "user") — "user" зарезервировано в PostgreSQL
class User(Base):
    __tablename__ = "users"

    telegram_user_id = Column(BigInteger, primary_key=True)
    region = Column(String(100), nullable=False)
    plan = Column(String(10), nullable=False, default="free")        # 'free' | 'pro'
    subscription_until = Column(DateTime(timezone=True), nullable=True)
    auto_renew = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    trackings = relationship("Tracking", back_populates="user")
    notifications = relationship("Notification", back_populates="user")
    payments = relationship("Payment", back_populates="user")


class Product(Base):
    __tablename__ = "product"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sku = Column(String(50), nullable=False)
    platform = Column(String(10), nullable=False)                    # 'wb' | 'ozon'
    title = Column(Text, nullable=False)
    image_url = Column(Text, nullable=True)
    url = Column(Text, nullable=False)
    current_min_price = Column(Integer, nullable=True)               # в копейках
    in_stock = Column(Boolean, nullable=False, default=True)
    last_checked_at = Column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        UniqueConstraint("sku", "platform", name="uq_product_sku_platform"),
    )

    trackings = relationship("Tracking", back_populates="product")
    sellers = relationship("Seller", back_populates="product", cascade="all, delete-orphan")
    price_history = relationship("PriceHistory", back_populates="product")
    notifications = relationship("Notification", back_populates="product")


class Tracking(Base):
    __tablename__ = "tracking"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(BigInteger, ForeignKey("users.telegram_user_id"), nullable=False)
    product_id = Column(UUID(as_uuid=True), ForeignKey("product.id"), nullable=False)
    target_price = Column(Integer, nullable=True)                    # в копейках
    target_percent = Column(Numeric(5, 2), nullable=True)
    status = Column(String(10), nullable=False, default="active")    # 'active' | 'frozen'
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    __table_args__ = (
        UniqueConstraint("user_id", "product_id", name="uq_tracking_user_product"),
    )

    user = relationship("User", back_populates="trackings")
    product = relationship("Product", back_populates="trackings")


class Seller(Base):
    __tablename__ = "seller"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id = Column(UUID(as_uuid=True), ForeignKey("product.id"), nullable=False)
    seller_name = Column(Text, nullable=False)
    price = Column(Integer, nullable=False)                          # в копейках
    offer_url = Column(Text, nullable=False)
    updated_at = Column(
        DateTime(timezone=True), nullable=False,
        server_default=func.now(), onupdate=func.now(),
    )

    __table_args__ = (
        # Защита от дублей при повторном парсинге — upsert по этой паре
        UniqueConstraint("product_id", "seller_name", name="uq_seller_product_name"),
    )

    product = relationship("Product", back_populates="sellers")


class PriceHistory(Base):
    __tablename__ = "price_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id = Column(UUID(as_uuid=True), ForeignKey("product.id"), nullable=False)
    price = Column(Integer, nullable=False)                          # в копейках
    recorded_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    product = relationship("Product", back_populates="price_history")


class Notification(Base):
    __tablename__ = "notification"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(BigInteger, ForeignKey("users.telegram_user_id"), nullable=False)
    product_id = Column(UUID(as_uuid=True), ForeignKey("product.id"), nullable=False)
    type = Column(String(20), nullable=False)                        # 'price_reached' | 'out_of_stock'
    sent_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    user = relationship("User", back_populates="notifications")
    product = relationship("Product", back_populates="notifications")


class Payment(Base):
    __tablename__ = "payment"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(BigInteger, ForeignKey("users.telegram_user_id"), nullable=False)
    amount = Column(Integer, nullable=False)                         # в копейках (10000 = 100 руб.)
    status = Column(String(20), nullable=False)                      # 'pending' | 'succeeded' | 'failed'
    type = Column(String(20), nullable=False)                        # 'one_time' | 'auto_renew'
    yukassa_id = Column(String(100), unique=True, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    user = relationship("User", back_populates="payments")
