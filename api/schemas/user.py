from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class UserResponse(BaseModel):
    telegram_user_id: int
    region: str
    plan: str
    subscription_until: Optional[datetime]
    auto_renew: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    region: Optional[str] = None
    auto_renew: Optional[bool] = None


class AuthVerifyRequest(BaseModel):
    init_data: str


class AuthVerifyResponse(BaseModel):
    token: str
    user: UserResponse
    is_new: bool
