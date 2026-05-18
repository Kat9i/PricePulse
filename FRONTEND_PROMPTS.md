# PricePulse — Frontend Design Prompts

_Детальные промпты для генерации дизайна каждого экрана. Используй в v0.dev, Lovable, Bolt, Figma AI или Midjourney._

---

## Общий дизайн-токены (вставляй в начало каждого промпта)

```
Design system tokens to apply across all screens:
- Font: Inter (Google Fonts). Tabular-nums for all prices/numbers.
- Primary: #6C5CE7 (purple — brand, CTA buttons)
- Success: #00B894 (green — price dropped, deal)
- Danger: #D63031 (red — price rose, out of stock)
- Background: #F5F4FF (light lavender page background)
- Surface: #FFFFFF (cards, modals, sheets)
- Text Primary: #2D3436
- Text Secondary: #636E72
- Border: #EDEDF5
- Border radius: 16px for cards, 12px for buttons, 24px top for bottom sheets
- Shadows: 0 2px 12px rgba(108,92,231,0.08) for cards
- Platform badge WB: background #CB11AB (Wildberries brand pink — brief says "фиолетовый" но #CB11AB даёт мгновенное узнавание бренда), white text, 6px border-radius, 10px font
- Platform badge Ozon: background #0069FF (Ozon blue), white text, 6px border-radius, 10px font
- Telegram Mini App viewport: 390×844px (iPhone 14 size), safe area bottom 34px
```

---

## Экран 1 — Онбординг: Выбор региона

**Когда показывается:** только при первом открытии Mini App. Пользователь ещё не выбрал регион.

### Промпт для v0.dev / Lovable

```
Build a Telegram Mini App onboarding screen for "PricePulse" — a price tracking app for Wildberries and Ozon marketplaces.

Screen: Region selection (shown only on first launch).

Layout (390×844px, mobile):
- Background: #F5F4FF
- Top area (centered, padding-top 56px):
  - App logo: a small purple pulse/wave icon (32px) above the app name
  - App name "PricePulse" in bold 24px #2D3436
  - Tagline below: "Слежу за ценами, пока ты занимаешься делами" in 15px #636E72, centered, max-width 280px
- Illustration (centered, 200px height): minimal flat illustration of a shopping bag with a downward price arrow and a location pin, colors #6C5CE7 and #00B894, on transparent background
- Section label: "Выбери свой регион" 13px semibold #636E72 uppercase tracking-wider, left-aligned with 20px padding
- Search field: full-width, 52px height, 16px border-radius, border 1.5px #EDEDF5, background white, search icon #6C5CE7 left side, placeholder "Поиск города..." in #636E72
- Region list (scrollable, below search):
  - Each row: 56px height, city name 16px #2D3436, subtle divider #EDEDF5 at bottom
  - Popular cities at top with a subtle "⭐ Популярные" label: Москва, Санкт-Петербург, Екатеринбург, Казань, Новосибирск
  - Then alphabetical full list: Нижний Новгород, Ростов-на-Дону, Уфа, Красноярск, Самара...
  - Tapping a city shows a purple checkmark #6C5CE7 on the right
- Bottom: fixed CTA button "Продолжить →" full-width minus 20px padding, 56px height, background #6C5CE7, white text 16px semibold, 16px border-radius, disabled (opacity 0.4) until region is selected

Visual mood: clean, welcoming, trustworthy. No clutter. Fintech lightness.
```

### Промпт для Midjourney / Leonardo AI (визуальный)

```
Mobile UI design, Telegram Mini App onboarding screen, "PricePulse" price tracker app. Region/city selection screen. Light lavender background #F5F4FF. Purple brand color #6C5CE7. Clean modern fintech aesthetic. Inter font. Shopping bag illustration with location pin. Search bar. Scrollable city list with checkmarks. Purple CTA button at bottom. iPhone 14 frame. Ultra-clean, minimal, friendly. --ar 9:19 --style raw
```

---

## Экран 2 — Главный экран: Список товаров (заполненный)

**Когда показывается:** каждый раз при открытии, если есть хотя бы 1 товар.

### Промпт для v0.dev / Lovable

```
Build the main screen of "PricePulse" Telegram Mini App — a scrollable list of tracked products.

Layout (390×844px):
- Background: #F5F4FF
- Top bar (no back button, this is home):
  - Left: "PricePulse" 18px bold #2D3436
  - Right: avatar/icon button for Settings (gear icon, 36px circle, background white, border #EDEDF5, icon #636E72)
  - Below title: small region chip "📍 Москва" — 12px, background white, border #EDEDF5, 20px border-radius, #636E72 text — tappable to change region
- Subscription banner (shown for free users): horizontal card, background linear-gradient(135deg, #6C5CE7, #a29bfe), 16px border-radius, 16px margin horizontal, 12px padding. Left: "⚡ PRO — до 50 товаров" white 13px bold + "Сейчас: 7 / 10 бесплатных" white 11px. Right: "100 ₽/мес →" white pill button 10px font, background rgba(255,255,255,0.2)
- Section label: "Отслеживаю" 13px semibold #636E72 uppercase, left 20px padding
- Product cards list (vertical scroll, gap 12px, horizontal padding 16px):

  CARD 1 (active, price dropped — SUCCESS state):
  - White card, 16px border-radius, shadow 0 2px 12px rgba(108,92,231,0.08)
  - Left: product thumbnail 64×64px, 12px border-radius, object-fit cover (image of white sneakers)
  - Platform badge "WB" (pink #CB11AB background, white text, top-left of thumbnail)
  - Right content:
    - Product name: "Кроссовки Nike Air Max 270" 14px medium #2D3436, 2 lines max, ellipsis
    - Current best price: "4 890 ₽" 20px semibold #2D3436, tabular-nums
    - Target price row: "Цель: 4 500 ₽" 12px #636E72
    - Status badge: "↓ −8% выгодно" green #00B894 background (10% opacity), green text, 6px border-radius, 11px font
    - Bottom row: "Проверено 15 мин назад" 11px #636E72

  CARD 2 (active, just added / waiting — TRACKING state):
  - Same structure
  - Product: "Термос Stanley 1L, серый" (image of grey thermos)
  - Badge: "Ozon" (blue #0069FF background)
  - Price: "3 200 ₽"
  - Target: "Цель: 2 800 ₽"
  - Status badge: "● Отслеживается" light grey background #F0F0F5, grey text #636E72, animated dot pulse
  - Subline: "↑ Выше цели на 400 ₽" 11px #636E72
  - "Проверено 1 час назад"

  CARD 3 (out of stock — DANGER state):
  - Product: "Платье Zara лён, размер M" (image dimmed, overlay)
  - Badge: "WB"
  - Price: "—" (em dash, no price)
  - Status badge: "✕ Нет в наличии" red #D63031 background (10% opacity), red text
  - Card has slight opacity 0.7

  CARD 4 (frozen — FROZEN state, for PRO lapsed users):
  - Card has dashed border 1.5px #EDEDF5, background #FAFAFA
  - Badge: "Ozon"
  - Product: "Наушники Sony WH-1000XM5"
  - Overlay chip: "❄ Заморожен" small grey pill
  - Bottom: "Оформи PRO чтобы разморозить" 11px purple #6C5CE7, tappable

- FAB button (Floating Action Button):
  - Fixed bottom right: 20px from right, 90px from bottom (above Telegram nav)
  - 60px circle, background #6C5CE7, white "+" 28px icon
  - Subtle shadow 0 4px 20px rgba(108,92,231,0.4)

Visual: airy, readable. Cards feel like a clean shopping list. Not overwhelming.
```

### Промпт для Midjourney

```
Telegram Mini App main screen UI, PricePulse price tracker, list of 4 product tracking cards. Light lavender background. White cards with product thumbnails (sneakers, thermos, dress, headphones). Purple and green status badges. Platform badges WB pink and Ozon blue. Purple floating action button bottom right with plus icon. Clean fintech mobile design, Inter font, iPhone 14 mockup. --ar 9:19 --style raw
```

---

## Экран 3 — Главный экран: Пустой (Empty State)

**Когда показывается:** первый запуск после выбора региона, или если удалены все товары.

### Промпт для v0.dev / Lovable

```
Build the empty state of "PricePulse" Telegram Mini App main screen.

Layout (390×844px):
- Background: #F5F4FF
- Top bar: same as main screen — "PricePulse" title + settings gear + region chip "📍 Москва"
- Center of screen (vertically centered between header and bottom):
  - Illustration: friendly minimal flat art — an empty shopping bag with a small magnifying glass and sparkle, colors #6C5CE7 (purple) and #00B894 (green), 160px height, centered
  - Heading: "Пока ничего не слежу" 18px semibold #2D3436, centered
  - Subtext: "Добавь первый товар — вставь ссылку с WB или Ozon и укажи желаемую цену" 14px #636E72, centered, max-width 280px, line-height 1.5
  - CTA button: "Добавить товар" 200px wide, 52px height, background #6C5CE7, white text 15px semibold, 14px border-radius, centered
    - Small "+" icon left of text
- Bottom hint: "Бесплатно до 10 товаров" 12px #636E72, centered, 24px above safe area

Visual: encouraging, not alarming. Like a friendly nudge to start.
```

---

## Экран 4 — Bottom Sheet: Добавить товар (Шаг 1 из 2)

**Когда показывается:** при нажатии FAB "+" на главном экране.

### Промпт для v0.dev / Lovable

```
Build a bottom sheet modal for "PricePulse" Telegram Mini App — Step 1 of adding a product.

The sheet slides up from the bottom, covering ~70% of the screen. Background overlay: rgba(0,0,0,0.4).

Sheet container:
- Background: #FFFFFF
- Border-radius: 24px top-left and top-right only
- Drag handle: 4×36px pill, background #EDEDF5, centered, 12px from top

Sheet content (padding 20px horizontal):
- Title: "Добавить товар" 18px bold #2D3436
- Subtitle: "Шаг 1 из 2" 12px #636E72
- Step indicator: two dots — first dot filled #6C5CE7 (16px), second dot hollow #EDEDF5 (10px), centered row with gap 8px

- Label: "Ссылка или артикул" 13px semibold #2D3436, margin-top 24px
- Text input field:
  - Height 56px, full-width, border 1.5px #EDEDF5, 12px border-radius
  - Background: #FAFAFA
  - Placeholder: "https://www.wildberries.ru/catalog/..."
  - Right side: "Вставить" text button 13px #6C5CE7 (triggers clipboard paste)
  - Below field: helper text "Поддерживаем WB и Ozon" 12px #636E72

- Platform auto-detect result card (shown after valid URL pasted):
  - White card, border 1.5px #EDEDF5, 12px border-radius, padding 12px
  - Left: product thumbnail 48×48px (placeholder shimmer/skeleton if loading)
  - Left thumbnail has "WB" badge (pink)
  - Right:
    - Product name: "Кроссовки Nike Air Max 270" 14px medium #2D3436
    - Current price: "5 340 ₽" 16px semibold #2D3436 (tabular-nums)
    - "В наличии" 12px green #00B894
  - Loading state: skeleton shimmer animation on name and price

- Error state (invalid URL):
  - Input border turns #D63031
  - Below input: "Не удалось найти товар. Проверь ссылку." 12px #D63031
  - Shake animation on input

- Bottom CTA (fixed to sheet bottom, 20px padding, 16px from bottom):
  - "Далее →" full-width, 52px, #6C5CE7 background, white 15px semibold, 12px border-radius
  - Disabled (opacity 0.4) until product found

- LIMIT REACHED STATE (shown instead of input when free user already has 10 items):
  - Input field hidden
  - Center card (border 1.5px #EDEDF5, 14px border-radius, padding 20px, text-align center):
    - Icon: 🔒 or padlock SVG, 32px, #6C5CE7
    - Heading: "Достигнут лимит 10 товаров" 16px semibold #2D3436
    - Subtext: "Перейди на PRO — следи за 50 товарами всего за 100 ₽/месяц" 13px #636E72, line-height 1.5
    - CTA inside card: "Перейти на PRO" full-width, 48px, #6C5CE7 background, white 14px semibold
    - Ghost link: "Удалить старый товар" 12px #636E72 centered, tappable → closes sheet and returns to list
```

---

## Экран 5 — Bottom Sheet: Настройка цели (Шаг 2 из 2)

**Когда показывается:** после успешного нахождения товара на шаге 1.

### Промпт для v0.dev / Lovable

```
Build a bottom sheet for "PricePulse" — Step 2: Set price target.

Sheet structure (same as Step 1 — slides up 75% of screen, white, 24px top radius):

Header:
- Back arrow (left) | "Настроить цель" 18px bold | close X (right)
- Subtitle: "Шаг 2 из 2"
- Step indicator: two filled dots #6C5CE7

Product recap card (compact, read-only):
- Small horizontal card: thumbnail 40×40px + "Кроссовки Nike Air Max 270" 13px + "WB" badge
- Current price: "Сейчас: 5 340 ₽" 13px #636E72
- Border: 1.5px #EDEDF5, 10px border-radius, padding 10px 12px

Target type selector:
- Label: "Хочу получить уведомление когда:" 13px #636E72
- Two segmented toggle buttons side by side (equal width):
  - Option A (selected): "По сумме" — background #6C5CE7, white text 14px semibold, 10px border-radius
  - Option B: "По скидке %" — background #F5F4FF, #636E72 text 14px, 10px border-radius

Input for Option A (fixed price):
- Label "Целевая цена" 13px semibold #2D3436
- Input field: 64px height, 14px border-radius, border 1.5px #6C5CE7 (focused purple)
- Large centered number input: "4 500" 24px semibold #2D3436 tabular-nums
- Right label: "₽" 16px #636E72
- Helper row below: 
  - "Текущая: 5 340 ₽" on left 12px #636E72
  - "Скидка: −16%" on right 12px #00B894

Input for Option B (percentage, shown when toggled):
- Label "Снижение от текущей цены" 13px semibold
- Input: big centered "20" + "%" suffix 24px semibold
- Helper: "Уведомлю при цене ниже 4 272 ₽" 12px #636E72 (calculated in real time)

Quick select chips below input (for %, option B):
- Row of pills: "−5%", "−10%", "−15%", "−20%", "−30%"
- Pill style: 32px height, 12px border-radius, border #EDEDF5, 12px font
- Selected: purple fill #6C5CE7 white text

Bottom CTA:
- "Начать слежку" full-width 52px, #6C5CE7 background, white 15px semibold
- Loading state: spinner inside button, text "Добавляю..."
- Success state (briefly shown): green checkmark + "Товар добавлен!" text before sheet closes
```

---

## Экран 6 — Детали товара (расширенная карточка)

**Когда показывается:** при нажатии на карточку товара в списке. Открывается как bottom sheet или новый экран.

### Промпт для v0.dev / Lovable

```
Build a product detail bottom sheet for "PricePulse" — shows full info about a tracked product.

Sheet covers 85% of screen height, white, 24px top radius, scrollable.

Header:
- Drag handle top center
- Back/close X top right
- Platform badge "WB" (pink) top-left

Product section:
- Large product image: full-width, 200px height, object-fit contain, background #FAFAFA, 12px border-radius
- Product title: "Кроссовки Nike Air Max 270, белые, размер 42" 16px medium #2D3436, 2 lines
- Brand/SKU: "Артикул: 148293847" 12px #636E72

Price section (card style, border #EDEDF5, 12px border-radius, padding 16px):
- Row: "Лучшая цена сейчас" 13px #636E72 | "4 890 ₽" 22px semibold #2D3436 tabular-nums
- Row: "Ваша цель" 13px #636E72 | "4 500 ₽" 16px #6C5CE7 tabular-nums
- Progress bar: shows how close current price is to target
  - Track: #EDEDF5, fill: gradient from #D63031 (left) to #00B894 (right) based on proximity
  - Current position marker: small purple circle
  - Label: "До цели: −390 ₽ (−8%)" 12px #636E72 centered

Sellers section:
- Title: "Продавцы" 14px semibold #2D3436
- List of sellers (sorted by price asc):
  - Row: seller name "WB Продавец" 13px #2D3436 | price "4 890 ₽" 14px semibold tabular-nums | "Купить →" link button #6C5CE7 12px
  - Row: "Fashion Store" | "5 100 ₽" | "Купить →"
  - Row: "NikeOfficial" | "5 490 ₽" | "Купить →"
  - Dividers between rows #EDEDF5

Tracking settings (edit inline):
- "Изменить цель" 13px #6C5CE7, tappable → opens price input
- "Удалить из слежки" 13px #D63031, tappable → confirm dialog

Last check: "Последняя проверка: 18 мая, 14:32" 12px #636E72 bottom
```

---

## Экран 7 — Настройки

**Когда показывается:** при нажатии на шестерёнку в правом верхнем углу.

### Промпт для v0.dev / Lovable

```
Build the Settings screen for "PricePulse" Telegram Mini App.

Layout (full screen, 390×844px):
- Background: #F5F4FF
- Navigation: top bar with back arrow + "Настройки" 18px bold centered

User section (card, white, 16px border-radius, 16px margin, padding 16px):
- Telegram avatar (circle 48px, gradient purple placeholder)
- Name: "Александра К." 16px semibold #2D3436 (from Telegram)
- "Пользователь с мая 2026" 12px #636E72

Subscription section (card, same style):
- Section label: "ПОДПИСКА" 11px #636E72 uppercase tracking-wider
- Free plan row:
  - Left: "🆓 Бесплатный план" 15px #2D3436
  - Right: "7 / 10 товаров" 13px #636E72
- PRO upgrade row (highlighted):
  - Full-width card inside card: gradient #6C5CE7→#a29bfe, 12px border-radius
  - "⚡ Перейти на PRO" 14px bold white
  - "До 50 товаров · 100 ₽/мес" 11px white opacity 0.85
  - Arrow → right side white

  --- OR IF PRO ACTIVE ---
  - "⚡ PRO активен" 15px #6C5CE7 semibold
  - "Следующее списание: 18 июня 2026" 12px #636E72
  - Toggle row: "Автопродление" label 15px #2D3436 | iOS-style toggle (ON = purple #6C5CE7, OFF = #EDEDF5)

Region section (card):
- Label: "РЕГИОН" 11px #636E72 uppercase
- Row: "📍 Регион доставки" 15px #2D3436 | "Москва" 14px #6C5CE7 + chevron right
- Subtext: "Влияет на цену товаров" 12px #636E72
- Tapping this row re-opens the region picker from Screen 1 (full onboarding picker, pre-selected current region, button changes to "Сохранить")

Notifications section (card):
- Label: "УВЕДОМЛЕНИЯ" 11px
- Note: toggles below are extra UX beyond the brief scope — brief mandates sending these notifications always
- Row: "🔔 Уведомления о цене" | toggle ON purple
- Row: "📦 Товар не в наличии" | toggle ON purple

Support section (card):
- "💬 Написать в поддержку" row → opens Telegram chat
- "⭐ Оценить приложение" row → opens Telegram store rating

Version: "PricePulse v1.0.0" 11px #636E72 centered, bottom
```

---

## Экран 8 — PRO-подписка / Оплата

**Когда показывается:** при нажатии на "Перейти на PRO" в настройках или при превышении лимита 10 товаров.

### Промпт для v0.dev / Lovable

```
Build the PRO subscription paywall screen for "PricePulse" Telegram Mini App.

This screen can be a full-screen modal or bottom sheet (85% height preferred).

Top section:
- Close X top right
- Center: ⚡ lightning bolt emoji 48px
- Title: "PricePulse PRO" 24px bold #2D3436 centered
- Subtitle: "Слежу за большим — плачу меньше" 14px #636E72 centered

Features comparison (card, white, 16px border-radius, padding 16px, margin 16px):
- Header row: "" | "Бесплатно" (grey) | "PRO" (purple #6C5CE7 bold)
- Row 1: "Товаров" | "до 10" | "до 50"
- Row 2: "Платформы" | "WB + Ozon" ✓ | "WB + Ozon" ✓
- Row 3: "Все продавцы" | ✓ | ✓
- Row 4: "Замороженные товары" | — | ✓
- PRO column values in #6C5CE7, free column in #636E72
- Row dividers #EDEDF5
- PRO column has subtle #F5F4FF background

Price block:
- "100 ₽ / месяц" 28px bold #2D3436 centered tabular-nums
- Small text: "Первый месяц — попробуй, отмени в любой момент" 12px #636E72 centered

Auto-renew toggle row:
- "Автопродление" 14px #2D3436 | toggle (default ON, purple)
- "Отменить можно в настройках в любой момент" 11px #636E72

CTA:
- "Оплатить 100 ₽ →" full-width 56px button, background #6C5CE7, white 16px semibold
- Below: "🔒 Оплата через Telegram Payments · ЮКасса" 11px #636E72 centered, with small lock icon
- Second button (ghost): "Попробовать бесплатный план" 13px #636E72, no border, centered

Success state (after payment):
- Green checkmark animation (lottie-style)
- "PRO активирован! 🎉" 20px bold #00B894
- "Теперь можно добавить до 50 товаров" 14px #636E72
- "Отлично →" button green #00B894
```

---

## Экран 9 — Замороженные товары (после истечения PRO)

**Когда показывается:** если подписка истекла, а товаров было больше 10.

### Промпт для v0.dev / Lovable

```
Build a "frozen items" banner state for "PricePulse" main screen — shown when PRO subscription expired.

This is NOT a separate screen, but a modification of the main screen (Screen 2).

Changes to apply to the main screen:
1. Warning banner at top (below top bar):
   - Background: linear-gradient(135deg, #D63031, #e17055)
   - Padding 14px 16px, margin 0 16px 8px, 14px border-radius
   - Text: "❄ Подписка истекла — 3 товара заморожены" white 13px semibold
   - Subtext: "Продли PRO чтобы возобновить слежку за всеми товарами" white 11px opacity 0.9
   - Right: "Продлить →" small white outlined pill button

2. Active cards (first 10): show normally as in Screen 2

3. Frozen cards (items 11+): visually distinct
   - Card background: #F8F8FF (very light, almost white with blue tint)
   - Card border: 1.5px dashed #EDEDF5
   - All text: opacity 0.5
   - Product image: grayscale filter
   - Overlay chip on image: "❄ Заморожен" — small pill, background rgba(108,92,231,0.1), text #6C5CE7 9px
   - Price shows as "—" (tracking paused)
   - No status badge (replaced by frozen chip)
   - Bottom of card: "Оформи PRO → возобновить" 11px #6C5CE7 tappable

4. Section labels:
   - Above active: "Отслеживаю (10)" 13px semibold #636E72
   - Above frozen: "Заморожено (3)" 13px semibold #636E72

Visual: communicates loss without panic. Frozen items visible but clearly paused. Upgrade CTA prominent but not aggressive.
```

---

## Экран 10 — Telegram-уведомление (вид в чате)

**Это не экран приложения, но важно задизайнить текст уведомлений.**

### Промпт (для генерации примера уведомлений в Telegram)

```
Design examples of Telegram bot notification messages for "PricePulse" price tracker. These appear as regular Telegram messages from a bot. Show 3 message variants:

MESSAGE 1 — Price reached target:
Bubble style: Telegram bot message, light grey bubble.
Text content:
"🟢 Цена достигла цели!

Кроссовки Nike Air Max 270
━━━━━━━━━━━━━━
💰 Цена: 4 490 ₽ (была 5 340 ₽)
📉 Скидка: −16%
🏪 Продавец: Fashion Store
📦 Wildberries

[Купить за 4 490 ₽ →]"

Button: Telegram inline button "Купить за 4 490 ₽ →" with Wildberries deep link.

MESSAGE 2 — Out of stock alert:
"🔴 Товар пропал из наличия

Термос Stanley 1L, серый
━━━━━━━━━━━━━━
Товар временно недоступен на Ozon.
Продолжу следить и сообщу, когда появится.

[Открыть PricePulse]"

Style: friendly, concise, no spam. Clear emoji visual hierarchy. Not more than 5 lines per message.

Note: reminder notifications (e.g. "подписка истекает через 3 дня") are NOT in V1 scope per the brief — omitted intentionally.
```

---

## Полный системный промпт (для генерации всего дизайна в одном запросе)

_Используй этот промпт если хочешь получить сразу все экраны в одном запросе к Lovable/Bolt._

```
Create a complete Telegram Mini App called "PricePulse" — a price tracker for Wildberries and Ozon marketplaces. Target audience: Russian women 25–45 who shop on WB/Ozon and want price drop alerts.

DESIGN SYSTEM:
- Font: Inter. Tabular-nums for all prices.
- Colors: Primary #6C5CE7 (purple), Success #00B894 (green), Danger #D63031 (red), Background #F5F4FF (lavender), Surface #FFFFFF, Text #2D3436, Secondary text #636E72, Border #EDEDF5
- Border radius: 16px cards, 12px buttons, 24px top for bottom sheets
- Card shadow: 0 2px 12px rgba(108,92,231,0.08)
- WB badge: #CB11AB background, white text
- Ozon badge: #0069FF background, white text

SCREENS TO BUILD:

1. ONBOARDING — Region selection: Center illustration + "Выбери регион" + search field + scrollable city list + "Продолжить" CTA button

2. HOME — Product list: Top bar (logo + settings gear + region chip) + optional PRO banner + scrollable cards list + purple FAB button "+"
   Card states: active/success (green badge "↓ выгодно"), active/waiting (grey badge), out-of-stock (red badge), frozen (dashed border, grayscale)

3. EMPTY HOME — Same header + centered illustration + "Добавить товар" CTA

4. ADD PRODUCT SHEET (step 1): Bottom sheet 70% height + URL/SKU input field + auto-detected product preview card + "Далее →" button

5. SET TARGET SHEET (step 2): Bottom sheet + product recap + segmented toggle "По сумме / По скидке %" + price/percent input + quick-select chips + "Начать слежку" button

6. PRODUCT DETAIL SHEET: 85% height sheet + large image + price vs target section with progress bar + sellers list sorted by price + edit/delete actions

7. SETTINGS: Full screen + user info card + subscription card (free/PRO with auto-renew toggle) + region row + notification toggles + support links

8. PRO PAYWALL: Modal/sheet + feature comparison table (free vs PRO) + "100 ₽/месяц" price + auto-renew toggle + Telegram Payments CTA button

9. FROZEN STATE: Modified home screen with red warning banner + first 10 cards active + remaining cards shown with ❄ frozen overlay + "Продлить PRO" CTA

All screens: 390×844px, Telegram Mini App viewport, safe area bottom 34px. Russian language UI. Mood: clean, friendly, trustworthy fintech. Reference: Telegram Wallet app aesthetic.
```

---

_Документ сгенерирован на основе AI_CODING_BRIEF.md · PricePulse · Май 2026_
