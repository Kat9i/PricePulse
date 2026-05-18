import { useState, useEffect } from 'react'
import { HashRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { OnboardingPage } from './pages/OnboardingPage'
import { HomePage } from './pages/HomePage'
import { SettingsPage } from './pages/SettingsPage'
import { ProPage } from './pages/ProPage'
import { api, bootstrapAuth } from './lib/api'
import { initTelegram, isInTelegram } from './lib/telegram'
import { MOCK_USER, MOCK_TRACKINGS } from './lib/mock'
import type { User, Tracking } from './types'

function Loader() {
  return (
    <div className="flex h-full items-center justify-center bg-bg">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl">
          📦
        </div>
        <p className="text-[14px] text-text-muted">Загружаю...</p>
      </div>
    </div>
  )
}

function ErrorScreen({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex h-full items-center justify-center bg-bg px-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="text-4xl">⚠️</div>
        <p className="text-[15px] text-text-main font-medium">Не удалось загрузить</p>
        <p className="text-[13px] text-text-muted">{message}</p>
        <button
          onClick={onRetry}
          className="mt-2 px-6 h-11 rounded-btn bg-primary text-white text-[14px] font-semibold"
        >
          Попробовать снова
        </button>
      </div>
    </div>
  )
}

function AppRoutes() {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [trackings, setTrackings] = useState<Tracking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    initTelegram()
    bootstrap()
  }, [])

  async function bootstrap() {
    setLoading(true)
    setError(null)

    if (!isInTelegram()) {
      setUser(MOCK_USER)
      setTrackings(MOCK_TRACKINGS)
      setLoading(false)
      return
    }

    try {
      const { user: me, is_new } = await bootstrapAuth()
      const list = await api.getTrackings().catch(() => [] as Tracking[])
      setUser(me)
      setTrackings(list)
      if (is_new) navigate('/onboarding')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки')
    } finally {
      setLoading(false)
    }
  }

  function handleTrackingAdded(t: Tracking) {
    setTrackings((prev) => [t, ...prev])
  }

  function handleTrackingDeleted(id: string) {
    setTrackings((prev) => prev.filter((t) => t.id !== id))
  }

  function handleTrackingUpdated(updated: Tracking) {
    setTrackings((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
  }

  async function handleOnboardingComplete(region: string) {
    try {
      const updated = await api.updateMe({ region })
      setUser(updated)
    } catch {
      setUser((u) => (u ? { ...u, region } : u))
    }
    navigate('/home')
  }

  if (loading) return <Loader />
  if (error) return <ErrorScreen message={error} onRetry={bootstrap} />

  const needsOnboarding = !user?.region

  return (
    <Routes>
      <Route
        path="/onboarding"
        element={<OnboardingPage onComplete={handleOnboardingComplete} />}
      />

      <Route
        path="/home"
        element={
          needsOnboarding ? (
            <Navigate to="/onboarding" replace />
          ) : (
            <HomePage
              user={user!}
              trackings={trackings}
              onTrackingAdded={handleTrackingAdded}
              onTrackingDeleted={handleTrackingDeleted}
              onTrackingUpdated={handleTrackingUpdated}
            />
          )
        }
      />

      <Route
        path="/settings"
        element={
          <SettingsPage
            user={user!}
            onUserUpdate={setUser}
            trackingCount={trackings.filter((t) => t.status !== 'frozen').length}
          />
        }
      />

      <Route
        path="/pro"
        element={<ProPage onUserUpdate={setUser} />}
      />

      <Route
        path="/"
        element={<Navigate to={needsOnboarding ? '/onboarding' : '/home'} replace />}
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <HashRouter>
      <div className="h-full flex flex-col">
        <AppRoutes />
      </div>
    </HashRouter>
  )
}
