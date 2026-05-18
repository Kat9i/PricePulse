import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Check, CheckCircle, AlertCircle } from 'lucide-react'
import { Toggle } from '@/components/ui/Toggle'
import { api } from '@/lib/api'
import type { User } from '@/types'

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        openInvoice: (url: string, callback: (status: string) => void) => void
      }
    }
  }
}

const FEATURES = [
  { label: 'Товаров', free: 'до 10', pro: 'до 50' },
  { label: 'Платформы', free: 'WB + Ozon', pro: 'WB + Ozon', both: true },
  { label: 'Все продавцы', free: true, pro: true, both: true },
  { label: 'Замороженные товары', free: false, pro: true },
]

interface Props {
  onUserUpdate?: (u: User) => void
}

export function ProPage({ onUserUpdate }: Props) {
  const navigate = useNavigate()
  const [autoRenew, setAutoRenew] = useState(true)
  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handlePay() {
    setPaying(true)
    setPayError(null)
    try {
      const { invoice_url } = await api.createInvoice()

      const tg = window.Telegram?.WebApp
      if (!tg) {
        // В браузере вне Telegram — показываем заглушку для тестирования
        await new Promise((r) => setTimeout(r, 800))
        setSuccess(true)
        setPaying(false)
        return
      }

      tg.openInvoice(invoice_url, async (status) => {
        setPaying(false)
        if (status === 'paid') {
          try {
            const updatedUser = await api.getMe()
            onUserUpdate?.(updatedUser)
          } catch {
            // Обновим при следующем открытии приложения
          }
          setSuccess(true)
        } else if (status === 'failed') {
          setPayError('Оплата не прошла. Попробуй ещё раз.')
        }
        // 'cancelled' — пользователь закрыл, ничего не делаем
      })
    } catch (e) {
      setPayError(e instanceof Error ? e.message : 'Ошибка при оплате')
      setPaying(false)
    }
  }

  if (success) {
    return (
      <div className="flex flex-col h-full bg-bg items-center justify-center px-5 text-center">
        <CheckCircle className="w-20 h-20 text-success mb-6" />
        <h2 className="text-[22px] font-bold text-success mb-2">PRO активирован! 🎉</h2>
        <p className="text-[14px] text-text-muted mb-8">Теперь можно добавить до 50 товаров</p>
        <button
          onClick={() => navigate('/home')}
          className="w-full h-[52px] rounded-btn bg-success text-white text-[15px] font-semibold"
        >
          Отлично →
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-bg">
      {/* Закрыть */}
      <div className="flex justify-end px-5 pt-5">
        <button onClick={() => navigate(-1)} className="p-1 text-text-muted">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-none px-4 pb-32">
        {/* Иконка + заголовок */}
        <div className="flex flex-col items-center mb-6">
          <div className="text-5xl mb-3">⚡</div>
          <h1 className="text-[24px] font-bold text-text-main">PricePulse PRO</h1>
          <p className="text-[14px] text-text-muted mt-1 text-center">
            Слежу за большим — плачу меньше
          </p>
        </div>

        {/* Таблица сравнения */}
        <div className="bg-surface rounded-card shadow-card overflow-hidden mb-5">
          <div className="flex border-b border-border">
            <div className="flex-1 px-4 py-3" />
            <div className="w-24 px-2 py-3 text-center">
              <span className="text-[12px] font-semibold text-text-muted">Бесплатно</span>
            </div>
            <div className="w-24 px-2 py-3 text-center bg-bg">
              <span className="text-[12px] font-semibold text-primary">PRO</span>
            </div>
          </div>

          {FEATURES.map((f, i) => (
            <div
              key={f.label}
              className={`flex items-center ${i < FEATURES.length - 1 ? 'border-b border-border' : ''}`}
            >
              <div className="flex-1 px-4 py-3.5">
                <span className="text-[14px] text-text-main">{f.label}</span>
              </div>
              <div className="w-24 px-2 py-3.5 text-center text-text-muted">
                <CellValue value={f.free} />
              </div>
              <div className="w-24 px-2 py-3.5 text-center bg-bg text-primary">
                <CellValue value={f.pro} isPro />
              </div>
            </div>
          ))}
        </div>

        {/* Цена */}
        <div className="text-center mb-5">
          <p className="text-[28px] font-bold text-text-main tabular-nums">100 ₽ / месяц</p>
          <p className="text-[12px] text-text-muted mt-1">
            Первый месяц — попробуй, отмени в любой момент
          </p>
        </div>

        {/* Автопродление */}
        <div className="bg-surface rounded-card shadow-card px-4 py-3.5 mb-2">
          <div className="flex items-center justify-between">
            <span className="text-[15px] text-text-main">Автопродление</span>
            <Toggle checked={autoRenew} onChange={setAutoRenew} />
          </div>
          <p className="text-[11px] text-text-muted mt-1">
            Отменить можно в настройках в любой момент
          </p>
        </div>
      </div>

      {/* Фиксированные кнопки снизу */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pb-[calc(16px+env(safe-area-inset-bottom,0px))] pt-3 bg-gradient-to-t from-bg via-bg to-transparent">
        {payError && (
          <div className="flex items-center gap-2 mb-3 px-1 text-danger text-[13px]">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {payError}
          </div>
        )}
        <button
          onClick={handlePay}
          disabled={paying}
          className="w-full h-14 rounded-btn bg-primary text-white text-[16px] font-semibold flex items-center justify-center gap-2 mb-2 disabled:opacity-70"
        >
          {paying ? <Spinner /> : 'Оплатить 100 ₽ →'}
        </button>
        <div className="flex items-center justify-center gap-1 mb-3">
          <span className="text-[11px] text-text-muted">🔒 Оплата через Telegram Payments · ЮКасса</span>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="w-full text-[13px] text-text-muted text-center"
        >
          Попробовать бесплатный план
        </button>
      </div>
    </div>
  )
}

function CellValue({ value, isPro = false }: { value: string | boolean; isPro?: boolean }) {
  if (typeof value === 'boolean') {
    if (value) return <Check className={`w-4 h-4 mx-auto ${isPro ? 'text-primary' : 'text-text-muted'}`} />
    return <span className="text-[14px] text-text-muted">—</span>
  }
  return <span className={`text-[13px] font-medium ${isPro ? 'text-primary' : 'text-text-muted'}`}>{value}</span>
}

function Spinner() {
  return (
    <svg className="animate-spin w-5 h-5 text-white" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  )
}
