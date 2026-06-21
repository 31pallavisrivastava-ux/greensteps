import { Award, PartyPopper, Sparkles, Sun, TrainFront, Footprints, Package, TreePine } from 'lucide-react'
import type { ActionReward, WeeklyRewards } from '@carbon/shared'

const HIGHLIGHT_ICONS: Record<string, typeof Sun> = {
  sun: Sun,
  train: TrainFront,
  footprints: Footprints,
  package: Package,
}

export function CelebrationBanner({ reward }: { reward: ActionReward }) {
  const isCelebration = reward.type === 'celebration'

  return (
    <div
      className={`mt-4 flex gap-3 rounded-xl border p-3 ${
        isCelebration ? 'border-emerald-200 bg-emerald-50' : 'border-sky-200 bg-sky-50'
      }`}
      role="status"
      aria-live="polite"
    >
      {isCelebration ? (
        <PartyPopper className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
      ) : (
        <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-sky-600" aria-hidden />
      )}
      <div>
        <p className="font-semibold text-slate-900">{reward.title}</p>
        <p className="mt-0.5 text-sm text-slate-600">{reward.message}</p>
      </div>
    </div>
  )
}

export function WeeklyRewardsCard({ rewards, compact }: { rewards: WeeklyRewards; compact?: boolean }) {
  if (compact) {
    return (
      <div className="card flex items-center gap-4 py-3">
        <Award className="h-8 w-8 shrink-0 text-brand" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900">{rewards.headline}</p>
          <p className="text-xs text-slate-500">
            {rewards.co2SavedKg} kg saved · {rewards.plasticRecycledG.toFixed(0)}g recycled
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex items-start gap-3">
        <Award className="h-8 w-8 shrink-0 text-brand" aria-hidden />
        <div>
          <p className="text-sm font-medium text-slate-500">Your wins</p>
          <p className="font-semibold text-slate-900">{rewards.headline}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-slate-50 py-2">
          <p className="text-lg font-bold text-slate-900">{rewards.co2SavedKg}</p>
          <p className="text-[10px] font-medium text-slate-500">kg saved</p>
        </div>
        <div className="rounded-lg bg-slate-50 py-2">
          <p className="text-lg font-bold text-slate-900">{rewards.energySavedKwh}</p>
          <p className="text-[10px] font-medium text-slate-500">kWh clean</p>
        </div>
        <div className="rounded-lg bg-slate-50 py-2">
          <p className="text-lg font-bold text-slate-900">{rewards.plasticRecycledG.toFixed(0)}</p>
          <p className="text-[10px] font-medium text-slate-500">g recycled</p>
        </div>
      </div>

      {rewards.badges.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {rewards.badges.map((b) => (
            <span key={b.id} className="rounded-full bg-brand-muted px-2.5 py-1 text-xs font-semibold text-brand">
              {b.emoji} {b.label}
            </span>
          ))}
        </div>
      )}

      {rewards.treesEquivalent > 0 && (
        <p className="mt-3 flex items-center gap-2 text-xs text-slate-500">
          <TreePine className="h-4 w-4" aria-hidden />
          ~{rewards.treesEquivalent} tree{rewards.treesEquivalent > 1 ? 's' : ''} equivalent
        </p>
      )}

      {rewards.highlights.length > 0 && !compact && (
        <ul className="mt-3 space-y-1.5 border-t border-slate-100 pt-3">
          {rewards.highlights.slice(0, 2).map((h, i) => {
            const Icon = HIGHLIGHT_ICONS[h.icon] ?? Sparkles
            return (
              <li key={i} className="flex items-center gap-2 text-xs text-slate-600">
                <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {h.text}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
