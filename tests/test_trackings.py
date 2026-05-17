import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from db.models import User
from api.auth import create_jwt


async def _create_user(db: AsyncSession, telegram_user_id: int) -> User:
    user = User(telegram_user_id=telegram_user_id, region="Москва")
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@pytest.mark.asyncio
async def test_add_tracking_by_url(client: AsyncClient, db_session: AsyncSession):
    user = await _create_user(db_session, telegram_user_id=888001)
    token = create_jwt(user.telegram_user_id)

    resp = await client.post(
        "/trackings",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "url": "https://www.wildberries.ru/catalog/12345678/detail.aspx",
            "platform": "wb",
            "target_price": 100000,
        },
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["product"]["sku"] == "12345678"
    assert data["product"]["platform"] == "wb"
    assert data["target_price"] == 100000


@pytest.mark.asyncio
async def test_add_tracking_by_sku(client: AsyncClient, db_session: AsyncSession):
    user = await _create_user(db_session, telegram_user_id=888002)
    token = create_jwt(user.telegram_user_id)

    resp = await client.post(
        "/trackings",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "sku": "987654",
            "platform": "ozon",
            "target_percent": "10.00",
        },
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["product"]["sku"] == "987654"


@pytest.mark.asyncio
async def test_add_tracking_duplicate(client: AsyncClient, db_session: AsyncSession):
    user = await _create_user(db_session, telegram_user_id=888003)
    token = create_jwt(user.telegram_user_id)

    payload = {
        "sku": "111111",
        "platform": "wb",
        "target_price": 50000,
    }
    resp1 = await client.post(
        "/trackings", headers={"Authorization": f"Bearer {token}"}, json=payload
    )
    assert resp1.status_code == 201

    resp2 = await client.post(
        "/trackings", headers={"Authorization": f"Bearer {token}"}, json=payload
    )
    assert resp2.status_code == 409


@pytest.mark.asyncio
async def test_list_trackings(client: AsyncClient, db_session: AsyncSession):
    user = await _create_user(db_session, telegram_user_id=888004)
    token = create_jwt(user.telegram_user_id)

    await client.post(
        "/trackings",
        headers={"Authorization": f"Bearer {token}"},
        json={"sku": "222222", "platform": "wb", "target_price": 30000},
    )
    await client.post(
        "/trackings",
        headers={"Authorization": f"Bearer {token}"},
        json={"sku": "333333", "platform": "ozon", "target_price": 40000},
    )

    resp = await client.get("/trackings", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert len(resp.json()) == 2


@pytest.mark.asyncio
async def test_delete_tracking(client: AsyncClient, db_session: AsyncSession):
    user = await _create_user(db_session, telegram_user_id=888005)
    token = create_jwt(user.telegram_user_id)

    add_resp = await client.post(
        "/trackings",
        headers={"Authorization": f"Bearer {token}"},
        json={"sku": "444444", "platform": "wb", "target_price": 20000},
    )
    tracking_id = add_resp.json()["id"]

    del_resp = await client.delete(
        f"/trackings/{tracking_id}", headers={"Authorization": f"Bearer {token}"}
    )
    assert del_resp.status_code == 200

    list_resp = await client.get("/trackings", headers={"Authorization": f"Bearer {token}"})
    assert list_resp.json() == []


@pytest.mark.asyncio
async def test_add_tracking_no_sku_no_url(client: AsyncClient, db_session: AsyncSession):
    user = await _create_user(db_session, telegram_user_id=888006)
    token = create_jwt(user.telegram_user_id)

    resp = await client.post(
        "/trackings",
        headers={"Authorization": f"Bearer {token}"},
        json={"platform": "wb", "target_price": 10000},
    )
    assert resp.status_code == 422
