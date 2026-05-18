export interface TgUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
}

function getWebApp() {
  return (window as Window & { Telegram?: { WebApp: { initData: string; initDataUnsafe: { user?: TgUser }; ready: () => void; expand: () => void } } }).Telegram?.WebApp
}

export function initTelegram() {
  const tg = getWebApp()
  if (tg) {
    tg.ready()
    tg.expand()
  }
}

export function getTelegramUser(): TgUser | null {
  return getWebApp()?.initDataUnsafe?.user ?? null
}

export function getInitData(): string {
  return getWebApp()?.initData ?? ''
}

export function isInTelegram(): boolean {
  return !!getWebApp()
}
