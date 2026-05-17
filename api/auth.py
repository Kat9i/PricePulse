import hashlib
import hmac
import json
import time
from urllib.parse import parse_qsl, unquote
from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from core.config import settings
from db.session import get_db
from db.models import User
from api.schemas.user import AuthVerifyRequest, AuthVerifyResponse, UserResponse

router = APIRouter(prefix="/auth", tags=["auth"])


def _verify_init_data(init_data: str) -> dict:
    """Верифицирует подпись Telegram initData через HMAC-SHA256."""
    parsed = dict(parse_qsl(unquote(init_data), keep_blank_values=True))
    received_hash = parsed.pop("hash", None)
    if not received_hash:
        raise HTTPException(status_code=401, detail="Отсутствует hash в initData")

    # Проверяем давность — не старше 1 часа (защита от replay-атак)
    auth_date = int(parsed.get("auth_date", 0))
    if time.time() - auth_date > 3600:
        raise HTTPException(status_code=401, detail="initData устарел (> 1 часа)")

    data_check_string = "\n".join(f"{k}={v}" for k, v in sorted(parsed.items()))
    secret_key = hmac.new(
        key=b"WebAppData",
        msg=settings.bot_token.encode(),
        digestmod=hashlib.sha256,
    ).digest()
    expected_hash = hmac.new(
        key=secret_key,
        msg=data_check_string.encode(),
        digestmod=hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(expected_hash, received_hash):
        raise HTTPException(status_code=401, detail="Неверная подпись initData")

    user_data = json.loads(parsed.get("user", "{}"))
    if not user_data.get("id"):
        raise HTTPException(status_code=401, detail="Не удалось получить user_id из initData")

    return user_data


def create_jwt(telegram_user_id: int) -> str:
    """Создаёт JWT-токен для пользователя."""
    expire = datetime.now(timezone.utc) + timedelta(days=settings.jwt_expire_days)
    payload = {"sub": str(telegram_user_id), "exp": expire}
    return jwt.encode(payload, settings.secret_key, algorithm=settings.jwt_algorithm)


def decode_jwt(token: str) -> int:
    """Декодирует JWT и возвращает telegram_user_id."""
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.jwt_algorithm])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Невалидный токен")
        return int(user_id)
    except JWTError:
        raise HTTPException(status_code=401, detail="Невалидный или просроченный токен")


@router.post("/verify", response_model=AuthVerifyResponse)
async def verify(body: AuthVerifyRequest, db: AsyncSession = Depends(get_db)):
    """Верифицирует Telegram initData, создаёт пользователя при первом входе, возвращает JWT."""
    user_data = _verify_init_data(body.init_data)
    telegram_user_id = int(user_data["id"])

    result = await db.execute(select(User).where(User.telegram_user_id == telegram_user_id))
    user = result.scalar_one_or_none()
    is_new = user is None

    if is_new:
        user = User(
            telegram_user_id=telegram_user_id,
            region="Москва",  # регион по умолчанию — пользователь меняет в настройках
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    token = create_jwt(telegram_user_id)
    return AuthVerifyResponse(token=token, user=UserResponse.model_validate(user), is_new=is_new)
