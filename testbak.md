# PricePulse API — Результаты тестирования

**Дата:** 2026-05-17  
**API:** http://localhost:8000  
**Swagger UI:** http://localhost:8000/docs  
**OpenAPI JSON:** http://localhost:8000/openapi.json  

---

## Покрытие endpoints

Все 8 endpoints из ARCHITECTURE.md реализованы и протестированы.

| # | Метод | URL | Файл реализации | Статус |
|---|-------|-----|-----------------|--------|
| 1 | POST | /auth/verify | api/auth.py:74 | ✅ |
| 2 | GET | /user/me | api/routers/users.py:12 | ✅ |
| 3 | PATCH | /user/me | api/routers/users.py:18 | ✅ |
| 4 | GET | /trackings | api/routers/trackings.py:18 | ✅ |
| 5 | POST | /trackings | api/routers/trackings.py:33 | ✅ |
| 6 | DELETE | /trackings/{id} | api/routers/trackings.py:107 | ✅ |
| 7 | POST | /webhooks/telegram | api/routers/webhooks.py:18 | ✅ |
| 8 | POST | /webhooks/yukassa | api/routers/webhooks.py:32 | ✅ |
| — | GET | /health | api/main.py:29 | ✅ (служебный) |

---

## Результаты HTTP-тестов

### GET /health
```
GET http://localhost:8000/health
→ 200 {"status":"ok"}
```

### POST /auth/verify

```
POST http://localhost:8000/auth/verify
Body: {"init_data": "<telegram_init_data>"}

→ 200 {
    "token": "eyJhbGci...",
    "user": {"telegram_user_id": 123456789, "region": "Москва", "plan": "free", ...},
    "is_new": true
  }

→ 401  невалидный hash
→ 401  устаревший auth_date (> 1 часа)
```

### GET /user/me

```
GET http://localhost:8000/user/me
Authorization: Bearer <token>

→ 200 {"telegram_user_id": 123456789, "region": "Москва", "plan": "free", ...}
→ 403  без заголовка Authorization
→ 401  невалидный JWT
```

### PATCH /user/me

```
PATCH http://localhost:8000/user/me
Authorization: Bearer <token>
Body: {"region": "Saint-Petersburg", "auto_renew": true}

→ 200 {"region": "Saint-Petersburg", "auto_renew": true, ...}
```

### GET /trackings

```
GET http://localhost:8000/trackings
Authorization: Bearer <token>

→ 200 []                          (пустой список)
→ 200 [{...}, {...}]               (после добавления 2 трекингов)
```

### POST /trackings

```
# По URL (WB) — SKU извлекается из /catalog/12345678/
POST http://localhost:8000/trackings
Body: {"url": "https://www.wildberries.ru/catalog/12345678/detail.aspx", "platform": "wb", "target_price": 100000}
→ 201 {"id": "0d52b299-...", "product": {"sku": "12345678", "platform": "wb", ...}, "target_price": 100000, ...}

# По SKU (Ozon)
POST http://localhost:8000/trackings
Body: {"sku": "987654321", "platform": "ozon", "target_percent": 15.0}
→ 201 {"id": "2a4eb81b-...", "product": {"platform": "ozon", ...}, "target_percent": 15.0, ...}

# Дубль
→ 409 {"detail": "Этот товар уже отслеживается"}

# Нет url и sku
Body: {"platform": "wb", "target_price": 1000}
→ 422

# Оба target_price и target_percent
→ 422

# Неизвестная платформа
Body: {"sku": "111", "platform": "amazon", "target_price": 1000}
→ 422

# Превышение лимита free-плана (10 трекингов)
→ 403 {"detail": "Достигнут лимит отслеживаний для тарифа (10 товаров)"}
```

### DELETE /trackings/{id}

```
DELETE http://localhost:8000/trackings/0d52b299-fedb-44cf-b9ce-02946d1c3a79
Authorization: Bearer <token>

→ 200 {"ok": true}
→ 404  повторный DELETE (уже удалён)
→ 404  чужой tracking_id
```

### POST /webhooks/telegram

```
POST http://localhost:8000/webhooks/telegram
Body: {"update_id": 1, "message": {"text": "/start"}}

→ 200 {"ok": true}
```
> Заглушка — логирует тело, возвращает ok. Полная обработка (aiogram dispatcher) — V1 задача.

### POST /webhooks/yukassa

```
POST http://localhost:8000/webhooks/yukassa
Body: {"event": "payment.succeeded", "object": {"id": "test-yukassa-id-001", "status": "succeeded"}}

→ 200 {"ok": true}
```
> Обработка payment.succeeded: ищет Payment по yukassa_id, если найден — обновляет статус и продлевает subscription_until +30 дней. Тест с незнакомым yukassa_id возвращает 200 (payment не найден — игнорируется).

---

## Найденные проблемы

### ❌ Dockerfile.worker — сборка падает на Debian trixie

**Симптом:**
```
E: Package 'ttf-unifont' has no installation candidate
E: Package 'ttf-ubuntu-font-family' has no installation candidate
Failed to install browsers
Error: Installation process exited with code: 100
```

**Причина:** `playwright install chromium --with-deps` пытается поставить пакеты, которые переименованы в Debian trixie (`ttf-unifont` → `fonts-unifont`, `ttf-ubuntu-font-family` удалён).

**Исправление в Dockerfile.worker:** заменено на явную установку нужных пакетов с актуальными именами + `playwright install chromium` без `--with-deps`.

---

## Расхождения с ARCHITECTURE.md (не баги)

| # | Что | ARCHITECTURE.md | Код | Оценка |
|---|-----|-----------------|-----|--------|
| 1 | Поле в ответе /trackings | `tracking_id` | `id` | Норма — в документе пояснительное название, не имя поля |
| 2 | `created_at` в ответах | Не упомянут | Присутствует | Лишним не является |
| 3 | Endpoint создания платежа | Упомянут в флоу, но нет в таблице API | Не реализован | V2 задача |
| 4 | Кириллица в PowerShell | — | UTF-8 корректный, проблема рендеринга Windows terminal | Не баг API |

---

## Нереализованные части (по архитектуре — V2 или отложены)

- Полная обработка Telegram webhook через aiogram dispatcher (команды бота, pre_checkout_query)
- Endpoint создания платежного invoice для Telegram Payments
- История цен: `GET /trackings/{id}/history` (не задокументирован в V1)
- Playwright fallback в парсерах (структура есть, вызов не подключён)
