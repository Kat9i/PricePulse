import { useState, useMemo } from 'react'
import { MapPin, Search } from 'lucide-react'

const POPULAR = ['Москва', 'Санкт-Петербург', 'Екатеринбург', 'Казань', 'Новосибирск']

const ALL_CITIES = [
  'Астрахань', 'Барнаул', 'Белгород', 'Брянск', 'Владивосток',
  'Волгоград', 'Воронеж', 'Екатеринбург', 'Иваново', 'Иркутск',
  'Казань', 'Калининград', 'Кемерово', 'Краснодар', 'Красноярск',
  'Москва', 'Набережные Челны', 'Нижний Новгород', 'Новосибирск',
  'Омск', 'Оренбург', 'Пенза', 'Пермь', 'Ростов-на-Дону',
  'Рязань', 'Самара', 'Санкт-Петербург', 'Саратов', 'Тверь',
  'Томск', 'Тула', 'Тюмень', 'Уфа', 'Ульяновск',
  'Хабаровск', 'Челябинск', 'Ярославль',
]

interface Props {
  onComplete: (region: string) => Promise<void> | void
}

export function OnboardingPage({ onComplete }: Props) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const filtered = useMemo(() => {
    if (!query.trim()) return ALL_CITIES
    const q = query.toLowerCase()
    return ALL_CITIES.filter((c) => c.toLowerCase().includes(q))
  }, [query])

  const popularFiltered = query ? [] : POPULAR

  async function handleContinue() {
    if (!selected) return
    setSaving(true)
    try {
      await onComplete(selected)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-bg">
      {/* Шапка */}
      <div className="flex flex-col items-center pt-14 pb-6 px-5">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
          <span className="text-3xl">📦</span>
        </div>
        <h1 className="text-2xl font-bold text-text-main">PricePulse</h1>
        <p className="text-[15px] text-text-muted text-center mt-1 max-w-[280px] leading-relaxed">
          Слежу за ценами, пока ты занимаешься делами
        </p>
      </div>

      {/* Поиск */}
      <div className="px-5 mb-3">
        <p className="text-[13px] font-semibold text-text-muted uppercase tracking-wider mb-3">
          Выбери свой регион
        </p>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-primary w-4 h-4" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск города..."
            className="
              w-full h-[52px] pl-9 pr-4 rounded-btn
              border border-border bg-surface
              text-[15px] text-text-main placeholder:text-text-muted
              focus:outline-none focus:border-primary transition-colors
            "
          />
        </div>
      </div>

      {/* Список городов */}
      <div className="flex-1 overflow-y-auto scrollbar-none px-5">
        {popularFiltered.length > 0 && (
          <>
            <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1 flex items-center gap-1">
              ⭐ Популярные
            </p>
            {popularFiltered.map((city) => (
              <CityRow
                key={city}
                city={city}
                selected={selected === city}
                onSelect={setSelected}
              />
            ))}
            <div className="border-t border-border my-3" />
          </>
        )}

        {filtered.map((city) => (
          <CityRow
            key={city}
            city={city}
            selected={selected === city}
            onSelect={setSelected}
          />
        ))}

        {filtered.length === 0 && (
          <p className="text-center text-text-muted py-8 text-sm">Город не найден</p>
        )}

        {/* Отступ снизу */}
        <div className="h-28" />
      </div>

      {/* CTA */}
      <div className="fixed bottom-0 left-0 right-0 px-5 pb-[calc(16px+env(safe-area-inset-bottom,0px))] pt-3 bg-gradient-to-t from-bg via-bg to-transparent">
        <button
          disabled={!selected || saving}
          onClick={handleContinue}
          className={`
            w-full h-14 rounded-btn text-[16px] font-semibold text-white
            flex items-center justify-center gap-2
            transition-opacity
            ${selected && !saving ? 'bg-primary' : 'bg-primary opacity-40 cursor-not-allowed'}
          `}
        >
          {saving ? (
            <Spinner />
          ) : (
            <>
              <MapPin className="w-4 h-4" />
              Продолжить
            </>
          )}
        </button>
      </div>
    </div>
  )
}

function CityRow({
  city,
  selected,
  onSelect,
}: {
  city: string
  selected: boolean
  onSelect: (c: string) => void
}) {
  return (
    <button
      onClick={() => onSelect(city)}
      className="
        w-full flex items-center justify-between
        h-14 border-b border-border last:border-0
        text-[16px] text-text-main text-left
        active:bg-bg/50
      "
    >
      {city}
      {selected && (
        <svg className="w-5 h-5 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      )}
    </button>
  )
}

function Spinner() {
  return (
    <svg className="animate-spin w-5 h-5 text-white" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  )
}
