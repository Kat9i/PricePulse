import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  heightClass?: string
}

export function BottomSheet({
  open,
  onClose,
  children,
  heightClass = 'max-h-[85vh]',
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40 animate-fade-in"
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className={`relative w-full bg-surface rounded-t-sheet shadow-sheet animate-slide-up overflow-hidden flex flex-col ${heightClass}`}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-9 h-1 bg-border rounded-full" />
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-none">{children}</div>
      </div>
    </div>,
    document.body
  )
}
