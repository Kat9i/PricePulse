from datetime import datetime
from uuid import UUID
from pydantic import BaseModel


class PaymentResponse(BaseModel):
    id: UUID
    amount: int
    status: str
    type: str
    created_at: datetime

    model_config = {"from_attributes": True}
