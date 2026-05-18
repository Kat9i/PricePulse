# Changelog

Все значимые изменения фиксируются здесь.

Формат основан на [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Версии следуют [Semantic Versioning](https://semver.org/): `MAJOR.MINOR.PATCH`.
Типы коммитов следуют [Conventional Commits](https://www.conventionalcommits.org/).

---

## [Unreleased]

Изменения, которые войдут в следующий релиз.

### Added
- Создан DEVELOPMENT_RULES.md — правила разработки проекта
- Создан ARCHITECTURE.md — архитектура бэкенда (вариант 3: api + worker)
- Создан AI_CODING_BRIEF.md — бриф для разработки

---

## [0.3.0] - 2026-05-18 — Frontend + API integration

### Added (Backend: новые эндпоинты)
- `GET /trackings/lookup?url=` — предпросмотр товара по URL перед добавлением: вызывает парсер WB/Ozon, возвращает `{product, sellers}` без сохранения в БД
- `PATCH /trackings/{id}` — обновление целевой цены/процента снижения для существующего отслеживания
- `POST /payments/invoice` — создание ссылки на оплату PRO через Telegram Payments + ЮКасса (`createInvoiceLink`)
- `api/routers/payments.py` — новый роутер для платежей
- `core/config.py` → `payment_provider_token` — Telegram Payments provider token от ЮКасса

### Changed (Backend: доработка схем)
- `api/schemas/tracking.py` — добавлены `SellerInfo`, `TrackingUpdate`, `ProductLookupResponse`; `ProductInfo` теперь включает `sku` и `last_checked_at`; `TrackingResponse` включает `sellers` (через `model_validator`)
- `api/routers/trackings.py` — все запросы с отслеживаниями теперь загружают `product.sellers` через `selectinload`; добавлена функция `_detect_platform` для определения платформы по URL
- `api/main.py` — зарегистрирован `payments_router`
- `.env.example` — добавлена переменная `PAYMENT_PROVIDER_TOKEN`

### Added (Frontend: инфраструктура)
- `Dockerfile.frontend` — образ `node:20-alpine` для запуска Vite dev server в Docker
- `docker-compose.yml` → сервис `frontend` на порту `5173`, `BACKEND_URL=http://api:8000`
- `frontend/vite.config.ts` → proxy target читает `process.env.BACKEND_URL` (в Docker — имя сервиса, локально — `localhost:8000`)
- `frontend/.env` — `VITE_API_URL=/api` (через Vite proxy, без CORS)
- `frontend/.env.example` — пустые значения по правилам безопасности

### Changed (Frontend: API-интеграция по всем экранам)
- `frontend/src/lib/api.ts` — исправлен баг `access_token` → `token`; добавлена функция `bootstrapAuth()` возвращающая `{user, is_new}`; `platform` стал обязательным в `addTracking`; добавлен `createInvoice()`; ID-типы `string` вместо `number`
- `frontend/src/types.ts` — все `id` полей типа UUID исправлены с `number` на `string`; `Product.image_url` допускает `null`; `Tracking.sellers` обязательный (не `?`)
- `frontend/src/lib/mock.ts` — ID исправлены на UUID-строки для соответствия бэкенду
- `frontend/src/App.tsx` — использует `bootstrapAuth()` для детектирования нового пользователя (`is_new`) и автоматического перехода на онбординг; добавлен `ErrorScreen` с кнопкой "Попробовать снова"; добавлен `onTrackingUpdated` проп в `HomePage`
- `frontend/src/pages/HomePage.tsx` — добавлен `onTrackingUpdated` проп; `onTrackingDeleted` принимает `string` ID; `ProductDetailSheet` получает `onUpdated`
- `frontend/src/pages/sheets/ProductDetailSheet.tsx` — добавлен `onUpdated(t: Tracking)` проп; после успешного изменения цели вызывает `onUpdated` с обновлённым треккингом; `onDeleted` принимает `string` ID
- `frontend/src/pages/sheets/SetTargetSheet.tsx` — передаёт `platform` в `api.addTracking()`
- `frontend/src/pages/ProPage.tsx` — реальная интеграция Telegram Payments: вызывает `api.createInvoice()`, затем `Telegram.WebApp.openInvoice(url, callback)`; показывает ошибку оплаты; обновляет user через `onUserUpdate` после успешной оплаты; добавлен `onUserUpdate` проп

---

## [0.2.0] - 2026-05-17 — Backend MVP ✓ tested

### Added (Backend: окружение и инфраструктура)
- `.env`, `.env.example` — конфигурация секретов через pydantic-settings
- `.gitignore` — исключены .env, __pycache__, postgres_data/, и приватные документы
- `requirements.txt` — все зависимости (FastAPI, SQLAlchemy, Alembic, aiogram, httpx, playwright, APScheduler, pytest и др.)
- `docker-compose.yml` — сервисы postgres (healthcheck), api, worker
- `Dockerfile.api`, `Dockerfile.worker` — образы на python:3.12-slim

### Added (Backend: ядро и БД)
- `core/config.py` — Settings через pydantic-settings, все параметры из .env
- `db/models.py` — 7 ORM-моделей: User, Product, Tracking, Seller, PriceHistory, Notification, Payment
- `db/session.py` — async SQLAlchemy engine + get_db dependency
- `db/migrations/env.py` — async Alembic env (asyncio.run bridge)
- `db/migrations/versions/0001_initial_schema.py` — создание всех 7 таблиц с индексами и UNIQUE-ограничениями

### Added (Backend: API)
- `api/auth.py` — HMAC-SHA256 верификация Telegram initData, JWT (HS256, 30 дней), POST /auth/verify
- `api/dependencies.py` — HTTPBearer → decode_jwt → get_current_user
- `api/schemas/` — Pydantic-схемы: UserResponse, UserUpdate, TrackingResponse, TrackingCreate, PaymentResponse
- `api/routers/users.py` — GET /user/me, PATCH /user/me
- `api/routers/trackings.py` — GET/POST/DELETE /trackings, извлечение SKU из URL, проверка лимита тарифа
- `api/routers/webhooks.py` — POST /webhooks/telegram (заглушка), POST /webhooks/yukassa (продление подписки)
- `api/main.py` — FastAPI app, CORSMiddleware, все роутеры, GET /health

### Added (Backend: worker и парсеры)
- `parsers/base.py` — BaseParser ABC, ParseResult, SellerOffer dataclasses
- `parsers/wb.py` — парсер Wildberries через card.wb.ru API (httpx)
- `parsers/ozon.py` — парсер Ozon через httpx + BeautifulSoup (JSON-LD fallback)
- `worker/price_checker.py` — проверка цен всех активных товаров, upsert продавцов, запись истории, триггер уведомлений
- `worker/notifier.py` — отправка Telegram-уведомлений о цене и наличии через aiogram
- `worker/main.py` — запуск APScheduler (каждые 2 часа), первичная проверка при старте

### Added (Тесты)
- `tests/conftest.py` — SQLite in-memory БД, фикстуры client и db_session
- `tests/test_auth.py` — верификация initData, создание пользователя, невалидная подпись
- `tests/test_users.py` — GET/PATCH /user/me
- `tests/test_trackings.py` — добавление по URL и SKU, дубли, список, удаление, валидация

### db
- Применена миграция 0001 к PostgreSQL: созданы все 7 таблиц (users, product, tracking, seller, price_history, notification, payment)

### Fixed
- Dockerfile.worker: `playwright install chromium --with-deps` падал на Debian trixie из-за переименованных пакетов (`ttf-unifont` → `fonts-unifont`); исправлено явной установкой зависимостей + `playwright install chromium` без `--with-deps`

### Tested (2026-05-17)
- Все 8 API-endpoints из ARCHITECTURE.md протестированы live HTTP-запросами — все работают корректно
- Проверены: auth (JWT, replay-защита), user profile, trackings CRUD, лимиты тарифа, webhooks
- Swagger UI доступен на http://localhost:8000/docs
- Результаты тестирования сохранены в testbak.md

---

## [0.1.0] - 2026-05-17

### Added
- Инициализация репозитория
- Настройка SSH-авторизации для GitHub
- Создан .gitignore

---

## Формат записи

```markdown
## [X.Y.Z] - ГГГГ-ММ-ДД

### Added      — новые функции
### Changed    — изменения в существующих функциях
### Deprecated — функции, которые скоро будут удалены
### Removed    — удалённые функции
### Fixed      — исправления багов
### Security   — изменения, связанные с безопасностью
```
