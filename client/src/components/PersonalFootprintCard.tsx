import { Link } from 'react-router-dom'
import { User } from 'lucide-react'
import type { PersonalFootprint } from '@carbon/shared'

export function PersonalFootprintCard({ data }: { data: PersonalFootprint }) {
  const statusColor =
    data.status === 'under'
      ? 'bg-emerald-100 text-emerald-900 border-emerald-600'
      : data.status === 'on_track'
        ? 'bg-amber-50 text-amber-900 border-amber-500'
        : 'bg-red-50 text-red-900 border-red-600'

  return (
    <div className="block-panel !p-0 overflow-hidden">
      <div className="flex items-center gap-3 border-b-2 border-slate-900 bg-brand-muted px-4 py-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-md border-2 border-slate-900 bg-white">
          <User className="h-5 w-5 text-brand" aria-hidden />
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-brand">Your footprint</p>
          <p className="text-sm font-medium text-slate-700">Personal · this week</p>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="text-3xl font-black text-slate-900">{data.totalKg}</p>
            <p className="text-sm font-medium text-slate-600">kg CO₂</p>
          </div>
          <span className={`rounded-md border-2 px-2 py-1 text-xs font-bold ${statusColor}`}>
            {data.statusLabel}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            { label: 'Fuel', val: data.scope1 },
            { label: 'Power', val: data.scope2 },
            { label: 'Travel', val: data.scope3 },
          ].map(({ label, val }) => (
            <div
              key={label}
              className="rounded-md border-2 border-slate-900 bg-slate-50 px-2 py-2 text-center"
            >
              <p className="text-sm font-black text-slate-900">{val.toFixed(1)}</p>
              <p className="text-[10px] font-bold uppercase text-slate-600">{label}</p>
            </div>
          ))}
        </div>

        <p className="mt-3 text-xs font-medium text-slate-600">
          {data.vsFairSharePct}% of your {data.fairShareKg} kg weekly fair share ·{' '}
          {data.activity.trips} trips · {data.activity.orders} orders
        </p>

        <Link
          to="/family"
          className="mt-3 block text-center text-sm font-black text-brand underline"
        >
          Track with family →
        </Link>
      </div>
    </div>
  )
}
