import { useState, useEffect } from 'react'
import { X, ExternalLink, Pencil, Trash2, Check } from 'lucide-react'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { PlatformBadge } from '@/components/ui/PlatformBadge'
import { api } from '@/lib/api'
import { formatPrice, formatTimeAgo } from '@/lib/format'
import type { Tracking } from '@/types'

interface Props {
  tracking: Tracking | null
  onClose: () => void
  onDeleted: (id: string) => void
  onUpdated: (t: Tracking) => void
}

export function ProductDetailSheet({ tracking, onClose, onDeleted, onUpdated }: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [editingTarget, setEditingTarget] = useState(false)
  const [editValue, setEditValue] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)

  // Сброс всего локального состояния при смене или закрытии карточки
  useEffect(() => {
    setConfirmDelete(false)
    setDeleting(false)
    setEditingTarget(false)
    setEditValue('')
    setSavingEdit(false)
  }, [tracking?.id])

  if (!tracking) return null

  const { product, target_price, target_percent, sellers = [] } = tracking
  const current = product.current_min_price ?? 0
  const target = target_price ?? (target_percent != null ? Math.round(current * (1 - target_percent / 100)) : null)

  const progress =
    current > 0 && target != null
      ? Math.max(0, Math.min(100, Math.round(((current - target) / (current * 0.5)) * 100)))
      : 50

  const diff =
    current > 0 && target != null
      ? {
          amount: current - target,
          pct: Math.round(((current - target) / current) * 100),
        }
      : null

  async function handleDelete() {
    setDeleting(true)
    try {
      await api.deleteTracking(tracking!.id)
      onDeleted(tracking!.id)
      onClose()
    } catch {
      setDeleting(false)
    }
  }

  function startEditTarget() {
    const currentTarget = tracking!.target_price ?? null
    setEditValue(currentTarget != null ? String(currentTarget) : '')
    setEditingTarget(true)
  }

  async function handleSaveTarget() {
    const newPrice = Number(editValue)
    if (!newPrice || newPrice <= 0) return
    setSavingEdit(true)
    try {
      const updated = await api.updateTracking(tracking!.id, { target_price: newPrice, target_percent: null })
      setEditingTarget(false)
      onUpdated(updated)
    } catch {
      // оставляем форму открытой
    } finally {
      setSavingEdit(false)
    }
  }

  return (
    <BottomSheet open={!!tracking} onClose={onClose} heightClass="max-h-[90vh]">
      <div className="pb-8">
        {/* Шапка */}
        <div className="flex items-center justify-between px-5 py-2">
          <PlatformBadge platform={product.platform} />
          <button onClick={onClose} className="p-1 text-text-muted">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Изображение */}
        <div className="mx-5 mb-4">
          <img
            src={product.image_url}
            alt={product.title}
            className="w-full h-48 rounded-card object-contain bg-bg"
            onError={(e) => {
              ;(e.target as HTMLImageElement).src = `https://placehold.co/390x200/F5F4FF/6C5CE7?text=${product.platform.toUpperCase()}`
            }}
          />
        </div>

        {/* Название */}
        <div className="px-5 mb-4">
          <h2 className="text-[16px] font-medium text-text-main leading-snug">{product.title}</h2>
          <p className="text-[12px] text-text-muted mt-1">Артикул: {product.sku}</p>
        </div>

        {/* Блок цена vs цель */}
        <div className="mx-5 mb-4 border border-border rounded-card px-4 py-3.5">
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-[13px] text-text-muted">Лучшая цена сейчас</span>
            <span className="text-[22px] font-semibold text-text-main tabular-nums">
              {current > 0 ? formatPrice(current) : '—'}
            </span>
          </div>
          <div className="flex items-baseline justify-between mb-3">
            <span className="text-[13px] text-text-muted">Ваша цель</span>
            <span className="text-[16px] font-semibold text-primary tabular-nums">
              {target != null ? formatPrice(target) : '—'}
            </span>
          </div>

          {/* Прогресс-бар */}
          {target != null && current > 0 && (
            <>
              <div className="h-2 bg-border rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${100 - progress}%`,
                    background: progress < 30
                      ? '#00B894'
                      : progress < 70
                      ? '#6C5CE7'
                      : '#D63031',
                  }}
                />
              </div>
              {diff && (
                <p className="text-[12px] text-text-muted text-center mt-2">
                  {diff.amount > 0 ? `До цели: −${formatPrice(diff.amount)} (−${diff.pct}%)` : '✓ Цель достигнута!'}
                </p>
              )}
            </>
          )}
        </div>

        {/* Продавцы */}
        {sellers.length > 0 && (
          <div className="px-5 mb-4">
            <h3 className="text-[14px] font-semibold text-text-main mb-2">Продавцы</h3>
            <div className="border border-border rounded-card overflow-hidden">
              {sellers
                .slice()
                .sort((a, b) => a.price - b.price)
                .map((seller, i) => (
                  <div
                    key={seller.id}
                    className={`flex items-center justify-between px-4 py-3 ${i < sellers.length - 1 ? 'border-b border-border' : ''}`}
                  >
                    <div>
                      <p className="text-[13px] text-text-main">{seller.seller_name}</p>
                      {i === 0 && (
                        <span className="text-[10px] text-success font-medium">Лучшая цена</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[14px] font-semibold text-text-main tabular-nums">
                        {formatPrice(seller.price)}
                      </span>
                      <a
                        href={seller.offer_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[12px] font-medium text-primary flex items-center gap-0.5"
                      >
                        Купить
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Действия */}
        <div className="px-5 flex flex-col gap-2">
          {editingTarget ? (
            <div className="border border-primary/30 rounded-card p-3 bg-primary/5">
              <p className="text-[13px] text-text-main mb-2">Новая целевая цена</p>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  placeholder="Введи сумму"
                  className="flex-1 h-10 px-3 border border-border rounded-btn text-[14px] tabular-nums focus:outline-none focus:border-primary"
                  autoFocus
                />
                <span className="flex items-center text-text-muted text-[14px]">₽</span>
                <button
                  onClick={handleSaveTarget}
                  disabled={savingEdit || !editValue || Number(editValue) <= 0}
                  className="h-10 px-3 rounded-btn bg-primary text-white text-[13px] font-semibold disabled:opacity-50 flex items-center gap-1"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setEditingTarget(false)}
                  className="h-10 px-3 rounded-btn border border-border text-[13px] text-text-muted"
                >
                  ✕
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={startEditTarget}
              className="flex items-center gap-2 text-[13px] font-medium text-primary py-2"
            >
              <Pencil className="w-4 h-4" />
              Изменить цель
            </button>
          )}

          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-2 text-[13px] font-medium text-danger py-2"
            >
              <Trash2 className="w-4 h-4" />
              Удалить из слежки
            </button>
          ) : (
            <div className="border border-danger/20 rounded-card p-3 bg-danger/5">
              <p className="text-[13px] text-text-main mb-3">Удалить товар из отслеживания?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 h-10 rounded-btn border border-border text-[13px] text-text-muted"
                >
                  Отмена
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 h-10 rounded-btn bg-danger text-white text-[13px] font-semibold disabled:opacity-60"
                >
                  {deleting ? 'Удаляю...' : 'Удалить'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Время проверки */}
        <p className="px-5 text-[12px] text-text-muted mt-4">
          Последняя проверка: {formatTimeAgo(product.last_checked_at)}
        </p>
      </div>
    </BottomSheet>
  )
}
