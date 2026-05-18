import { useState, useRef } from 'react'
import { X, ClipboardPaste, AlertCircle, CheckCircle } from 'lucide-react'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Skeleton } from '@/components/ui/Skeleton'
import { PlatformBadge } from '@/components/ui/PlatformBadge'
import { api } from '@/lib/api'
import { formatPrice } from '@/lib/format'
import type { ProductLookup } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
  onNext: (lookup: ProductLookup) => void
  atLimit: boolean
  onUpgradePro: () => void
}

export function AddProductSheet({ open, onClose, onNext, atLimit, onUpgradePro }: Props) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<ProductLookup | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  async function handlePaste() {
    try {
      const text = await navigator.clipboard.readText()
      setUrl(text)
      await lookup(text)
    } catch {
      setError('Не удалось прочитать буфер обмена')
    }
  }

  async function lookup(rawUrl: string) {
    const trimmed = rawUrl.trim()
    if (!trimmed) return
    setLoading(true)
    setError(null)
    setPreview(null)
    try {
      const result = await api.lookupProduct(trimmed)
      setPreview(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось найти товар. Проверь ссылку.')
    } finally {
      setLoading(false)
    }
  }

  function handleUrlChange(val: string) {
    setUrl(val)
    setError(null)
    setPreview(null)

    // Дебаунс: ждём 600мс после последнего нажатия перед запросом
    if (debounceRef.current) clearTimeout(debounceRef.current)

    const isMarketplaceUrl = val.includes('wildberries.ru') || val.includes('ozon.ru')
    if (!isMarketplaceUrl) return

    debounceRef.current = setTimeout(() => {
      void lookup(val)
    }, 600)
  }

  function handleClose() {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setUrl('')
    setError(null)
    setPreview(null)
    setLoading(false)
    onClose()
  }

  if (atLimit) {
    return (
      <BottomSheet open={open} onClose={handleClose} heightClass="max-h-[60vh]">
        <LimitReached onUpgrade={onUpgradePro} onDeleteOld={handleClose} />
      </BottomSheet>
    )
  }

  return (
    <BottomSheet open={open} onClose={handleClose} heightClass="max-h-[80vh]">
      <div className="px-5 pb-6">
        {/* Заголовок */}
        <div className="flex items-center justify-between mb-1 pt-1">
          <h2 className="text-[18px] font-bold text-text-main">Добавить товар</h2>
          <button onClick={handleClose} className="p-1 text-text-muted">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-[12px] text-text-muted mb-5">Шаг 1 из 2</p>

        {/* Индикатор шагов */}
        <div className="flex items-center gap-2 mb-6">
          <div className="w-4 h-4 rounded-full bg-primary" />
          <div className="flex-1 h-0.5 bg-border" />
          <div className="w-3 h-3 rounded-full border-2 border-border" />
        </div>

        {/* Поле ввода */}
        <label className="block text-[13px] font-semibold text-text-main mb-2">
          Ссылка или артикул
        </label>
        <div className={`relative flex items-center rounded-btn border bg-bg transition-colors ${error ? 'border-danger' : url && preview ? 'border-success' : 'border-border focus-within:border-primary'}`}>
          <input
            type="url"
            value={url}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="https://www.wildberries.ru/catalog/..."
            className="flex-1 h-14 pl-4 pr-2 bg-transparent text-[14px] text-text-main placeholder:text-text-muted focus:outline-none"
          />
          <button
            onClick={handlePaste}
            className="flex items-center gap-1 px-3 text-[13px] font-medium text-primary whitespace-nowrap"
          >
            <ClipboardPaste className="w-4 h-4" />
            Вставить
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 mt-2 text-danger text-[12px]">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <p className="text-[12px] text-text-muted mt-2">Поддерживаем WB и Ozon</p>

        {/* Предпросмотр */}
        {loading && <PreviewSkeleton />}
        {preview && !loading && <PreviewCard lookup={preview} />}

        {/* CTA */}
        <div className="mt-8">
          <button
            disabled={!preview || loading}
            onClick={() => preview && onNext(preview)}
            className={`
              w-full h-[52px] rounded-btn text-[15px] font-semibold text-white
              flex items-center justify-center gap-2 transition-opacity
              ${preview && !loading ? 'bg-primary' : 'bg-primary opacity-40 cursor-not-allowed'}
            `}
          >
            Далее →
          </button>
        </div>
      </div>
    </BottomSheet>
  )
}

function PreviewSkeleton() {
  return (
    <div className="mt-5 border border-border rounded-btn p-3 flex gap-3 items-center">
      <Skeleton className="w-12 h-12 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-3/4" />
        <Skeleton className="h-4 w-1/3" />
      </div>
    </div>
  )
}

function PreviewCard({ lookup }: { lookup: ProductLookup }) {
  const { product } = lookup
  return (
    <div className="mt-5 border border-border rounded-btn p-3 flex gap-3 items-center bg-surface">
      <div className="relative flex-shrink-0">
        <img
          src={product.image_url}
          alt={product.title}
          className="w-12 h-12 rounded-xl object-cover bg-bg"
          onError={(e) => {
            ;(e.target as HTMLImageElement).src = `https://placehold.co/48x48/F5F4FF/6C5CE7?text=${product.platform}`
          }}
        />
        <div className="absolute -top-1 -left-1">
          <PlatformBadge platform={product.platform} />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-medium text-text-main truncate">{product.title}</p>
        <p className="text-[16px] font-semibold text-text-main tabular-nums mt-0.5">
          {product.current_min_price != null ? formatPrice(product.current_min_price) : '—'}
        </p>
        <p className={`text-[12px] mt-0.5 ${product.in_stock ? 'text-success' : 'text-danger'}`}>
          {product.in_stock ? '● В наличии' : '✕ Нет в наличии'}
        </p>
      </div>
      <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
    </div>
  )
}

function LimitReached({ onUpgrade, onDeleteOld }: { onUpgrade: () => void; onDeleteOld: () => void }) {
  return (
    <div className="px-5 py-6 flex flex-col items-center text-center">
      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 text-3xl">
        🔒
      </div>
      <h2 className="text-[18px] font-bold text-text-main mb-2">Достигнут лимит 10 товаров</h2>
      <p className="text-[14px] text-text-muted leading-relaxed max-w-[280px] mb-6">
        Перейди на PRO — следи за 50 товарами всего за 100 ₽/месяц
      </p>
      <button
        onClick={onUpgrade}
        className="w-full h-12 rounded-btn bg-primary text-white text-[15px] font-semibold mb-3"
      >
        Перейти на PRO
      </button>
      <button onClick={onDeleteOld} className="text-[13px] text-text-muted">
        Удалить старый товар
      </button>
    </div>
  )
}
