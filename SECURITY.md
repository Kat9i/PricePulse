# Security Audit — PricePulse

Дата аудита: 2026-05-18

---

## Итог

| # | Категория | Статус | Критичность |
|---|-----------|--------|-------------|
| 1 | SQL Injection | ✅ Чисто | — |
| 2 | XSS | ✅ Чисто | — |
| 3 | CSRF | ✅ N/A | — |
| 4 | CORS | 🔴 Найдено → ✅ Исправлено | Высокая |
| 5 | Валидация данных | 🟡 Найдено → ✅ Исправлено | Средняя |
| 6 | Хранение токенов | ✅ Чисто | — |
| 7 | Rate Limiting | 🔴 Найдено → ✅ Исправлено | Высокая |
| 8 | Webhook подпись | 🟡 Найдено → ✅ Исправлено | Средняя |

---

## 1. SQL Injection — ЧИСТО

**Проверено:** все файлы в `api/routers/`, `api/auth.py`, `worker/price_checker.py`

Все запросы к БД используют SQLAlchemy ORM с параметризованными запросами. Строки не конкатенируются в SQL напрямую. Raw SQL отсутствует.

---

## 2. XSS (Cross-Site Scripting) — ЧИСТО

**Проверено:** все файлы в `frontend/src/`

React автоматически экранирует весь вывод в JSX. `dangerouslySetInnerHTML` и прямая работа с `innerHTML` в коде отсутствуют.

---

## 3. CSRF — N/A

API использует JWT Bearer-токены, которые браузер не включает в кросс-доменные запросы автоматически (в отличие от cookies). CSRF-атаки неприменимы к этой схеме аутентификации.

---

## 4. CORS — ИСПРАВЛЕНО

**Файл:** `api/main.py:18`

**Проблема:** `allow_origins=["*"]` в сочетании с `allow_credentials=True` — невалидная комбинация по спецификации CORS (браузер блокирует такие ответы). Любой домен мог делать запросы к API.

**Исправление:**
- `api/main.py` — origins теперь читаются из `settings.allowed_origins`
- `core/config.py` — добавлена настройка `allowed_origins: str = "http://localhost:5173"`
- `allow_credentials=False` — cookies не используются (JWT в Authorization header)
- `allow_methods` и `allow_headers` — сужены до конкретных значений
- `.env.example` — добавлена переменная `ALLOWED_ORIGINS`

```python
# ДО
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, ...)

# ПОСЛЕ
_origins = [o.strip() for o in settings.allowed_origins.split(",") if o.strip()]
app.add_middleware(CORSMiddleware, allow_origins=_origins, allow_credentials=False, ...)
```

**В продакшене** установить `ALLOWED_ORIGINS=https://web.telegram.org` (домен Telegram Mini Apps).

---

## 5. Валидация данных — ИСПРАВЛЕНО

**Файлы:** `api/schemas/tracking.py`, `api/schemas/user.py`

**Проблема:** Поля принимали строки и числа без ограничений — потенциальный вектор для DoS (огромные строки) и некорректных данных.

**Исправления:**

| Поле | До | После |
|------|----|-------|
| `TrackingCreate.url` | `Optional[str]` | `Field(max_length=2048)` |
| `TrackingCreate.sku` | `Optional[str]` | `Field(max_length=50)` |
| `TrackingCreate.platform` | `str` | `Field(max_length=10)` |
| `TrackingCreate.target_price` | `Optional[int]` | `Field(ge=1, le=100_000_000)` |
| `TrackingCreate.target_percent` | `Optional[float]` | `Field(gt=0, le=99)` |
| `TrackingUpdate.target_price` | `Optional[int]` | `Field(ge=1, le=100_000_000)` |
| `TrackingUpdate.target_percent` | `Optional[float]` | `Field(gt=0, le=99)` |
| `UserUpdate.region` | `Optional[str]` | `Field(max_length=100)` |

---

## 6. Хранение токенов — ЧИСТО

**Проверено:** `frontend/src/lib/api.ts`, все React-компоненты

JWT хранится в переменной модуля `let jwtToken: string | null = null` — только в памяти. `localStorage`, `sessionStorage`, `document.cookie` для токенов не используются. При обновлении страницы токен сбрасывается и получается заново через `bootstrapAuth()`.

---

## 7. Rate Limiting — ИСПРАВЛЕНО

**Проблема:** Отсутствие ограничений на частоту запросов. `/auth/verify` уязвим к перебору; `/trackings/lookup` вызывает внешние парсеры при каждом запросе.

**Исправления:**
- Добавлена зависимость `slowapi==0.1.9` в `requirements.txt`
- Создан `api/limiter.py` с общим `Limiter(key_func=get_remote_address)`
- Подключён обработчик 429 в `api/main.py`

| Эндпоинт | Лимит |
|----------|-------|
| `POST /auth/verify` | 10 запросов/минуту |
| `GET /trackings/lookup` | 20 запросов/минуту |

---

## 8. Webhook-подпись ЮКасса — ИСПРАВЛЕНО

**Файл:** `api/routers/webhooks.py:32`

**Проблема:** Эндпоинт `/webhooks/yukassa` принимал любые POST-запросы без верификации источника. Злоумышленник мог отправить фиктивное уведомление `payment.succeeded` и продлить подписку без оплаты.

**Исправление:** Добавлена проверка подписи `X-Yukassa-Signature` через `HMAC-SHA256(yukassa_secret_key, request_body)` с timing-safe сравнением (`hmac.compare_digest`). Проверка активна при наличии `YUKASSA_SECRET_KEY` в `.env`.

---

## Что осталось на продакшен

- Установить `ALLOWED_ORIGINS=https://web.telegram.org` в `.env` на сервере
- Рассмотреть IP-allowlist для `/webhooks/yukassa` (ЮКасса публикует диапазоны IP)
- Добавить HTTPS-only (решается на уровне nginx/reverse proxy)
- Настроить helmet-заголовки (X-Content-Type-Options, X-Frame-Options) — при необходимости через FastAPI middleware
