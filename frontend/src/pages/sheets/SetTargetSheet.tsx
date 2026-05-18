import { useState } from 'react'
import { ArrowLeft, X, CheckCircle } from 'lucide-react'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { PlatformBadge } from '@/components/ui/PlatformBadge'
import { api } from '@/lib/api'
import { formatPrice } from '@/lib/format'
import type { ProductLookup, Tracking } from '@/types'

const QUICK_PERCENTS = [5, 10, 15, 20, 30]

type Mode = 'price' | 'percent'

interface Props {
  open: boolean
  lookup: ProductLookup | null
  onClose: () => void
  onBack: () => void
  onSuccess: (tracking: Tracking) => void
}

export function SetTargetSheet({ open, lookup, onClose, onBack, onSuccess }: Props) {
  const [mode, setMode] = useState<Mode>('price')
  const [priceInput, setPriceInput] = useState('')
  const [percentInput, setPercentInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!lookup) return null

  const { product } = lookup
  const currentPrice = product.current_min_price ?? 0

  const targetPrice = mode === 'price' ? Number(priceInput.replace(/\s/g, '')) : null
  const targetPercent = mode === 'percent' ? Number(percentInput) : null

  const calcedFromPercent =
    mode === 'percent' && percentInput
      ? Math.round(currentPrice * (1 - Number(percentInput) / 100))
      : null

  const discount =
    mode === 'price' && targetPrice && currentPrice > 0
      ? Math.round(((currentPrice - targetPrice) / currentPrice) * 100)
      : null

  const isValid =
    mode === 'price'
      ? targetPrice != null && targetPrice > 0 && targetPrice < currentPrice
      : targetPercent != null && targetPercent > 0 && targetPercent < 100

  async function handleSubmit() {
    if (!isValid) return
    setLoading(true)
    setError(null)
    try {
      const tracking = await api.addTracking({
        url: product.url,
        platform: product.platform,
        target_price: mode === 'price' ? targetPrice ?? undefined : undefined,
        target_percent: mode === 'percent' ? targetPercent ?? undefined : undefined,
      })
      setSuccess(true)
      setTimeout(() => {
        onSuccess(tracking)
        resetAndClose()
      }, 1200)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка при добавлении')
    } finally {
      setLoading(false)
    }
  }

  function resetAndClose() {
    setPriceInput('')
    setPercentInput('')
    setMode('price')
    setSuccess(false)
    setError(null)
    onClose()
  }

  if (success) {
    return (
      <BottomSheet open={open} onClose={resetAndClose} heightClass="max-h-[50vh]">
        <div className="flex flex-col items-center justify-center px-5 py-12 text-center">
          <CheckCircle className="w-16 h-16 text-success mb-4" />
          <h2 className="text-[20px] font-bold text-success mb-2">Товар добавлен!</h2>
          <p className="text-[14px] text-text-muted">Буду проверять цены каждые 2 часа</p>
        </div>
      </BottomSheet>
    )
  }

  return (
    <BottomSheet open={open} onClose={resetAndClose} heightClass="max-h-[90vh]">
      <div className="px-5 pb-8">
        {/* Заголовок */}
        <div className="flex items-center justify-between pt-1 mb-1">
          <button onClick={onBack} className="p-1 text-text-muted">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-[18px] font-bold text-text-main">Настроить цель</h2>
          <button onClick={resetAndClose} className="p-1 text-text-muted">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-[12px] text-text-muted text-center mb-5">Шаг 2 из 2</p>

        {/* Индикатор шагов */}
        <div className="flex items-center gap-2 mb-5">
          <div className="w-4 h-4 rounded-full bg-primary/40" />
          <div className="flex-1 h-0.5 bg-primary" />
          <div className="w-4 h-4 rounded-full bg-primary" />
        </div>

        {/* Компактная карточка товара */}
        <div className="flex items-center gap-3 border border-border rounded-btn px-3 py-2.5 mb-5 bg-surface">
          <div className="relative flex-shrink-0">
            <img
              src={product.image_url}
              alt={product.title}
              className="w-10 h-10 rounded-lg object-cover bg-bg"
              onError={(e) => { ;(e.target as HTMLImageElement).src = `https://placehold.co/40x40/F5F4FF/6C5CE7?text=${product.platform}` }}
            />
            <div className="absolute -top-1 -left-1">
              <PlatformBadge platform={product.platform} />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium text-text-main truncate">{product.title}</p>
            <p className="text-[12px] text-text-muted">
              Сейчас: <span className="tabular-nums">{currentPrice > 0 ? formatPrice(currentPrice) : '—'}</span>
            </p>
          </div>
        </div>

        {/* Переключатель режима */}
        <p className="text-[13px] text-text-muted mb-2">Хочу получить уведомление когда:</p>
        <div className="flex gap-2 mb-5">
          {(['price', 'percent'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 h-10 rounded-btn text-[14px] font-semibold transition-colors ${
                mode === m ? 'bg-primary text-white' : 'bg-bg text-text-muted border border-border'
              }`}
            >
              {m === 'price' ? 'По сумме' : 'По скидке %'}
            </button>
          ))}
        </div>

        {/* Поле ввода — по сумме */}
        {mode === 'price' && (
          <div>
            <label className="block text-[13px] font-semibold text-text-main mb-2">
              Целевая цена
            </label>
            <div className={`flex items-center border-2 rounded-btn px-4 h-16 bg-surface transition-colors ${priceInput ? 'border-primary' : 'border-border'}`}>
              <input
                type="number"
                value={priceInput}
                onChange={(e) => setPriceInput(e.target.value)}
                placeholder="4 500"
                className="flex-1 text-2xl font-semibold text-text-main tabular-nums bg-transparent focus:outline-none"
              />
              <span className="text-[16px] text-text-muted ml-2">₽</span>
            </div>
            {priceInput && (
              <div className="flex justify-between mt-2 text-[12px]">
                <span className="text-text-muted">
                  Текущая: <span className="tabular-nums">{formatPrice(currentPrice)}</span>
                </span>
                {discount != null && discount > 0 && (
                  <span className="text-success font-medium">Скидка: −{discount}%</span>
                )}
                {discount != null && discount <= 0 && (
                  <span className="text-danger font-medium">Должна быть ниже текущей</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Поле ввода — по проценту */}
        {mode === 'percent' && (
          <div>
            <label className="block text-[13px] font-semibold text-text-main mb-2">
              Снижение от текущей цены
            </label>
            <div className={`flex items-center border-2 rounded-btn px-4 h-16 bg-surface transition-colors ${percentInput ? 'border-primary' : 'border-border'}`}>
              <input
                type="number"
                value={percentInput}
                onChange={(e) => setPercentInput(e.target.value)}
                placeholder="20"
                min="1"
                max="99"
                className="flex-1 text-2xl font-semibold text-text-main tabular-nums bg-transparent focus:outline-none"
              />
              <span className="text-[16px] text-text-muted ml-2">%</span>
            </div>

            {/* Быстрый выбор */}
            <div className="flex gap-2 mt-3">
              {QUICK_PERCENTS.map((p) => (
                <button
                  key={p}
                  onClick={() => setPercentInput(String(p))}
                  className={`flex-1 h-8 rounded-btn text-[12px] font-medium border transition-colors ${
                    percentInput === String(p)
                      ? 'bg-primary text-white border-primary'
                      : 'border-border text-text-muted bg-surface'
                  }`}
                >
                  −{p}%
                </button>
              ))}
            </div>

            {calcedFromPercent != null && (
              <p className="text-[12px] text-text-muted mt-2">
                Уведомлю при цене ниже{' '}
                <span className="tabular-nums font-medium text-text-main">
                  {formatPrice(calcedFromPercent)}
                </span>
              </p>
            )}
          </div>
        )}

        {error && (
          <p className="mt-3 text-[12px] text-danger">{error}</p>
        )}

        {/* CTA */}
        <div className="mt-8">
          <button
            disabled={!isValid || loading}
            onClick={handleSubmit}
            className={`
              w-full h-[52px] rounded-btn text-[15px] font-semibold text-white
              flex items-center justify-center gap-2 transition-opacity
              ${isValid && !loading ? 'bg-primary' : 'bg-primary opacity-40 cursor-not-allowed'}
            `}
          >
            {loading ? <Spinner /> : 'Начать слежку'}
          </button>
        </div>
      </div>
    </BottomSheet>
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
