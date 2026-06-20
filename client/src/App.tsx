import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './lib/auth'
import { Layout } from './components/Layout'
import { LoginPage } from './pages/LoginPage'
import { TodayPage } from './pages/TodayPage'
import { TripsPage } from './pages/TripsPage'
import { FuelPage } from './pages/FuelPage'
import { EnergyPage } from './pages/EnergyPage'
import { PurchasesPage } from './pages/PurchasesPage'
import { PlasticPage } from './pages/PlasticPage'
import { InsightsPage } from './pages/InsightsPage'

function Protected({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="p-8 text-center text-slate-500">Loading…</div>
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <Protected>
            <Layout />
          </Protected>
        }
      >
        <Route index element={<TodayPage />} />
        <Route path="trips" element={<TripsPage />} />
        <Route path="fuel" element={<FuelPage />} />
        <Route path="energy" element={<EnergyPage />} />
        <Route path="purchases" element={<PurchasesPage />} />
        <Route path="plastic" element={<PlasticPage />} />
        <Route path="insights" element={<InsightsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
