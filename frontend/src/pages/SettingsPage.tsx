import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronRight, MapPin, Bell, Package, MessageCircle, Star } from 'lucide-react'
import { Toggle } from '@/components/ui/Toggle'
import { OnboardingPage } from './OnboardingPage'
import { api } from '@/lib/api'
import type { User } from '@/types'

const FREE_LIMIT = 10

interface Props {
  user: User
  onUserUpdate: (u: User) => void
  trackingCount: number
}

export function SettingsPage({ user, onUserUpdate, trackingCount }: Props) {
  const navigate = useNavigate()
  const [changingRegion, setChangingRegion] = useState(false)
  const [autoRenew, setAutoRenew] = useState(user.auto_renew)
  const [savingAutoRenew, setSavingAutoRenew] = useState(false)
  const [notifyPrice, setNotifyPrice] = useState(true)
  const [notifyStock, setNotifyStock] = useState(true)

  async function handleAutoRenewToggle(val: boolean) {
    setAutoRenew(val)
    setSavingAutoRenew(true)
    try {
      const updated = await api.updateMe({ auto_renew: val })
      onUserUpdate(updated)
    } catch {
      setAutoRenew(!val)
    } finally {
      setSavingAutoRenew(false)
    }
  }

  if (changingRegion) {
    return (
      <OnboardingPage
        onComplete={async (region) => {
          try {
            const updated = await api.updateMe({ region })
            onUserUpdate(updated)
          } catch {
            onUserUpdate({ ...user, region })
          }
          setChangingRegion(false)
        }}
      />
    )
  }

  const isPro = user.plan === 'pro'
  const subUntil = user.subscription_until
    ? new Date(user.subscription_until).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  return (
    <div className="flex flex-col h-full bg-bg">
      {/* Шапка */}
      <div className="flex items-center gap-3 px-5 pt-5 pb-4">
        <button onClick={() => navigate(-1)} className="p-1 text-text-muted">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-[18px] font-bold text-text-main">Настройки</h1>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-none px-4 pb-10 space-y-4">
        {/* Профиль */}
        <Card>
          <div className="flex items-center gap-3 p-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center flex-shrink-0">
              <span className="text-white text-lg font-bold">А</span>
            </div>
            <div>
              <p className="text-[16px] font-semibold text-text-main">Пользователь</p>
              <p className="text-[12px] text-text-muted">PricePulse</p>
            </div>
          </div>
        </Card>

        {/* Подписка */}
        <Card>
          <SectionLabel>Подписка</SectionLabel>

          {!isPro ? (
            <>
              <SettingsRow
                left={
                  <span className="text-[15px] text-text-main">🆓 Бесплатный план</span>
                }
                right={
                  <span className="text-[13px] text-text-muted tabular-nums">
                    {trackingCount} / {FREE_LIMIT} товаров
                  </span>
                }
              />
              <div className="mx-4 mb-4">
                <button
                  onClick={() => navigate('/pro')}
                  className="w-full rounded-btn px-4 py-3.5 bg-gradient-to-r from-primary to-primary-light flex items-center justify-between"
                >
                  <div className="text-left">
                    <p className="text-[14px] font-bold text-white">⚡ Перейти на PRO</p>
                    <p className="text-[11px] text-white/85">До 50 товаров · 100 ₽/мес</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-white" />
                </button>
              </div>
            </>
          ) : (
            <>
              <SettingsRow
                left={<span className="text-[15px] font-semibold text-primary">⚡ PRO активен</span>}
                right={null}
              />
              {subUntil && (
                <p className="px-4 text-[12px] text-text-muted pb-2">
                  Следующее списание: {subUntil}
                </p>
              )}
              <SettingsRow
                left={<span className="text-[15px] text-text-main">Автопродление</span>}
                right={
                  <Toggle
                    checked={autoRenew}
                    onChange={handleAutoRenewToggle}
                    disabled={savingAutoRenew}
                  />
                }
              />
            </>
          )}
        </Card>

        {/* Регион */}
        <Card>
          <SectionLabel>Регион</SectionLabel>
          <button
            onClick={() => setChangingRegion(true)}
            className="w-full"
          >
            <SettingsRow
              left={
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-text-muted" />
                  <span className="text-[15px] text-text-main">Регион доставки</span>
                </div>
              }
              right={
                <div className="flex items-center gap-1 text-primary">
                  <span className="text-[14px] font-medium">{user.region}</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              }
            />
          </button>
          <p className="px-4 text-[12px] text-text-muted pb-3">Влияет на цену товаров</p>
        </Card>

        {/* Уведомления */}
        <Card>
          <SectionLabel>Уведомления</SectionLabel>
          <SettingsRow
            left={
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-text-muted" />
                <span className="text-[15px] text-text-main">Уведомления о цене</span>
              </div>
            }
            right={<Toggle checked={notifyPrice} onChange={setNotifyPrice} />}
          />
          <SettingsRow
            left={
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-text-muted" />
                <span className="text-[15px] text-text-main">Товар не в наличии</span>
              </div>
            }
            right={<Toggle checked={notifyStock} onChange={setNotifyStock} />}
          />
        </Card>

        {/* Поддержка */}
        <Card>
          <SectionLabel>Поддержка</SectionLabel>
          <button className="w-full">
            <SettingsRow
              left={
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-text-muted" />
                  <span className="text-[15px] text-text-main">Написать в поддержку</span>
                </div>
              }
              right={<ChevronRight className="w-4 h-4 text-text-muted" />}
            />
          </button>
          <button className="w-full">
            <SettingsRow
              last
              left={
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-text-muted" />
                  <span className="text-[15px] text-text-main">Оценить приложение</span>
                </div>
              }
              right={<ChevronRight className="w-4 h-4 text-text-muted" />}
            />
          </button>
        </Card>

        <p className="text-center text-[11px] text-text-muted pt-2">PricePulse v1.0.0</p>
      </div>
    </div>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-surface rounded-card shadow-card overflow-hidden">{children}</div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-4 pt-4 pb-2 text-[11px] font-semibold text-text-muted uppercase tracking-wider">
      {children}
    </p>
  )
}

function SettingsRow({
  left,
  right,
  last = false,
}: {
  left: React.ReactNode
  right: React.ReactNode
  last?: boolean
}) {
  return (
    <div
      className={`flex items-center justify-between px-4 py-3.5 ${
        !last ? 'border-b border-border' : ''
      }`}
    >
      <div>{left}</div>
      {right !== null && <div>{right}</div>}
    </div>
  )
}
