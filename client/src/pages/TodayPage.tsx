import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Activity, ChevronRight } from 'lucide-react'
import { api } from '../lib/api'
import type { TripResponse, WeeklyInsight } from '@carbon/shared'

export function TodayPage() {
  const [insight, setInsight] = useState<WeeklyInsight | null>(null)
  const [pendingTrips, setPendingTrips] = useState<TripResponse[]>([])

  useEffect(() => {
    api<WeeklyInsight>('/insights/weekly').then(setInsight).catch(console.error)
    api<TripResponse[]>('/trips').then((trips) => {
      setPendingTrips(trips.filter((t) => !t.confirmedMode).slice(0, 3))
    }).catch(console.error)
  }, [])

  const quickLinks = [
    { to: '/trips', label: 'Track commute', desc: 'GPS or manual trip' },
    { to: '/fuel', label: 'Log fuel fill', desc: 'Scope 1 · petrol/diesel' },
    { to: '/energy', label: 'Log energy bill', desc: 'Scope 2 · CEA grid factor' },
    { to: '/purchases', label: 'Log delivery order', desc: 'Blinkit, Swiggy, Zomato…' },
    { to: '/plastic', label: 'Log plastic disposal', desc: 'Recycle vs landfill' },
  ]

  return (
    <div className="space-y-4">
      {insight && (
        <div className="card bg-brand text-white">
          <p className="text-xs uppercase opacity-80">This week</p>
          <p className="mt-1 text-2xl font-semibold">
            {(insight.footprint.total).toFixed(1)} kg CO₂e
          </p>
          <div className="mt-2 flex gap-3 text-xs">
            <span>S1: {insight.footprint.scope1.toFixed(1)}</span>
            <span>S2: {insight.footprint.scope2.toFixed(1)}</span>
            <span>S3: {insight.footprint.scope3.toFixed(1)}</span>
          </div>
        </div>
      )}

      {pendingTrips.length > 0 && (
        <div className="card border-amber-200 bg-amber-50">
          <div className="flex items-center gap-2 text-amber-800">
            <Activity className="h-4 w-4" />
            <p className="text-sm font-medium">
              {pendingTrips.length} trip(s) need confirmation
            </p>
          </div>
          <Link to="/trips" className="mt-2 inline-block text-sm text-brand underline">
            Confirm now →
          </Link>
        </div>
      )}

      {insight?.tips.map((tip, i) => (
        <div key={i} className="card text-sm text-slate-600">
          💡 {tip}
        </div>
      ))}

      <h2 className="text-sm font-semibold text-slate-700">Quick log</h2>
      <div className="space-y-2">
        {quickLinks.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="card flex items-center justify-between transition hover:border-brand/30"
          >
            <div>
              <p className="font-medium text-slate-800">{link.label}</p>
              <p className="text-xs text-slate-500">{link.desc}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </Link>
        ))}
      </div>
    </div>
  )
}
