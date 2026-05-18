from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from api.auth import router as auth_router
from api.routers.users import router as users_router
from api.routers.trackings import router as trackings_router
from api.routers.payments import router as payments_router
from api.routers.webhooks import router as webhooks_router
from api.limiter import limiter
from core.config import settings

app = FastAPI(
    title="PricePulse API",
    version="0.1.0",
    description="Бэкенд сервиса мониторинга цен на WB и Ozon",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

_origins = [o.strip() for o in settings.allowed_origins.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(trackings_router)
app.include_router(payments_router)
app.include_router(webhooks_router)


@app.get("/health", tags=["system"])
async def health() -> dict:
    """Проверка работоспособности сервиса."""
    return {"status": "ok"}
