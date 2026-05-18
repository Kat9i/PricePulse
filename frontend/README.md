# PricePulse Frontend

Telegram Mini App — трекер цен на WB и Ozon.

## Стек

- React 18 + TypeScript
- Vite 6
- Tailwind CSS 3 (кастомные дизайн-токены)
- React Router v6 (HashRouter)

## Запуск

```bash
# 1. Установить зависимости
npm install

# 2. Скопировать env и настроить URL бэкенда
cp .env.example .env

# 3. Запустить dev-сервер
npm run dev
# → http://localhost:5173

# 4. Собрать для production
npm run build
```

## Маршруты

| Путь | Экран |
|------|-------|
| `/#/` | Редирект → `/onboarding` или `/home` |
| `/#/onboarding` | Выбор региона (первый запуск) |
| `/#/home` | Главный экран — список товаров |
| `/#/settings` | Настройки |
| `/#/pro` | PRO-подписка / оплата |

Шторки (Add Product, Set Target, Product Detail) — оверлеи внутри `/home`, не отдельные маршруты.

## Dev-режим без Telegram

Если открыть в браузере вне Telegram, приложение автоматически использует mock-данные из `src/lib/mock.ts`.

## Структура

```
src/
├── App.tsx              # Роутер + загрузка данных
├── types.ts             # TypeScript интерфейсы
├── index.css            # Tailwind + CSS анимации
├── lib/
│   ├── api.ts           # HTTP-клиент к FastAPI
│   ├── telegram.ts      # Telegram WebApp SDK обёртка
│   ├── format.ts        # Форматирование цен и дат
│   └── mock.ts          # Mock-данные для разработки
├── components/
│   ├── ProductCard.tsx  # Карточка товара (4 состояния)
│   └── ui/              # Базовые UI-компоненты
│       ├── BottomSheet.tsx
│       ├── FAB.tsx
│       ├── Toggle.tsx
│       ├── Skeleton.tsx
│       └── PlatformBadge.tsx
└── pages/
    ├── OnboardingPage.tsx
    ├── HomePage.tsx
    ├── SettingsPage.tsx
    ├── ProPage.tsx
    └── sheets/
        ├── AddProductSheet.tsx   # Шаг 1: ввод ссылки
        ├── SetTargetSheet.tsx    # Шаг 2: целевая цена
        └── ProductDetailSheet.tsx
```
