import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, GraduationCap, PenLine, BookOpen } from 'lucide-react'
import { api } from '../lib/api'
import { HomeHero } from '../components/HomeHero'
import { EngagePanel } from '../components/engage/EngagePanel'
import { QuickActions } from '../components/ui-extra'
import { LoadingScreen, TipCard } from '../components/ui'
import { TodayActionCard } from '../components/TodayActionCard'
import { PersonalFootprintCard } from '../components/PersonalFootprintCard'
import type { CommunityComparison, EngageDashboard, PersonalFootprint, TodayAction, TripResponse, WeeklyInsight } from '@carbon/shared'

export function TodayPage() {
  const [insight, setInsight] = useState<WeeklyInsight | null>(null)
  const [comparison, setComparison] = useState<CommunityComparison | null>(null)
  const [engage, setEngage] = useState<EngageDashboard | null>(null)
  const [todayAction, setTodayAction] = useState<TodayAction | null>(null)
  const [personal, setPersonal] = useState<PersonalFootprint | null>(null)
  const [pendingTrips, setPendingTrips] = useState<TripResponse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api<WeeklyInsight>('/insights/weekly'),
      api<TripResponse[]>('/trips'),
      api<CommunityComparison>('/guide/comparison'),
      api<EngageDashboard>('/engage/dashboard'),
      api<TodayAction>('/engage/today-action'),
    ])
      .then(([ins, trips, comp, eng, action]) => {
        setInsight(ins)
        setComparison(comp)
        setEngage(eng)
        setTodayAction(action)
        setPendingTrips(trips.filter((t) => !t.confirmedMode).slice(0, 3))
      })
      .catch(console.error)
      .finally(() => setLoading(false))

    api<PersonalFootprint>('/insights/personal').then(setPersonal).catch(console.error)
  }, [])

  if (loading) {
    return <LoadingScreen label="Loading home…" />
  }

  return (
    <div className="page-stack">
      <h1 className="sr-only">Home</h1>
      {insight && comparison && engage && (
        <HomeHero insight={insight} budget={engage.budget} comparison={comparison} />
      )}

      {todayAction && <TodayActionCard action={todayAction} />}

      {personal && <PersonalFootprintCard data={personal} />}

      <QuickActions
        actions={[
          { to: '/log', icon: <PenLine className="h-5 w-5" aria-hidden />, label: 'Log', colorKey: 'log' },
          { to: '/guide', icon: <BookOpen className="h-5 w-5" aria-hidden />, label: 'Guide', colorKey: 'guide' },
          { to: '/class', icon: <GraduationCap className="h-5 w-5" aria-hidden />, label: 'Class', colorKey: 'class' },
        ]}
      />

      {engage && <EngagePanel dashboard={engage} variant="home" />}

      {pendingTrips.length > 0 && (
        <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3" role="status" aria-live="polite">
          <AlertCircle className="h-5 w-5 shrink-0 text-amber-600" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-amber-950">
              {pendingTrips.length} trip{pendingTrips.length > 1 ? 's' : ''} to confirm
            </p>
            <Link to="/trips" className="mt-1 inline-block text-sm font-semibold text-amber-800 underline">
              Confirm now
            </Link>
          </div>
        </div>
      )}

      {insight?.tips[0] && <TipCard>{insight.tips[0]}</TipCard>}

      <Link to="/insights" className="block text-center text-sm font-semibold text-brand">
        View full impact report →
      </Link>
    </div>
  )
}
