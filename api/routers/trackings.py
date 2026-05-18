import re
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from core.config import settings
from db.session import get_db
from db.models import User, Product, Tracking
from api.dependencies import get_current_user
from api.schemas.tracking import (
    TrackingResponse, TrackingCreate, TrackingUpdate, ProductLookupResponse,
)
from api.limiter import limiter
from parsers.wb import WildberriesParser
from parsers.ozon import OzonParser

router = APIRouter(prefix="/trackings", tags=["trackings"])


@router.get("/lookup", response_model=ProductLookupResponse)
@limiter.limit("20/minute")
async def lookup_product(
    request: Request,
    url: str,
    current_user: User = Depends(get_current_user),
) -> dict:
    """Предпросмотр товара по URL — вызывает парсер и возвращает данные без сохранения."""
    platform = _detect_platform(url)
    if not platform:
        raise HTTPException(status_code=422, detail="Поддерживаем только ссылки WB и Ozon")

    sku = _extract_sku(url, platform)
    if not sku:
        raise HTTPException(status_code=422, detail="Не удалось определить артикул из ссылки")

    parser: WildberriesParser | OzonParser = (
        WildberriesParser() if platform == "wb" else OzonParser()
    )
    result = await parser.parse(sku)
    if not result:
        raise HTTPException(status_code=404, detail="Товар не найден. Проверь ссылку.")

    sellers = [
        {
            "id": str(uuid4()),
            "seller_name": s.seller_name,
            "price": s.price,
            "offer_url": s.offer_url,
        }
        for s in result.sellers
    ]

    return {
        "product": {
            "id": str(uuid4()),
            "sku": result.sku,
            "title": result.title,
            "image_url": result.image_url,
            "platform": result.platform,
            "url": result.url,
            "current_min_price": result.min_price,
            "in_stock": result.in_stock,
            "last_checked_at": None,
        },
        "sellers": sellers,
    }


@router.get("", response_model=list[TrackingResponse])
async def list_trackings(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list:
    """Возвращает список всех отслеживаний пользователя с данными товара и продавцами."""
    result = await db.execute(
        select(Tracking)
        .where(Tracking.user_id == current_user.telegram_user_id)
        .options(selectinload(Tracking.product).selectinload(Product.sellers))
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

    sku = body.sku
    if not sku and body.url:
        sku = _extract_sku(body.url, body.platform)
    if not sku:
        raise HTTPException(status_code=422, detail="Не удалось определить артикул товара из URL")

    product_result = await db.execute(
        select(Product).where(Product.sku == sku, Product.platform == body.platform)
    )
    product = product_result.scalar_one_or_none()
    if not product:
        product = Product(
            sku=sku,
            platform=body.platform,
            title=f"Товар {sku}",
            url=body.url or _build_url(sku, body.platform),
        )
        db.add(product)
        await db.flush()

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

    result = await db.execute(
        select(Tracking)
        .where(Tracking.id == tracking.id)
        .options(selectinload(Tracking.product).selectinload(Product.sellers))
    )
    return result.scalar_one()


@router.patch("/{tracking_id}", response_model=TrackingResponse)
async def update_tracking(
    tracking_id: UUID,
    body: TrackingUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Tracking:
    """Обновляет целевую цену или процент снижения."""
    if body.target_price is None and body.target_percent is None:
        raise HTTPException(status_code=422, detail="Укажи target_price или target_percent")

    result = await db.execute(
        select(Tracking).where(
            Tracking.id == tracking_id,
            Tracking.user_id == current_user.telegram_user_id,
        )
    )
    tracking = result.scalar_one_or_none()
    if not tracking:
        raise HTTPException(status_code=404, detail="Отслеживание не найдено")

    if body.target_price is not None:
        tracking.target_price = body.target_price
        tracking.target_percent = None
    else:
        tracking.target_percent = body.target_percent
        tracking.target_price = None

    await db.commit()

    refreshed = await db.execute(
        select(Tracking)
        .where(Tracking.id == tracking_id)
        .options(selectinload(Tracking.product).selectinload(Product.sellers))
    )
    return refreshed.scalar_one()


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


def _detect_platform(url: str) -> str | None:
    if "wildberries.ru" in url:
        return "wb"
    if "ozon.ru" in url:
        return "ozon"
    return None


def _extract_sku(url: str, platform: str) -> str | None:
    if platform == "wb":
        match = re.search(r"/catalog/(\d+)/", url)
        return match.group(1) if match else None
    if platform == "ozon":
        match = re.search(r"-(\d+)/?$", url.rstrip("/"))
        return match.group(1) if match else None
    return None


def _build_url(sku: str, platform: str) -> str:
    if platform == "wb":
        return f"https://www.wildberries.ru/catalog/{sku}/detail.aspx"
    if platform == "ozon":
        return f"https://www.ozon.ru/product/{sku}/"
    return ""
