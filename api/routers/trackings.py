import re
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from core.config import settings
from db.session import get_db
from db.models import User, Product, Tracking
from api.dependencies import get_current_user
from api.schemas.tracking import TrackingResponse, TrackingCreate

router = APIRouter(prefix="/trackings", tags=["trackings"])


@router.get("", response_model=list[TrackingResponse])
async def list_trackings(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list:
    """Возвращает список всех отслеживаний пользователя с данными товара."""
    result = await db.execute(
        select(Tracking)
        .where(Tracking.user_id == current_user.telegram_user_id)
        .options(selectinload(Tracking.product))
        .order_by(Tracking.created_at.desc())
    )
    return result.scalars().all()


@router.post("", response_model=TrackingResponse, status_code=status.HTTP_201_CREATED)
async def add_tracking(
    body: TrackingCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Tracking:
    """Добавляет товар в список отслеживания. Проверяет лимит тарифа."""
    # Проверяем лимит активных отслеживаний
    count_result = await db.execute(
        select(func.count()).select_from(Tracking).where(
            Tracking.user_id == current_user.telegram_user_id,
            Tracking.status == "active",
        )
    )
    active_count = count_result.scalar_one()
    limit = settings.pro_tracking_limit if current_user.plan == "pro" else settings.free_tracking_limit
    if active_count >= limit:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Достигнут лимит отслеживаний для тарифа ({limit} товаров)",
        )

    # Определяем SKU из URL если он не передан напрямую
    sku = body.sku
    if not sku and body.url:
        sku = _extract_sku(body.url, body.platform)
    if not sku:
        raise HTTPException(status_code=422, detail="Не удалось определить артикул товара из URL")

    # Ищем существующий товар или создаём новый
    product_result = await db.execute(
        select(Product).where(Product.sku == sku, Product.platform == body.platform)
    )
    product = product_result.scalar_one_or_none()
    if not product:
        product = Product(
            sku=sku,
            platform=body.platform,
            # Заголовок будет обновлён воркером при первой проверке цены
            title=f"Товар {sku}",
            url=body.url or _build_url(sku, body.platform),
        )
        db.add(product)
        await db.flush()

    # Проверяем, что такое отслеживание ещё не существует
    existing_result = await db.execute(
        select(Tracking).where(
            Tracking.user_id == current_user.telegram_user_id,
            Tracking.product_id == product.id,
        )
    )
    if existing_result.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Этот товар уже отслеживается")

    tracking = Tracking(
        user_id=current_user.telegram_user_id,
        product_id=product.id,
        target_price=body.target_price,
        target_percent=body.target_percent,
    )
    db.add(tracking)
    await db.commit()
    await db.refresh(tracking)

    # Загружаем связанный product для ответа
    result = await db.execute(
        select(Tracking)
        .where(Tracking.id == tracking.id)
        .options(selectinload(Tracking.product))
    )
    return result.scalar_one()


@router.delete("/{tracking_id}")
async def delete_tracking(
    tracking_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Удаляет отслеживание пользователя."""
    result = await db.execute(
        select(Tracking).where(
            Tracking.id == tracking_id,
            Tracking.user_id == current_user.telegram_user_id,
        )
    )
    tracking = result.scalar_one_or_none()
    if not tracking:
        raise HTTPException(status_code=404, detail="Отслеживание не найдено")
    await db.delete(tracking)
    await db.commit()
    return {"ok": True}


def _extract_sku(url: str, platform: str) -> str | None:
    """Извлекает артикул товара из URL маркетплейса."""
    if platform == "wb":
        # https://www.wildberries.ru/catalog/12345678/detail.aspx
        match = re.search(r"/catalog/(\d+)/", url)
        return match.group(1) if match else None
    elif platform == "ozon":
        # https://www.ozon.ru/product/nazvanie-12345678/
        match = re.search(r"-(\d+)/?$", url.rstrip("/"))
        return match.group(1) if match else None
    return None


def _build_url(sku: str, platform: str) -> str:
    """Формирует канонический URL товара по артикулу и платформе."""
    if platform == "wb":
        return f"https://www.wildberries.ru/catalog/{sku}/detail.aspx"
    elif platform == "ozon":
        return f"https://www.ozon.ru/product/{sku}/"
    return ""
