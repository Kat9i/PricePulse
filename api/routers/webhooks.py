import hashlib
import hmac
import logging
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import settings
from db.session import get_db
from db.models import User, Payment

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


@router.post("/telegram")
async def telegram_webhook(request: Request) -> JSONResponse:
    """Обрабатывает входящие события от Telegram Bot API.

    Ожидаемые типы событий:
    - pre_checkout_query — подтверждение перед оплатой
    - successful_payment  — успешная оплата подписки
    """
    # TODO: подключить aiogram dispatcher для полноценной обработки
    body = await request.json()
    logger.info(f"Telegram webhook: {body}")
    return JSONResponse({"ok": True})


@router.post("/yukassa")
async def yukassa_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> JSONResponse:
    """Обрабатывает уведомления от ЮКасса об оплате и автопродлении."""
    raw_body = await request.body()

    # Верифицируем подпись ЮКасса: HMAC-SHA256(secret_key, body)
    if settings.yukassa_secret_key:
        signature = request.headers.get("X-Yukassa-Signature", "")
        expected = hmac.new(
            key=settings.yukassa_secret_key.encode(),
            msg=raw_body,
            digestmod=hashlib.sha256,
        ).hexdigest()
        if not hmac.compare_digest(expected, signature):
            raise HTTPException(status_code=401, detail="Неверная подпись вебхука")

    import json
    body = json.loads(raw_body)
    logger.info(f"ЮКасса webhook: {body}")

    event_type = body.get("event")
    payment_obj = body.get("object", {})
    yukassa_id = payment_obj.get("id")
    payment_status = payment_obj.get("status")

    if event_type == "payment.succeeded" and yukassa_id:
        # Находим платёж в БД и обновляем статус
        result = await db.execute(select(Payment).where(Payment.yukassa_id == yukassa_id))
        payment = result.scalar_one_or_none()
        if payment:
            payment.status = "succeeded"
            # Продлеваем подписку пользователя на 30 дней
            user_result = await db.execute(
                select(User).where(User.telegram_user_id == payment.user_id)
            )
            user = user_result.scalar_one_or_none()
            if user:
                now = datetime.now(timezone.utc)
                base = user.subscription_until if user.subscription_until and user.subscription_until > now else now
                user.subscription_until = base + timedelta(days=30)
                user.plan = "pro"
            await db.commit()

    return JSONResponse({"ok": True})
