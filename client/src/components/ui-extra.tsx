import { ChevronDown } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useId, useState } from 'react'
import { ACTION_COLORS } from '../lib/visuals'

interface CollapsibleSectionProps {
  title: string
  summary?: string
  defaultOpen?: boolean
  children: React.ReactNode
}

export function CollapsibleSection({
  title,
  summary,
  defaultOpen = false,
  children,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen)
  const panelId = useId()

  return (
    <section className="block-panel overflow-hidden !p-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 border-b-2 border-slate-900 px-4 py-3.5 text-left last:border-b-0"
        aria-expanded={open}
        aria-controls={panelId}
      >
        <div className="min-w-0">
          <p className="font-black text-slate-900">{title}</p>
          {!open && summary && (
            <p className="mt-0.5 truncate text-sm font-medium text-slate-600">{summary}</p>
          )}
        </div>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-slate-400 transition ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>
      {open && (
        <div id={panelId} className="border-t-2 border-slate-900 px-4 pb-4 pt-3">
          {children}
        </div>
      )}
    </section>
  )
}

interface QuickActionProps {
  to: string
  icon: React.ReactNode
  label: string
  colorKey: keyof typeof ACTION_COLORS
}

export function QuickActions({ actions }: { actions: QuickActionProps[] }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {actions.map((a) => {
        const c = ACTION_COLORS[a.colorKey]
        return (
          <Link
            key={a.to}
            to={a.to}
            className={`group flex flex-col items-center gap-2 rounded-md border-2 border-slate-900 bg-white px-2 py-3 text-center transition hover:bg-slate-50 active:translate-x-0.5 active:translate-y-0.5`}
            style={{ boxShadow: 'var(--shadow-block-sm)' }}
          >
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-md border-2 border-slate-900 ${c.bg} ${c.icon}`}
            >
              {a.icon}
            </div>
            <span className="text-xs font-black text-slate-800">{a.label}</span>
          </Link>
        )
      })}
    </div>
  )
}
