import logging
import random
import re

import httpx
from bs4 import BeautifulSoup

from parsers.base import BaseParser, ParseResult, SellerOffer

logger = logging.getLogger(__name__)

_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "ru-RU,ru;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
}


class OzonParser(BaseParser):
    async def parse(self, sku: str) -> ParseResult | None:
        proxy = random.choice(self.proxies) if self.proxies else None
        client_kwargs: dict = {"headers": _HEADERS, "timeout": 20.0, "follow_redirects": True}
        if proxy:
            client_kwargs["proxy"] = proxy

        url = f"https://www.ozon.ru/product/{sku}/"
        async with httpx.AsyncClient(**client_kwargs) as client:
            return await self._fetch(client, sku, url)

    async def _fetch(
        self, client: httpx.AsyncClient, sku: str, url: str
    ) -> ParseResult | None:
        try:
            resp = await client.get(url)
            resp.raise_for_status()
        except Exception as exc:
            logger.warning("Ozon fetch failed for sku=%s: %s", sku, exc)
            return None

        # Ozon renders with JS; try to extract JSON-LD or meta tags from raw HTML
        soup = BeautifulSoup(resp.text, "lxml")

        title = _extract_title(soup)
        image_url = _extract_image(soup)
        price_kopeks = _extract_price(soup)
        in_stock = _extract_in_stock(soup)

        sellers: list[SellerOffer] = []
        if price_kopeks is not None:
            seller_name = _extract_seller(soup) or "Ozon"
            sellers.append(SellerOffer(
                seller_name=seller_name,
                price=price_kopeks,
                offer_url=url,
            ))

        return ParseResult(
            sku=sku,
            platform="ozon",
            title=title or f"Товар {sku}",
            image_url=image_url or "",
            url=url,
            in_stock=in_stock,
            sellers=sellers,
        )


def _extract_title(soup: BeautifulSoup) -> str | None:
    # Try JSON-LD first
    for script in soup.find_all("script", type="application/ld+json"):
        try:
            import json
            data = json.loads(script.string or "")
            if isinstance(data, dict) and data.get("name"):
                return data["name"]
            if isinstance(data, list):
                for item in data:
                    if isinstance(item, dict) and item.get("name"):
                        return item["name"]
        except Exception:
            pass
    # Fallback to h1
    h1 = soup.find("h1")
    return h1.get_text(strip=True) if h1 else None


def _extract_image(soup: BeautifulSoup) -> str | None:
    og_image = soup.find("meta", property="og:image")
    if og_image:
        return og_image.get("content")
    img = soup.find("img", {"itemprop": "image"})
    if img:
        return img.get("src")
    return None


def _extract_price(soup: BeautifulSoup) -> int | None:
    # Try meta price
    price_meta = soup.find("meta", {"itemprop": "price"})
    if price_meta:
        try:
            rubles = float(price_meta.get("content", "0").replace(",", "."))
            return int(rubles * 100)
        except (ValueError, TypeError):
            pass

    # Try JSON-LD offers
    for script in soup.find_all("script", type="application/ld+json"):
        try:
            import json
            data = json.loads(script.string or "")
            offers = None
            if isinstance(data, dict):
                offers = data.get("offers")
            if isinstance(offers, dict):
                price_str = str(offers.get("price", ""))
                if price_str:
                    return int(float(price_str.replace(",", ".")) * 100)
        except Exception:
            pass

    # Try to find price in text via regex (Ozon shows "1 234 ₽")
    text = soup.get_text()
    match = re.search(r"(\d[\d\s]*)\s*₽", text)
    if match:
        try:
            rubles = int(match.group(1).replace("\xa0", "").replace(" ", ""))
            return rubles * 100
        except ValueError:
            pass

    return None


def _extract_in_stock(soup: BeautifulSoup) -> bool:
    availability = soup.find("link", {"itemprop": "availability"})
    if availability:
        href = availability.get("href", "")
        return "InStock" in href
    # If we found a price, assume in stock
    return True


def _extract_seller(soup: BeautifulSoup) -> str | None:
    seller_el = soup.find(attrs={"data-widget": "webSeller"})
    if seller_el:
        return seller_el.get_text(strip=True)[:100]
    return None
