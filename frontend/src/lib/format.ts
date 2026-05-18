export function formatPrice(price: number): string {
  return price.toLocaleString('ru-RU') + ' ₽'
}

export function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return 'только что'
  if (minutes < 60) return `${minutes} мин назад`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} ч назад`
  return `${Math.floor(hours / 24)} дн назад`
}

export function calcDiscount(current: number, target: number): number {
  return Math.round(((current - target) / current) * 100)
}
