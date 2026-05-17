from dataclasses import dataclass, field
from abc import ABC, abstractmethod


@dataclass
class SellerOffer:
    seller_name: str
    price: int  # kopeks
    offer_url: str


@dataclass
class ParseResult:
    sku: str
    platform: str
    title: str
    image_url: str
    url: str
    in_stock: bool
    sellers: list[SellerOffer] = field(default_factory=list)

    @property
    def min_price(self) -> int | None:
        if not self.sellers:
            return None
        return min(s.price for s in self.sellers)


class BaseParser(ABC):
    def __init__(self, proxies: list[str] | None = None) -> None:
        self.proxies = proxies or []

    @abstractmethod
    async def parse(self, sku: str) -> ParseResult | None:
        """Fetch product data by SKU. Returns None if product not found."""
        ...
