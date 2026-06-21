import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import type { TodayAction } from '@carbon/shared'

export function TodayActionCard({ action }: { action: TodayAction }) {
  return (
    <div className="block-panel !p-0 overflow-hidden">
      <div className="flex items-start gap-3 border-b-2 border-slate-900 bg-brand-muted p-4">
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border-2 border-slate-900 bg-white text-2xl"
          aria-hidden
        >
          {action.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black uppercase tracking-wide text-brand">Do this today</p>
          <h2 className="mt-0.5 text-base font-black text-slate-900">{action.title}</h2>
          <p className="mt-1 text-sm font-medium text-slate-700">{action.message}</p>
          <p className="mt-2 text-xs font-bold text-brand">{action.impactHint}</p>
        </div>
      </div>
      <Link
        to={action.link}
        className="flex items-center justify-between bg-white px-4 py-3.5 text-sm font-black text-brand hover:bg-slate-50"
      >
        {action.actionLabel}
        <ChevronRight className="h-4 w-4" aria-hidden />
      </Link>
    </div>
  )
}
