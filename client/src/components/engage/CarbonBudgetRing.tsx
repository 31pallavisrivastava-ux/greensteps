import type { CarbonBudget } from '@carbon/shared'

interface CarbonBudgetRingProps {
  budget: CarbonBudget
  compact?: boolean
}

export function CarbonBudgetRing({ budget, compact }: CarbonBudgetRingProps) {
  const size = compact ? 96 : 120
  const stroke = compact ? 8 : 10
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const progress = Math.min(budget.usedPct, 100)
  const offset = circumference - (progress / 100) * circumference

  const ringColor =
    budget.status === 'over' ? '#ef4444' : budget.status === 'warning' ? '#f59e0b' : '#059669'

  const ringLabel = `${budget.usedPct}% of weekly fair-share carbon budget used. ${budget.usedKg} of ${budget.fairShareKg} kg. ${budget.statusLabel}`

  if (compact) {
    return (
      <div className="flex items-center gap-4">
        <div
          className="relative shrink-0"
          style={{ width: size, height: size }}
          role="img"
          aria-label={ringLabel}
        >
          <svg width={size} height={size} className="-rotate-90" aria-hidden>
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={ringColor}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-bold text-slate-900">{budget.usedPct}%</span>
          </div>
        </div>
        <div>
          <p className="font-semibold text-slate-900">
            {budget.usedKg} / {budget.fairShareKg} kg this week
          </p>
          <p className="text-sm text-slate-500">
            {budget.overBudget
              ? `${Math.abs(budget.remainingKg)} kg over · ${budget.statusLabel}`
              : `${budget.remainingKg} kg left · ${budget.statusLabel}`}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-5">
      <div
        className="relative shrink-0"
        style={{ width: size, height: size }}
        role="img"
        aria-label={ringLabel}
      >
        <svg width={size} height={size} className="-rotate-90" aria-hidden>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={ringColor}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-slate-900">{budget.usedPct}%</span>
          <span className="text-[10px] font-medium text-slate-500">used</span>
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-lg font-bold text-slate-900">
          {budget.usedKg} <span className="font-normal text-slate-500">/ {budget.fairShareKg} kg</span>
        </p>
        <p
          className={`mt-1 text-sm font-medium ${
            budget.overBudget ? 'text-red-600' : budget.status === 'warning' ? 'text-amber-600' : 'text-emerald-700'
          }`}
        >
          {budget.overBudget
            ? `${Math.abs(budget.remainingKg)} kg over fair share`
            : `${budget.remainingKg} kg left this week`}
        </p>
        <p className="mt-1 text-xs text-slate-500">Fair share ~{budget.annualFairShareKg} kg/year</p>
      </div>
    </div>
  )
}
