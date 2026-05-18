export type Platform = 'wb' | 'ozon'
export type TrackingStatus = 'active' | 'frozen' | 'out_of_stock' | 'target_reached'
export type Plan = 'free' | 'pro'

export interface User {
  telegram_user_id: number
  region: string
  plan: Plan
  subscription_until: string | null
  auto_renew: boolean
}

export interface Seller {
  id: string
  seller_name: string
  price: number
  offer_url: string
}

export interface Product {
  id: string
  sku: string
  platform: Platform
  title: string
  image_url: string | null
  url: string
  current_min_price: number | null
  in_stock: boolean
  last_checked_at: string | null
}

export interface Tracking {
  id: string
  product: Product
  target_price: number | null
  target_percent: number | null
  status: TrackingStatus
  created_at: string
  sellers: Seller[]
}

export interface ProductLookup {
  product: Product
  sellers: Seller[]
}
