from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field, model_validator


class SellerInfo(BaseModel):
    id: UUID
    seller_name: str
    price: int
    offer_url: str

    model_config = {"from_attributes": True}


class ProductInfo(BaseModel):
    id: UUID
    sku: str
    title: str
    image_url: Optional[str]
    platform: str
    url: str
    current_min_price: Optional[int]
    in_stock: bool
    last_checked_at: Optional[datetime]

    model_config = {"from_attributes": True}


class TrackingResponse(BaseModel):
    id: UUID
    product: ProductInfo
    target_price: Optional[int]
    target_percent: Optional[float]
    status: str
    created_at: datetime
    sellers: list[SellerInfo] = []

    model_config = {"from_attributes": True}

    @model_validator(mode="before")
    @classmethod
    def populate_sellers(cls, data):
        if isinstance(data, dict):
            return data
        sellers: list = []
        if hasattr(data, "product") and data.product and hasattr(data.product, "sellers"):
            sellers = data.product.sellers or []
        return {
            "id": data.id,
            "product": data.product,
            "target_price": data.target_price,
            "target_percent": float(data.target_percent) if data.target_percent is not None else None,
            "status": data.status,
            "created_at": data.created_at,
            "sellers": sellers,
        }


class TrackingCreate(BaseModel):
    url: Optional[str] = Field(default=None, max_length=2048)
    sku: Optional[str] = Field(default=None, max_length=50)
    platform: str = Field(max_length=10)
    target_price: Optional[int] = Field(default=None, ge=1, le=100_000_000)
    target_percent: Optional[float] = Field(default=None, gt=0, le=99)

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


class TrackingUpdate(BaseModel):
    target_price: Optional[int] = Field(default=None, ge=1, le=100_000_000)
    target_percent: Optional[float] = Field(default=None, gt=0, le=99)


class ProductLookupResponse(BaseModel):
    product: ProductInfo
    sellers: list[SellerInfo] = []
