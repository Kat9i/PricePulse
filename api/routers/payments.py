import logging

import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import settings
from db.session import get_db
from db.models import User, Payment
from api.dependencies import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/payments", tags=["payments"])


@router.post("/invoice")
async def create_invoice(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Создаёт ссылку на оплату PRO-подписки через Telegram Payments + ЮКасса."""
    if not settings.payment_provider_token:
        raise HTTPException(status_code=503, detail="Платежи временно недоступны")

    payment = Payment(
        user_id=current_user.telegram_user_id,
        amount=10000,   # 100 рублей в копейках
        status="pending",
        type="one_time",
    )
    db.add(payment)
    await db.commit()
    await db.refresh(payment)

    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.post(
            f"https://api.telegram.org/bot{settings.bot_token}/createInvoiceLink",
            json={
                "title": "PricePulse PRO",
                "description": "Подписка на 1 месяц — до 50 товаров",
                "payload": str(payment.id),
                "provider_token": settings.payment_provider_token,
                "currency": "RUB",
                "prices": [{"label": "PRO подписка 1 месяц", "amount": 10000}],
            },
        )

    data = resp.json() if resp.is_success else {}
    if not resp.is_success or not data.get("ok"):
        payment.status = "failed"
        await db.commit()
        error_msg = data.get("description", "Ошибка Telegram Payments")
        logger.error("createInvoiceLink failed: %s", error_msg)
        raise HTTPException(status_code=502, detail="Не удалось создать счёт. Попробуй позже.")

    return {"invoice_url": data["result"]}
