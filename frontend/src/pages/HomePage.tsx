import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Settings } from 'lucide-react'
import { FAB } from '@/components/ui/FAB'
import { ProductCard } from '@/components/ProductCard'
import { AddProductSheet } from './sheets/AddProductSheet'
import { SetTargetSheet } from './sheets/SetTargetSheet'
import { ProductDetailSheet } from './sheets/ProductDetailSheet'
import type { Tracking, User, ProductLookup } from '@/types'

const FREE_LIMIT = 10

interface Props {
  user: User
  trackings: Tracking[]
  onTrackingAdded: (t: Tracking) => void
  onTrackingDeleted: (id: string) => void
  onTrackingUpdated: (t: Tracking) => void
}

export function HomePage({ user, trackings, onTrackingAdded, onTrackingDeleted, onTrackingUpdated }: Props) {
  const navigate = useNavigate()
  const [addOpen, setAddOpen] = useState(false)
  const [lookup, setLookup] = useState<ProductLookup | null>(null)
  const [setTargetOpen, setSetTargetOpen] = useState(false)
  const [detailTracking, setDetailTracking] = useState<Tracking | null>(null)

  const activeTrackings = useMemo(
    () => trackings.filter((t) => t.status !== 'frozen'),
    [trackings]
  )
  const frozenTrackings = useMemo(
    () => trackings.filter((t) => t.status === 'frozen'),
    [trackings]
  )

  const activeCount = activeTrackings.length
  const frozenCount = frozenTrackings.length
  const atLimit = user.plan === 'free' && activeCount >= FREE_LIMIT
  const showProBanner = user.plan === 'free' && activeCount >= FREE_LIMIT * 0.6
  const proExpired = frozenCount > 0 && user.plan === 'free'

  const handleLookupSuccess = useCallback((result: ProductLookup) => {
    setLookup(result)
    setAddOpen(false)
    setSetTargetOpen(true)
  }, [])

  const handleTargetSuccess = useCallback((tracking: Tracking) => {
    onTrackingAdded(tracking)
    setSetTargetOpen(false)
    setLookup(null)
  }, [onTrackingAdded])

  return (
    <div className="flex flex-col h-full bg-bg">
      {/* Шапка */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div>
          <h1 className="text-[18px] font-bold text-text-main">PricePulse</h1>
          <button
            onClick={() => navigate('/settings')}
            className="flex items-center gap-1 mt-1"
          >
            <span className="text-[12px] text-text-muted bg-surface border border-border px-2 py-0.5 rounded-full">
              📍 {user.region}
            </span>
          </button>
        </div>
        <button
          onClick={() => navigate('/settings')}
          className="w-9 h-9 rounded-full bg-surface border border-border flex items-center justify-center"
        >
          <Settings className="w-4 h-4 text-text-muted" />
        </button>
      </div>

      {/* Баннер истечения PRO */}
      {proExpired && (
        <div className="mx-4 mb-3 rounded-card p-3.5 bg-gradient-to-r from-danger to-[#e17055]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-semibold text-white">
                ❄ Подписка истекла — {frozenCount} {plural(frozenCount, 'товар', 'товара', 'товаров')} заморожено
              </p>
              <p className="text-[11px] text-white/80 mt-0.5">
                Продли PRO чтобы возобновить слежку за всеми товарами
              </p>
            </div>
            <button
              onClick={() => navigate('/pro')}
              className="ml-3 px-2.5 py-1.5 border border-white/40 rounded-full text-[11px] text-white font-medium whitespace-nowrap"
            >
              Продлить →
            </button>
          </div>
        </div>
      )}

      {/* PRO-баннер для бесплатных */}
      {showProBanner && !proExpired && (
        <div className="mx-4 mb-3 rounded-card px-4 py-3 bg-gradient-to-r from-primary to-primary-light flex items-center justify-between">
          <div>
            <p className="text-[13px] font-bold text-white">⚡ PRO — до 50 товаров</p>
            <p className="text-[11px] text-white/80">
              Сейчас: {activeCount} / {FREE_LIMIT} бесплатных
            </p>
          </div>
          <button
            onClick={() => navigate('/pro')}
            className="px-3 py-1.5 bg-white/20 rounded-full text-[10px] text-white font-semibold whitespace-nowrap"
          >
            100 ₽/мес →
          </button>
        </div>
      )}

      {/* Список товаров */}
      <div className="flex-1 overflow-y-auto scrollbar-none px-4 pb-28">
        {trackings.length === 0 ? (
          <EmptyState onAdd={() => setAddOpen(true)} />
        ) : (
          <>
            {activeTrackings.length > 0 && (
              <>
                <p className="text-[13px] font-semibold text-text-muted uppercase tracking-wider mb-3 mt-2">
                  Отслеживаю {proExpired ? `(${activeTrackings.length})` : ''}
                </p>
                <div className="flex flex-col gap-3">
                  {activeTrackings.map((t) => (
                    <ProductCard key={t.id} tracking={t} onClick={() => setDetailTracking(t)} />
                  ))}
                </div>
              </>
            )}

            {frozenTrackings.length > 0 && (
              <>
                <p className="text-[13px] font-semibold text-text-muted uppercase tracking-wider mb-3 mt-5">
                  Заморожено ({frozenTrackings.length})
                </p>
                <div className="flex flex-col gap-3">
                  {frozenTrackings.map((t) => (
                    <ProductCard key={t.id} tracking={t} onClick={() => navigate('/pro')} />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* FAB */}
      <FAB onClick={() => setAddOpen(true)} />

      {/* Шторки */}
      <AddProductSheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onNext={handleLookupSuccess}
        atLimit={atLimit}
        onUpgradePro={() => { setAddOpen(false); navigate('/pro') }}
      />

      <SetTargetSheet
        open={setTargetOpen}
        lookup={lookup}
        onClose={() => { setSetTargetOpen(false); setLookup(null) }}
        onBack={() => { setSetTargetOpen(false); setAddOpen(true) }}
        onSuccess={handleTargetSuccess}
      />

      <ProductDetailSheet
        tracking={detailTracking}
        onClose={() => setDetailTracking(null)}
        onDeleted={onTrackingDeleted}
        onUpdated={(t) => { setDetailTracking(t); onTrackingUpdated(t) }}
      />
    </div>
  )
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="text-6xl mb-5">🛍️</div>
      <h2 className="text-[18px] font-semibold text-text-main mb-2">Пока ничего не слежу</h2>
      <p className="text-[14px] text-text-muted leading-relaxed max-w-[280px] mb-8">
        Добавь первый товар — вставь ссылку с WB или Ozon и укажи желаемую цену
      </p>
      <button
        onClick={onAdd}
        className="flex items-center gap-2 px-6 h-[52px] rounded-btn bg-primary text-white text-[15px] font-semibold"
      >
        <span className="text-xl font-light">+</span>
        Добавить товар
      </button>
      <p className="text-[12px] text-text-muted mt-6">Бесплатно до 10 товаров</p>
    </div>
  )
}

function plural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod100 >= 11 && mod100 <= 14) return many
  if (mod10 === 1) return one
  if (mod10 >= 2 && mod10 <= 4) return few
  return many
}
