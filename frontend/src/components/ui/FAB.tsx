interface FABProps {
  onClick: () => void
  label?: string
}

export function FAB({ onClick, label = 'Добавить товар' }: FABProps) {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      className="
        fixed bottom-[calc(24px+env(safe-area-inset-bottom,0px))] right-5
        w-14 h-14 rounded-full bg-primary shadow-fab
        flex items-center justify-center
        active:scale-95 transition-transform
        z-40
      "
    >
      <span className="text-white text-3xl font-light leading-none select-none">+</span>
    </button>
  )
}
