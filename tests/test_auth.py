import hashlib
import hmac
import json
import time
import urllib.parse

import pytest
from httpx import AsyncClient

from core.config import settings


def _make_init_data(user_id: int = 123456789) -> str:
    """Build a valid Telegram initData string for testing."""
    user_json = json.dumps({"id": user_id, "first_name": "Test", "last_name": "User"})
    auth_date = int(time.time())

    params = {
        "auth_date": str(auth_date),
        "user": user_json,
    }
    data_check_string = "\n".join(
        f"{k}={v}" for k, v in sorted(params.items())
    )
    secret_key = hmac.new(b"WebAppData", settings.bot_token.encode(), hashlib.sha256).digest()
    signature = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()

    params["hash"] = signature
    return urllib.parse.urlencode(params)


@pytest.mark.asyncio
async def test_auth_verify_valid(client: AsyncClient):
    init_data = _make_init_data(user_id=111222333)
    resp = await client.post("/auth/verify", json={"init_data": init_data})
    assert resp.status_code == 200
    data = resp.json()
    assert "token" in data
    assert data["user"]["telegram_user_id"] == 111222333
    assert data["is_new"] is True


@pytest.mark.asyncio
async def test_auth_verify_creates_user_once(client: AsyncClient):
    init_data = _make_init_data(user_id=111222333)
    resp1 = await client.post("/auth/verify", json={"init_data": init_data})
    resp2 = await client.post("/auth/verify", json={"init_data": init_data})
    assert resp1.status_code == 200
    assert resp2.status_code == 200
    assert resp2.json()["is_new"] is False


@pytest.mark.asyncio
async def test_auth_verify_invalid_signature(client: AsyncClient):
    resp = await client.post("/auth/verify", json={"init_data": "hash=invalid&auth_date=123"})
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_health(client: AsyncClient):
    resp = await client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}
