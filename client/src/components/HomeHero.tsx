import { useState } from 'react'
import { HelpCircle } from 'lucide-react'
import type { CarbonBudget, CommunityComparison, WeeklyInsight } from '@carbon/shared'
import { SCOPE_COLORS } from '../lib/visuals'
import { HeroEarthIllustration } from './visuals/Illustrations'
import { FootprintExplainPanel } from './FootprintExplainPanel'

interface HomeHeroProps {
  insight: WeeklyInsight
  budget: CarbonBudget
  comparison: CommunityComparison
}

function MiniRing({ pct, color, over }: { pct: number; color: string; over?: boolean }) {
  const size = 56
  const stroke = 5
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const displayPct = over ? 100 : Math.min(pct, 100)
  const offset = c - (displayPct / 100) * c

  return (
    <svg width={size} height={size} className="-rotate-90 shrink-0" aria-hidden>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
      />
    </svg>
  )
}

const SCOPE_META = [
  { key: 'fuel' as const, label: 'Fuel', val: (i: WeeklyInsight) => i.footprint.scope1 },
  { key: 'power' as const, label: 'Power', val: (i: WeeklyInsight) => i.footprint.scope2 },
  { key: 'travel' as const, label: 'Travel', val: (i: WeeklyInsight) => i.footprint.scope3 },
]

export function HomeHero({ insight, budget, comparison }: HomeHeroProps) {
  const [explainOpen, setExplainOpen] = useState(false)
  const ringColor =
    budget.status === 'over' ? '#ef4444' : budget.status === 'warning' ? '#f59e0b' : '#059669'
  const ringLabel = budget.overBudget ? 'Over' : `${budget.usedPct}%`

  const scopes = SCOPE_META.map((s) => ({ ...s, value: s.val(insight) }))
  const topDriver = scopes.reduce((a, b) => (b.value > a.value ? b : a))

  return (
    <div className="card !p-0 overflow-hidden shadow-md">
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-700 via-brand to-teal-800 px-5 pb-5 pt-5 text-white">
        <div className="absolute -right-2 top-2 opacity-90">
          <HeroEarthIllustration className="h-28 w-28" />
        </div>
        <div className="relative z-10 max-w-[70%]">
          <p className="text-sm font-medium text-emerald-100">This week</p>
          <p className="mt-1 text-4xl font-bold leading-none">{insight.footprint.total.toFixed(1)}</p>
          <p className="mt-1 text-sm text-emerald-100">kg CO₂ footprint</p>
          <button
            type="button"
            id="explain-trigger"
            onClick={() => setExplainOpen(true)}
            className="mt-3 inline-flex min-h-11 items-center gap-1.5 rounded-md border-2 border-white bg-white/90 px-3 py-2 text-xs font-bold text-brand hover:bg-white"
          >
            <HelpCircle className="h-4 w-4" aria-hidden />
            Why this number?
          </button>
          {!budget.overBudget && (
            <span className="mt-3 inline-flex rounded-md border border-white/40 bg-white/20 px-3 py-1 text-xs font-semibold">
              <span aria-hidden>🏆 </span>
              {comparison.percentile}% · {comparison.rankLabel}
            </span>
          )}
          {budget.overBudget && (
            <p className="mt-3 rounded-lg bg-red-500/30 px-3 py-1.5 text-xs font-medium">
              {Math.abs(budget.remainingKg)} kg over · cut {topDriver.label.toLowerCase()} first
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 border-b border-slate-100 p-3">
        {scopes.map(({ key, label, value }) => {
          const colors = SCOPE_COLORS[key]
          const isTop = key === topDriver.key
          return (
            <div
              key={key}
              className={`rounded-xl px-2 py-2.5 text-center ${colors.bg} ${isTop ? 'ring-2 ring-offset-1 ring-red-300' : ''}`}
            >
              <p className={`text-base font-bold ${colors.text}`}>{value.toFixed(1)}</p>
              <p className={`text-[10px] font-bold uppercase tracking-wide ${colors.text}`}>
                {label}{isTop ? ' ↑' : ''}
              </p>
            </div>
          )
        })}
      </div>

      <div className="flex items-center gap-4 px-4 py-3.5">
        <div
          className="relative"
          role="img"
          aria-label={`${ringLabel} of weekly carbon budget used, ${budget.usedKg} of ${budget.fairShareKg} kilograms`}
        >
          <MiniRing pct={budget.usedPct} color={ringColor} over={budget.overBudget} />
          <span
            aria-hidden
            className={`absolute inset-0 flex items-center justify-center text-[10px] font-bold ${
              budget.overBudget ? 'text-red-600' : 'text-emerald-700'
            }`}
          >
            {ringLabel}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900">
            {budget.usedKg} / {budget.fairShareKg} kg budget
          </p>
          <p className="text-xs text-slate-500">
            {budget.overBudget
              ? `${Math.round((budget.usedKg / budget.fairShareKg) * 100)}% of fair share`
              : `${budget.remainingKg} kg left · saved ${insight.rewards.co2SavedKg} kg`}
          </p>
        </div>
      </div>
      <FootprintExplainPanel open={explainOpen} onClose={() => setExplainOpen(false)} />
    </div>
  )
}
