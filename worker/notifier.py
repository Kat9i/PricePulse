import logging
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from db.models import User, Product, Tracking, Notification

logger = logging.getLogger(__name__)


async def send_price_alert(
    bot: Optional[object],
    db: AsyncSession,
    tracking: Tracking,
    product: Product,
    new_price: int,
) -> None:
    if bot is None:
        return
    user_result = await db.execute(
        select(User).where(User.telegram_user_id == tracking.user_id)
    )
    user = user_result.scalar_one_or_none()
    if not user:
        return

    price_rub = new_price / 100
    target_rub = (tracking.target_price / 100) if tracking.target_price else None

    if target_rub:
        text = (
            f"Цена снизилась!\n\n"
            f"Товар: {product.title}\n"
            f"Новая цена: {price_rub:.0f} ₽\n"
            f"Ваша цель: {target_rub:.0f} ₽\n\n"
            f"{product.url}"
        )
    else:
        text = (
            f"Цена снизилась!\n\n"
            f"Товар: {product.title}\n"
            f"Новая цена: {price_rub:.0f} ₽\n\n"
            f"{product.url}"
        )

    try:
        await bot.send_message(chat_id=tracking.user_id, text=text)
        notification = Notification(
            user_id=tracking.user_id,
            product_id=product.id,
            type="price_reached",
        )
        db.add(notification)
        await db.commit()
        logger.info("Sent price alert to user %s for product %s", tracking.user_id, product.sku)
    except Exception as exc:
        logger.error("Failed to send notification to %s: %s", tracking.user_id, exc)


async def send_stock_alert(
    bot: Optional[object],
    db: AsyncSession,
    tracking: Tracking,
    product: Product,
    in_stock: bool,
) -> None:
    if bot is None:
        return
    user_result = await db.execute(
        select(User).where(User.telegram_user_id == tracking.user_id)
    )
    user = user_result.scalar_one_or_none()
    if not user:
        return

    if in_stock:
        text = (
            f"Товар появился в наличии!\n\n"
            f"Товар: {product.title}\n\n"
            f"{product.url}"
        )
        notif_type = "back_in_stock"
    else:
        text = (
            f"Товар закончился\n\n"
            f"Товар: {product.title}\n\n"
            f"{product.url}"
        )
        notif_type = "out_of_stock"

    try:
        await bot.send_message(chat_id=tracking.user_id, text=text)
        notification = Notification(
            user_id=tracking.user_id,
            product_id=product.id,
            type=notif_type,
        )
        db.add(notification)
        await db.commit()
    except Exception as exc:
        logger.error("Failed to send stock notification to %s: %s", tracking.user_id, exc)
