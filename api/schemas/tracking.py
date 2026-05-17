from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, model_validator


class ProductInfo(BaseModel):
    id: UUID
    title: str
    image_url: Optional[str]
    platform: str
    url: str
    current_min_price: Optional[int]
    in_stock: bool

    model_config = {"from_attributes": True}


class TrackingResponse(BaseModel):
    id: UUID
    product: ProductInfo
    target_price: Optional[int]
    target_percent: Optional[float]
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class TrackingCreate(BaseModel):
    url: Optional[str] = None
    sku: Optional[str] = None
    platform: str                       # 'wb' | 'ozon'
    target_price: Optional[int] = None  # в копейках
    target_percent: Optional[float] = None

    @model_validator(mode="after")
    def check_fields(self) -> "TrackingCreate":
        if not self.url and not self.sku:
            raise ValueError("Нужно указать url или sku")
        if self.target_price is None and self.target_percent is None:
            raise ValueError("Нужно указать target_price или target_percent")
        if self.target_price is not None and self.target_percent is not None:
            raise ValueError("Нужно указать только один параметр: target_price или target_percent")
        if self.platform not in ("wb", "ozon"):
            raise ValueError("platform должен быть 'wb' или 'ozon'")
        return self
