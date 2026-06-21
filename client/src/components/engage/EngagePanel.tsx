import type { EngageDashboard } from '@carbon/shared'
import { CollapsibleSection } from '../ui-extra'
import { CarbonBudgetRing } from './CarbonBudgetRing'
import { ChallengesCard, StreaksRow } from './ChallengesCard'
import { AqiNudgeCard } from './AqiNudgeCard'
import { ChallengeBusIllustration } from '../visuals/Illustrations'

interface EngagePanelProps {
  dashboard: EngageDashboard
  variant?: 'home' | 'impact'
}

export function EngagePanel({ dashboard, variant = 'impact' }: EngagePanelProps) {
  const activeStreaks = dashboard.streaks.filter((s) => s.days > 0)
  const openChallenges = dashboard.challenges.filter((c) => !c.completed)
  const topChallenge = openChallenges[0] ?? dashboard.challenges[0]
  const showAqi =
    dashboard.aqiNudge.show &&
    dashboard.aqi.usAqi != null &&
    (dashboard.aqiNudge.severity === 'warning' || dashboard.aqiNudge.severity === 'danger')

  if (variant === 'home') {
    return (
      <div className="space-y-3">
        {showAqi && <AqiNudgeCard aqi={dashboard.aqi} nudge={dashboard.aqiNudge} compact />}

        {topChallenge && (
          <div className="card flex items-center gap-3 border-indigo-100 bg-gradient-to-r from-indigo-50 to-violet-50 py-3">
            <ChallengeBusIllustration className="h-11 w-11 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-indigo-950">{topChallenge.title}</p>
              <div 
                className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/80"
                role="progressbar"
                aria-valuenow={topChallenge.current}
                aria-valuemin={0}
                aria-valuemax={topChallenge.target}
                aria-label={`Progress: ${topChallenge.current} of ${topChallenge.target} for ${topChallenge.title}`}
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                  style={{ width: `${topChallenge.progressPct}%` }}
                />
              </div>
            </div>
            <span className="text-xs font-bold text-indigo-700">
              {topChallenge.current}/{topChallenge.target}
            </span>
          </div>
        )}

        {activeStreaks.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {activeStreaks.map((s) => (
              <span
                key={s.id}
                className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-orange-100 to-amber-100 px-3 py-1 text-xs font-semibold text-orange-900"
              >
                {s.emoji} {s.days}d {s.label.split(' ')[0].toLowerCase()}
              </span>
            ))}
          </div>
        )}
      </div>
    )
  }

  const challengeSummary = `${openChallenges.length} active · ${dashboard.challenges.filter((c) => c.completed).length} done`

  return (
    <div className="space-y-3">
      {showAqi && <AqiNudgeCard aqi={dashboard.aqi} nudge={dashboard.aqiNudge} />}

      <CollapsibleSection
        title="Carbon budget"
        summary={`${dashboard.budget.usedKg} / ${dashboard.budget.fairShareKg} kg · ${dashboard.budget.statusLabel}`}
        defaultOpen
      >
        <CarbonBudgetRing budget={dashboard.budget} compact />
      </CollapsibleSection>

      {activeStreaks.length > 0 && (
        <CollapsibleSection
          title="Streaks"
          summary={activeStreaks.map((s) => `${s.emoji} ${s.days}d`).join(' · ')}
        >
          <StreaksRow streaks={dashboard.streaks} compact />
        </CollapsibleSection>
      )}

      <CollapsibleSection title="Weekly challenges" summary={challengeSummary} defaultOpen>
        <ChallengesCard challenges={dashboard.challenges} compact />
      </CollapsibleSection>
    </div>
  )
}
