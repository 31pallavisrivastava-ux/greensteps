import { PenLine } from 'lucide-react'
import { ActionCard, PageHeader } from '../components/ui'
import { LOG_ACTIONS, LOG_GROUPS } from '../lib/logActions'

export function LogPage() {
  return (
    <div className="page-stack">
      <PageHeader
        icon={PenLine}
        title="Log"
        subtitle="Add an activity from today"
      />

      {LOG_GROUPS.map(({ id, label }) => (
        <section key={id}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
          <div className="space-y-2">
            {LOG_ACTIONS.filter((a) => a.group === id).map((action) => (
              <ActionCard key={action.to} {...action} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
