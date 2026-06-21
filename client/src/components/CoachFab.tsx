import { Link, useLocation } from 'react-router-dom'
import { Bot, Sparkles } from 'lucide-react'

/** “Ask AI” pill — sits in the fixed footer row above the bottom nav. */
export function CoachFab() {
  const { pathname } = useLocation()
  if (pathname === '/coach') return null

  return (
    <Link
      to="/coach"
      className="flex min-h-11 items-center gap-2 rounded-full border-2 border-slate-900 bg-brand px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-emerald-950/30 transition hover:bg-emerald-800 active:scale-[0.98]"
      aria-label="Ask the AI coach about your carbon footprint"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white/30 bg-white/10">
        <Bot className="h-4 w-4" aria-hidden />
      </span>
      Ask AI
      <Sparkles className="h-4 w-4 opacity-90" aria-hidden />
    </Link>
  )
}
