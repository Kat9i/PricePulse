import type { Tracking } from '@/types'
import { PlatformBadge } from './ui/PlatformBadge'
import { formatPrice, formatTimeAgo, calcDiscount } from '@/lib/format'

interface ProductCardProps {
  tracking: Tracking
  onClick: () => void
}

export function ProductCard({ tracking, onClick }: ProductCardProps) {
  const { product, target_price, target_percent, status } = tracking

  const badge = getBadge(status, product.current_min_price, target_price)
  const isFrozen = status === 'frozen'
  const isOutOfStock = status === 'out_of_stock'

  return (
    <button
      onClick={onClick}
      className={`
        w-full text-left bg-surface rounded-card shadow-card p-3
        flex gap-3 items-start active:opacity-80 transition-opacity
        ${isFrozen ? 'opacity-60' : ''}
        ${isFrozen ? 'border-2 border-dashed border-border' : ''}
      `}
    >
      {/* Миниатюра */}
      <div className="relative flex-shrink-0">
        <img
          src={product.image_url}
          alt={product.title}
          className={`w-16 h-16 rounded-xl object-cover bg-bg ${isOutOfStock ? 'grayscale opacity-60' : ''} ${isFrozen ? 'grayscale' : ''}`}
          onError={(e) => {
            ;(e.target as HTMLImageElement).src = `https://placehold.co/64x64/F5F4FF/6C5CE7?text=${product.platform.toUpperCase()}`
          }}
        />
        <div className="absolute top-1 left-1">
          <PlatformBadge platform={product.platform} />
        </div>
        {isFrozen && (
          <div className="absolute bottom-1 right-1 bg-primary/10 text-primary text-[9px] font-semibold px-1 rounded">
            ❄
          </div>
        )}
      </div>

      {/* Контент */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-main leading-snug line-clamp-2 mb-1">
          {product.title}
        </p>

        {isOutOfStock ? (
          <p className="text-xl font-semibold text-text-muted tabular-nums">—</p>
        ) : (
          <p className="text-xl font-semibold text-text-main tabular-nums">
            {product.current_min_price != null ? formatPrice(product.current_min_price) : '—'}
          </p>
        )}

        {(target_price != null || target_percent != null) && (
          <p className="text-xs text-text-muted mt-0.5">
            Цель:{' '}
            {target_price != null
              ? formatPrice(target_price)
              : `−${target_percent}%`}
          </p>
        )}

        <div className="flex items-center gap-2 mt-1.5">
          <StatusBadge badge={badge} status={status} />
          {!isOutOfStock && !isFrozen && (
            <span className="text-[11px] text-text-muted">
              {formatTimeAgo(product.last_checked_at)}
            </span>
          )}
          {isFrozen && (
            <span className="text-[11px] text-primary font-medium">Оформи PRO → разморозить</span>
          )}
        </div>
      </div>
    </button>
  )
}

interface Badge {
  label: string
  colorClass: string
}

function getBadge(
  status: Tracking['status'],
  current: number | null,
  target: number | null
): Badge {
  if (status === 'out_of_stock') {
    return { label: '✕ Нет в наличии', colorClass: 'bg-danger/10 text-danger' }
  }
  if (status === 'frozen') {
    return { label: '❄ Заморожен', colorClass: 'bg-border text-text-muted' }
  }
  if (status === 'target_reached') {
    return { label: '✓ Цель достигнута', colorClass: 'bg-success/10 text-success' }
  }
  // active
  if (current != null && target != null && current <= target) {
    const pct = calcDiscount(target, current)
    return { label: `↓ −${pct}% выгодно`, colorClass: 'bg-success/10 text-success' }
  }
  return { label: '● Отслеживается', colorClass: 'bg-border text-text-muted' }
}

function StatusBadge({ badge, status }: { badge: Badge; status: Tracking['status'] }) {
  const isTracking = status === 'active'
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-badge text-[11px] font-medium ${badge.colorClass}`}
    >
      {isTracking && badge.label.startsWith('●') && (
        <span className="w-1.5 h-1.5 rounded-full bg-text-muted animate-pulse-dot inline-block" />
      )}
      {badge.label.replace('● ', '')}
    </span>
  )
}
