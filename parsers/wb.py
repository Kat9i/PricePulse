import logging
import random

import httpx

from parsers.base import BaseParser, ParseResult, SellerOffer

logger = logging.getLogger(__name__)

_CARD_URL = "https://card.wb.ru/cards/v2/detail?appType=1&curr=rub&dest=-1257786&spp=30&nm={sku}"
_SELLERS_URL = "https://www.wildberries.ru/product/get-sellers?nm={sku}"

_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "application/json",
    "Accept-Language": "ru-RU,ru;q=0.9",
}


class WildberriesParser(BaseParser):
    async def parse(self, sku: str) -> ParseResult | None:
        proxy = random.choice(self.proxies) if self.proxies else None
        client_kwargs: dict = {"headers": _HEADERS, "timeout": 15.0, "follow_redirects": True}
        if proxy:
            client_kwargs["proxy"] = proxy

        async with httpx.AsyncClient(**client_kwargs) as client:
            return await self._fetch(client, sku)

    async def _fetch(self, client: httpx.AsyncClient, sku: str) -> ParseResult | None:
        try:
            resp = await client.get(_CARD_URL.format(sku=sku))
            resp.raise_for_status()
            data = resp.json()
        except Exception as exc:
            logger.warning("WB card fetch failed for sku=%s: %s", sku, exc)
            return None

        products = data.get("data", {}).get("products", [])
        if not products:
            return None

        product = products[0]
        title: str = product.get("name", f"Товар {sku}")
        image_id: str = str(product.get("id", sku))
        image_url = _build_image_url(image_id)
        url = f"https://www.wildberries.ru/catalog/{sku}/detail.aspx"

        sizes = product.get("sizes", [])
        sellers: list[SellerOffer] = []
        in_stock = False

        for size in sizes:
            for stock in size.get("stocks", []):
                if stock.get("qty", 0) > 0:
                    in_stock = True
                    break

        # WB card API returns salePriceU in kopeks * 100 — need /100 to get kopeks
        # Actually WB API returns price in kopeks directly in salePriceU as 1/100 rub → * 100 kopeks
        # The field "salePriceU" is price in rubles * 100 (i.e. 1990000 = 19900 rub = 1990000 kopeks? No.)
        # WB API: priceU is kopeks, salePriceU is sale price in same units (1 unit = 0.01 kopek = 0.0001 rub)
        # So salePriceU / 100 = kopeks, / 10000 = rubles
        sale_price_u = product.get("salePriceU") or product.get("priceU")
        if sale_price_u:
            # salePriceU is rubles * 100, so divide by 100 to get rubles, multiply by 100 to get kopeks
            # i.e. salePriceU is already in kopeks (1 kopek = 0.01 rub, salePriceU unit = 0.01 rub)
            price_kopeks = sale_price_u  # salePriceU is in units of 1/100 rub = 1 kopek
            supplier = product.get("supplier", "Wildberries")
            supplier_id = product.get("supplierId", 0)
            offer_url = (
                f"https://www.wildberries.ru/catalog/{sku}/detail.aspx"
                f"?seller={supplier_id}"
            )
            sellers.append(SellerOffer(
                seller_name=supplier,
                price=price_kopeks,
                offer_url=offer_url,
            ))

        return ParseResult(
            sku=sku,
            platform="wb",
            title=title,
            image_url=image_url,
            url=url,
            in_stock=in_stock,
            sellers=sellers,
        )


def _build_image_url(product_id: str) -> str:
    # WB CDN URL format based on product ID ranges
    pid = int(product_id)
    if pid <= 143:
        basket = "01"
    elif pid <= 287:
        basket = "02"
    elif pid <= 431:
        basket = "03"
    elif pid <= 719:
        basket = "04"
    elif pid <= 1007:
        basket = "05"
    elif pid <= 1061:
        basket = "06"
    elif pid <= 1115:
        basket = "07"
    elif pid <= 1169:
        basket = "08"
    elif pid <= 1313:
        basket = "09"
    elif pid <= 1601:
        basket = "10"
    elif pid <= 1655:
        basket = "11"
    elif pid <= 1919:
        basket = "12"
    elif pid <= 2045:
        basket = "13"
    else:
        basket = "14"
    vol = pid // 100000
    part = pid // 1000
    return (
        f"https://basket-{basket}.wbbasket.ru/vol{vol}/part{part}/{product_id}/images/big/1.webp"
    )
