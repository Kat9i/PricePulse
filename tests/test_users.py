import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from db.models import User
from api.auth import create_jwt


async def _create_user(db: AsyncSession, telegram_user_id: int = 999001) -> User:
    user = User(telegram_user_id=telegram_user_id, region="Москва")
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@pytest.mark.asyncio
async def test_get_me(client: AsyncClient, db_session: AsyncSession):
    user = await _create_user(db_session, telegram_user_id=999001)
    token = create_jwt(user.telegram_user_id)

    resp = await client.get("/user/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["telegram_user_id"] == user.telegram_user_id
    assert data["plan"] == "free"


@pytest.mark.asyncio
async def test_get_me_unauthorized(client: AsyncClient):
    resp = await client.get("/user/me")
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_update_me_region(client: AsyncClient, db_session: AsyncSession):
    user = await _create_user(db_session, telegram_user_id=999002)
    token = create_jwt(user.telegram_user_id)

    resp = await client.patch(
        "/user/me",
        headers={"Authorization": f"Bearer {token}"},
        json={"region": "Санкт-Петербург"},
    )
    assert resp.status_code == 200
    assert resp.json()["region"] == "Санкт-Петербург"


@pytest.mark.asyncio
async def test_update_me_auto_renew(client: AsyncClient, db_session: AsyncSession):
    user = await _create_user(db_session, telegram_user_id=999003)
    token = create_jwt(user.telegram_user_id)

    resp = await client.patch(
        "/user/me",
        headers={"Authorization": f"Bearer {token}"},
        json={"auto_renew": True},
    )
    assert resp.status_code == 200
    assert resp.json()["auto_renew"] is True
