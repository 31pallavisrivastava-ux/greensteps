import { Share2, Trophy } from 'lucide-react'
import type { CommunityComparison } from '@carbon/shared'

interface ComparisonCardProps {
  comparison: CommunityComparison
  onShare?: () => void
  sharing?: boolean
  compact?: boolean
}

export function ComparisonCard({ comparison, onShare, sharing, compact }: ComparisonCardProps) {
  const { percentile, rankLabel, vsAverage, wins } = comparison
  const topWin = wins[0]

  if (compact) {
    return (
      <div className="card flex items-center justify-between gap-3 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100">
            <Trophy className="h-5 w-5 text-violet-700" aria-hidden />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">{rankLabel}</p>
            <p className="text-xs text-slate-500">Beat {percentile}% · +{vsAverage.co2SavedDiffKg} kg saved vs avg</p>
          </div>
        </div>
        {onShare && (
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600"
            onClick={onShare}
            disabled={sharing}
            aria-label="Share milestone"
          >
            <Share2 className="h-4 w-4" aria-hidden />
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Community</p>
          <p className="text-lg font-bold text-slate-900">{rankLabel}</p>
        </div>
        <p className="text-2xl font-bold text-violet-600">{percentile}%</p>
      </div>

      {topWin && <p className="mt-3 text-sm text-slate-600">{topWin}</p>}

      {onShare && (
        <button
          type="button"
          className="btn-secondary mt-4 w-full !min-h-11 !py-2.5 !text-sm"
          onClick={onShare}
          disabled={sharing}
        >
          <Share2 className="h-4 w-4" aria-hidden />
          {sharing ? 'Sharing…' : 'Share milestone'}
        </button>
      )}
    </div>
  )
}
