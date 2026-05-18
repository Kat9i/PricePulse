import type { User, Tracking, Product, Seller } from '@/types'
import { getInitData } from './telegram'

const BASE = import.meta.env.VITE_API_URL ?? '/api'

let jwtToken: string | null = null

async function req<T>(path: string, opts: RequestInit = {}): Promise<T> {
  if (!jwtToken) {
    jwtToken = await authenticate()
  }
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwtToken}`,
      ...(opts.headers ?? {}),
    },
  })
  if (res.status === 401) {
    jwtToken = null
    throw new Error('Сессия истекла, попробуй снова')
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as { detail?: string }).detail ?? 'Ошибка сервера')
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

async function authenticate(): Promise<string> {
  const initData = getInitData()
  const res = await fetch(`${BASE}/auth/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ init_data: initData }),
  })
  if (!res.ok) throw new Error('Ошибка авторизации Telegram')
  const data = (await res.json()) as { token: string }
  return data.token
}

// Аутентификация с возвратом is_new — для определения первого входа
export async function bootstrapAuth(): Promise<{ user: User; is_new: boolean }> {
  const initData = getInitData()
  const res = await fetch(`${BASE}/auth/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ init_data: initData }),
  })
  if (!res.ok) throw new Error('Ошибка авторизации Telegram')
  const data = (await res.json()) as { token: string; user: User; is_new: boolean }
  jwtToken = data.token
  return { user: data.user, is_new: data.is_new }
}

export const api = {
  getMe: () => req<User>('/user/me'),

  updateMe: (data: Partial<Pick<User, 'region' | 'auto_renew'>>) =>
    req<User>('/user/me', { method: 'PATCH', body: JSON.stringify(data) }),

  getTrackings: () => req<Tracking[]>('/trackings'),

  lookupProduct: (url: string) =>
    req<{ product: Product; sellers: Seller[] }>(
      `/trackings/lookup?url=${encodeURIComponent(url)}`
    ),

  addTracking: (body: {
    url?: string
    sku?: string
    platform: string
    target_price?: number
    target_percent?: number
  }) => req<Tracking>('/trackings', { method: 'POST', body: JSON.stringify(body) }),

  deleteTracking: (id: string) => req<void>(`/trackings/${id}`, { method: 'DELETE' }),

  updateTracking: (
    id: string,
    data: { target_price?: number | null; target_percent?: number | null }
  ) => req<Tracking>(`/trackings/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  createInvoice: () =>
    req<{ invoice_url: string }>('/payments/invoice', { method: 'POST' }),
}
