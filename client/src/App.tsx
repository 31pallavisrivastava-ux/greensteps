import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from './lib/auth'
import { Layout } from './components/Layout'
import { LoginPage } from './pages/LoginPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { TodayPage } from './pages/TodayPage'
import { TripsPage } from './pages/TripsPage'
import { FuelPage } from './pages/FuelPage'
import { EnergyPage } from './pages/EnergyPage'
import { PurchasesPage } from './pages/PurchasesPage'
import { PlasticPage } from './pages/PlasticPage'
import { InsightsPage } from './pages/InsightsPage'
import { GuidePage } from './pages/GuidePage'
import { LogPage } from './pages/LogPage'
import { ClassPage } from './pages/ClassPage'
import { SettingsPage } from './pages/SettingsPage'

function Protected({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="p-8 text-center text-slate-600" role="status" aria-live="polite">Loading…</div>
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const location = useLocation()
  const needsOnboarding = user != null && user.onboardingCompleted !== true
  if (needsOnboarding && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />
  }
  if (user?.onboardingCompleted === true && location.pathname === '/onboarding') {
    return <Navigate to="/" replace />
  }
  return <>{children}</>
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/onboarding"
        element={
          <Protected>
            <OnboardingPage />
          </Protected>
        }
      />
      <Route
        element={
          <Protected>
            <OnboardingGuard>
              <Layout />
            </OnboardingGuard>
          </Protected>
        }
      >
        <Route index element={<TodayPage />} />
        <Route path="log" element={<LogPage />} />
        <Route path="trips" element={<TripsPage />} />
        <Route path="fuel" element={<FuelPage />} />
        <Route path="energy" element={<EnergyPage />} />
        <Route path="purchases" element={<PurchasesPage />} />
        <Route path="plastic" element={<PlasticPage />} />
        <Route path="insights" element={<InsightsPage />} />
        <Route path="guide" element={<GuidePage />} />
        <Route path="class" element={<ClassPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
