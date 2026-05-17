from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from db.session import get_db
from db.models import User
from api.dependencies import get_current_user
from api.schemas.user import UserResponse, UserUpdate

router = APIRouter(prefix="/user", tags=["user"])


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)) -> User:
    """Возвращает профиль текущего пользователя."""
    return current_user


@router.patch("/me", response_model=UserResponse)
async def update_me(
    body: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Обновляет регион или переключает автопродление подписки."""
    if body.region is not None:
        current_user.region = body.region
    if body.auto_renew is not None:
        current_user.auto_renew = body.auto_renew
    await db.commit()
    await db.refresh(current_user)
    return current_user
