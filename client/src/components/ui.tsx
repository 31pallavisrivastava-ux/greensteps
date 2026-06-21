import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { Lightbulb, Loader2 } from 'lucide-react'

interface PageHeaderProps {
  icon: LucideIcon
  iconBg?: string
  iconColor?: string
  title: string
  subtitle: string
  help?: string
}

export function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <div className="mb-4">
      <h1 className="page-title">{title}</h1>
      <p className="page-sub">{subtitle}</p>
    </div>
  )
}

interface ActionCardProps {
  to: string
  icon: LucideIcon
  iconBg: string
  iconColor: string
  title: string
  subtitle: string
}

export function ActionCard({ to, icon: Icon, iconBg, iconColor, title, subtitle }: ActionCardProps) {
  return (
    <Link
      to={to}
      className="block-panel flex items-center gap-3 transition hover:bg-slate-50 active:translate-x-0.5 active:translate-y-0.5"
    >
      <div className={`icon-circle ${iconBg}`}>
        <Icon className={`h-6 w-6 ${iconColor}`} strokeWidth={2.25} aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-black text-slate-900">{title}</p>
        <p className="text-xs font-medium text-slate-600">{subtitle}</p>
      </div>
    </Link>
  )
}

export function TipCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2.5 rounded-md border-2 border-amber-500 bg-amber-50 px-3 py-2.5 text-sm font-medium text-amber-950">
      <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" aria-hidden />
      <p>{children}</p>
    </div>
  )
}

export function LoadingScreen({ label = 'Loading…' }: { label?: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-2 py-16 text-slate-600"
      role="status"
      aria-live="polite"
    >
      <Loader2 className="h-7 w-7 animate-spin text-brand" aria-hidden />
      <p className="text-sm font-medium">{label}</p>
    </div>
  )
}

export function EmptyState({
  icon: Icon,
  title,
  message,
}: {
  icon: LucideIcon
  title: string
  message: string
}) {
  return (
    <div className="card flex flex-col items-center py-8 text-center">
      <Icon className="h-8 w-8 text-slate-300" aria-hidden />
      <p className="mt-3 text-sm font-semibold text-slate-800">{title}</p>
      <p className="mt-1 max-w-xs text-xs text-slate-500">{message}</p>
    </div>
  )
}
