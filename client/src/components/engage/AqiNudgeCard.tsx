import { Wind } from 'lucide-react'
import type { AqiNudge, AqiReading } from '@carbon/shared'

const SEVERITY_STYLES = {
  good: 'border-emerald-200 bg-emerald-50/80 text-emerald-900',
  info: 'border-slate-200 bg-slate-50 text-slate-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-950',
  danger: 'border-red-200 bg-red-50 text-red-950',
}

interface AqiNudgeCardProps {
  aqi: AqiReading
  nudge: AqiNudge
  compact?: boolean
}

export function AqiNudgeCard({ aqi, nudge, compact }: AqiNudgeCardProps) {
  if (!nudge.show && aqi.usAqi == null) return null

  const style = SEVERITY_STYLES[nudge.severity as keyof typeof SEVERITY_STYLES] ?? SEVERITY_STYLES.info

  if (compact) {
    return (
      <div className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm ${style}`}>
        <Wind className="h-4 w-4 shrink-0" aria-hidden />
        <p className="font-medium leading-snug">{nudge.message}</p>
      </div>
    )
  }

  return (
    <div className={`rounded-xl border px-4 py-3 ${style}`}>
      <div className="flex items-start gap-3">
        <Wind className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
        <div>
          <p className="font-semibold">{nudge.title}</p>
          <p className="mt-1 text-sm leading-relaxed opacity-90">{nudge.message}</p>
        </div>
        {aqi.usAqi != null && (
          <span className="ml-auto shrink-0 text-lg font-bold">{aqi.usAqi}</span>
        )}
      </div>
    </div>
  )
}
