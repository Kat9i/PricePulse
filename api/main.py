from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.auth import router as auth_router
from api.routers.users import router as users_router
from api.routers.trackings import router as trackings_router
from api.routers.webhooks import router as webhooks_router

app = FastAPI(
    title="PricePulse API",
    version="0.1.0",
    description="Бэкенд сервиса мониторинга цен на WB и Ozon",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: сменить на конкретные домены в продакшене
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(trackings_router)
app.include_router(webhooks_router)


@app.get("/health", tags=["system"])
async def health() -> dict:
    """Проверка работоспособности сервиса."""
    return {"status": "ok"}
