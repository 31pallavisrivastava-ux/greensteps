import { Check } from 'lucide-react'
import type { StreakInfo, WeeklyChallenge } from '@carbon/shared'

export function StreaksRow({ streaks, compact }: { streaks: StreakInfo[]; compact?: boolean }) {
  const active = streaks.filter((s) => s.days > 0)
  if (active.length === 0) return null

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {active.map((s) => (
          <span
            key={s.id}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-2 text-sm"
          >
            <span aria-hidden>{s.emoji}</span>
            <span className="font-bold text-slate-900">{s.days}</span>
            <span className="text-slate-600">{s.label}</span>
          </span>
        ))}
      </div>
    )
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      {active.map((s) => (
        <div key={s.id} className="flex min-w-[6.5rem] shrink-0 flex-col items-center rounded-xl bg-slate-50 px-3 py-3">
          <span className="text-xl" aria-hidden>{s.emoji}</span>
          <p className="mt-1 text-xl font-bold text-slate-900">{s.days}</p>
          <p className="text-center text-[10px] font-medium text-slate-500">{s.label}</p>
        </div>
      ))}
    </div>
  )
}

export function ChallengesCard({ challenges, compact }: { challenges: WeeklyChallenge[]; compact?: boolean }) {
  const list = compact ? challenges : challenges.slice(0, 4)

  return (
    <ul className="space-y-3">
      {list.map((c) => (
        <li key={c.id}>
          <div className="flex items-center gap-3">
            <span className="text-lg" aria-hidden>{c.emoji}</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-900">{c.title}</p>
                {c.completed ? (
                  <Check className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                ) : (
                  <span className="text-xs text-slate-500">{c.current}/{c.target}</span>
                )}
              </div>
              {!compact && <p className="text-xs text-slate-500">{c.description}</p>}
              <div 
                className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100"
                role="progressbar"
                aria-valuenow={c.current}
                aria-valuemin={0}
                aria-valuemax={c.target}
                aria-label={`Progress: ${c.current} of ${c.target} for ${c.title}`}
              >
                <div
                  className={`h-full rounded-full ${c.completed ? 'bg-emerald-500' : 'bg-brand'}`}
                  style={{ width: `${c.progressPct}%` }}
                />
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}
