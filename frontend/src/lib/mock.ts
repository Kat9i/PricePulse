import type { Tracking, User } from '@/types'

export const MOCK_USER: User = {
  telegram_user_id: 123456789,
  region: 'Москва',
  plan: 'free',
  subscription_until: null,
  auto_renew: false,
}

export const MOCK_TRACKINGS: Tracking[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    product: {
      id: 'aaaa0000-0000-0000-0000-000000000001',
      sku: '148293847',
      platform: 'wb',
      title: 'Кроссовки Nike Air Max 270, белые',
      image_url: 'https://placehold.co/128x128/F5F4FF/6C5CE7?text=👟',
      url: 'https://www.wildberries.ru/catalog/148293847/detail.aspx',
      current_min_price: 4890,
      in_stock: true,
      last_checked_at: new Date(Date.now() - 15 * 60_000).toISOString(),
    },
    target_price: 4500,
    target_percent: null,
    status: 'active',
    created_at: new Date().toISOString(),
    sellers: [
      { id: 'bbbb0001-0000-0000-0000-000000000001', seller_name: 'Fashion Store', price: 4890, offer_url: '#' },
      { id: 'bbbb0001-0000-0000-0000-000000000002', seller_name: 'NikeOfficial', price: 5100, offer_url: '#' },
      { id: 'bbbb0001-0000-0000-0000-000000000003', seller_name: 'SportShop', price: 5490, offer_url: '#' },
    ],
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    product: {
      id: 'aaaa0000-0000-0000-0000-000000000002',
      sku: '82901234',
      platform: 'ozon',
      title: 'Термос Stanley Classic 1L, серый',
      image_url: 'https://placehold.co/128x128/F5F4FF/636E72?text=🧴',
      url: 'https://www.ozon.ru/product/82901234/',
      current_min_price: 3200,
      in_stock: true,
      last_checked_at: new Date(Date.now() - 60 * 60_000).toISOString(),
    },
    target_price: 2800,
    target_percent: null,
    status: 'active',
    created_at: new Date().toISOString(),
    sellers: [
      { id: 'cccc0001-0000-0000-0000-000000000001', seller_name: 'Stanley Store', price: 3200, offer_url: '#' },
    ],
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    product: {
      id: 'aaaa0000-0000-0000-0000-000000000003',
      sku: '56712398',
      platform: 'wb',
      title: 'Платье Zara льняное, размер M',
      image_url: 'https://placehold.co/128x128/F5F4FF/D63031?text=👗',
      url: 'https://www.wildberries.ru/catalog/56712398/detail.aspx',
      current_min_price: null,
      in_stock: false,
      last_checked_at: new Date(Date.now() - 2 * 60 * 60_000).toISOString(),
    },
    target_price: 2500,
    target_percent: null,
    status: 'out_of_stock',
    created_at: new Date().toISOString(),
    sellers: [],
  },
]
