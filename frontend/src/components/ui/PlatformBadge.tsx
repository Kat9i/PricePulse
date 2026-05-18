import type { Platform } from '@/types'

interface PlatformBadgeProps {
  platform: Platform
  className?: string
}

export function PlatformBadge({ platform, className = '' }: PlatformBadgeProps) {
  const isWb = platform === 'wb'
  return (
    <span
      className={`
        inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold text-white leading-none
        ${isWb ? 'bg-wb' : 'bg-ozon'}
        ${className}
      `}
    >
      {isWb ? 'WB' : 'Ozon'}
    </span>
  )
}
