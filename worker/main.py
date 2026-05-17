import asyncio
import logging

from aiogram import Bot
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from core.config import settings
from worker.price_checker import check_all_products

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


async def main() -> None:
    bot = Bot(token=settings.bot_token)
    scheduler = AsyncIOScheduler()

    scheduler.add_job(
        check_all_products,
        trigger="interval",
        hours=2,
        args=[bot],
        id="price_check",
        replace_existing=True,
    )

    scheduler.start()
    logger.info("Worker started. Price checks scheduled every 2 hours.")

    # Run once immediately on start
    logger.info("Running initial price check...")
    try:
        await check_all_products(bot)
    except Exception as exc:
        logger.error("Initial price check failed: %s", exc)

    try:
        await asyncio.Event().wait()
    finally:
        scheduler.shutdown()
        await bot.session.close()


if __name__ == "__main__":
    asyncio.run(main())
