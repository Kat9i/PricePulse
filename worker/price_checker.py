import logging
from datetime import datetime, timezone

from aiogram import Bot
from sqlalchemy import select, insert
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import settings
from db.models import Product, Tracking, Seller, PriceHistory
from db.session import AsyncSessionLocal
from parsers.wb import WildberriesParser
from parsers.ozon import OzonParser
from parsers.base import BaseParser, ParseResult
from worker.notifier import send_price_alert, send_stock_alert

logger = logging.getLogger(__name__)


def _get_parser(platform: str, proxies: list[str]) -> BaseParser | None:
    if platform == "wb":
        return WildberriesParser(proxies=proxies)
    elif platform == "ozon":
        return OzonParser(proxies=proxies)
    return None


def _load_proxies() -> list[str]:
    raw = settings.proxy_list.strip()
    if not raw:
        return []
    return [p.strip() for p in raw.split(",") if p.strip()]


async def _should_notify_price(
    tracking: Tracking,
    old_price: int | None,
    new_price: int,
) -> bool:
    if old_price is not None and new_price >= old_price:
        return False
    if tracking.target_price is not None:
        return new_price <= tracking.target_price
    if tracking.target_percent is not None:
        if old_price and old_price > 0:
            drop_pct = (old_price - new_price) / old_price * 100
            return drop_pct >= float(tracking.target_percent)
    return False


async def check_all_products(bot: Bot) -> None:
    """Main job: parse all tracked products and send notifications."""
    proxies = _load_proxies()

    async with AsyncSessionLocal() as db:
        products_result = await db.execute(
            select(Product).join(
                Tracking,
                Tracking.product_id == Product.id,
            ).where(Tracking.status == "active").distinct()
        )
        products = products_result.scalars().all()

    logger.info("Starting price check for %d products", len(products))

    for product in products:
        try:
            await _check_product(product, bot, proxies)
        except Exception as exc:
            logger.error("Error checking product %s (%s): %s", product.sku, product.platform, exc)


async def _check_product(product: Product, bot: Bot, proxies: list[str]) -> None:
    parser = _get_parser(product.platform, proxies)
    if not parser:
        logger.warning("No parser for platform %s", product.platform)
        return

    result: ParseResult | None = await parser.parse(product.sku)
    if not result:
        logger.warning("Parser returned None for %s %s", product.platform, product.sku)
        return

    async with AsyncSessionLocal() as db:
        # Reload product inside this session
        db_product_result = await db.execute(
            select(Product).where(Product.id == product.id)
        )
        db_product = db_product_result.scalar_one_or_none()
        if not db_product:
            return

        old_min_price = db_product.current_min_price
        new_min_price = result.min_price
        old_in_stock = db_product.in_stock

        # Update product fields
        db_product.title = result.title
        db_product.image_url = result.image_url
        db_product.in_stock = result.in_stock
        db_product.current_min_price = new_min_price
        db_product.last_checked_at = datetime.now(timezone.utc)

        # Upsert sellers
        for offer in result.sellers:
            stmt = pg_insert(Seller).values(
                product_id=db_product.id,
                seller_name=offer.seller_name,
                price=offer.price,
                offer_url=offer.offer_url,
                updated_at=datetime.now(timezone.utc),
            ).on_conflict_do_update(
                index_elements=["product_id", "seller_name"],
                set_={
                    "price": offer.price,
                    "offer_url": offer.offer_url,
                    "updated_at": datetime.now(timezone.utc),
                },
            )
            await db.execute(stmt)

        # Record price history if price changed
        if new_min_price is not None and new_min_price != old_min_price:
            history = PriceHistory(
                product_id=db_product.id,
                price=new_min_price,
            )
            db.add(history)

        await db.commit()

        # Check notifications for active trackings
        if new_min_price is None:
            return

        trackings_result = await db.execute(
            select(Tracking).where(
                Tracking.product_id == db_product.id,
                Tracking.status == "active",
            )
        )
        trackings = trackings_result.scalars().all()

        for tracking in trackings:
            # Price alert
            if await _should_notify_price(tracking, old_min_price, new_min_price):
                await send_price_alert(bot, db, tracking, db_product, new_min_price)

            # Stock change alert
            if old_in_stock != result.in_stock:
                await send_stock_alert(bot, db, tracking, db_product, result.in_stock)
