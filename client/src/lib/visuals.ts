/** Context & section colors + illustration keys */
export const CONTEXT_THEMES = {
  BEACH: {
    label: 'Beach',
    gradient: 'from-cyan-400 via-teal-500 to-blue-600',
    soft: 'bg-cyan-50 border-cyan-200',
    accent: 'text-cyan-700',
    chip: 'bg-cyan-500',
  },
  SCHOOL: {
    label: 'School',
    gradient: 'from-violet-400 via-purple-500 to-indigo-600',
    soft: 'bg-violet-50 border-violet-200',
    accent: 'text-violet-700',
    chip: 'bg-violet-500',
  },
  HOME: {
    label: 'Home',
    gradient: 'from-amber-400 via-orange-400 to-rose-500',
    soft: 'bg-amber-50 border-amber-200',
    accent: 'text-amber-800',
    chip: 'bg-amber-500',
  },
  TRAVEL: {
    label: 'Travel',
    gradient: 'from-sky-400 via-blue-500 to-indigo-600',
    soft: 'bg-sky-50 border-sky-200',
    accent: 'text-sky-700',
    chip: 'bg-sky-500',
  },
  MARKET: {
    label: 'Market',
    gradient: 'from-lime-400 via-green-500 to-emerald-600',
    soft: 'bg-lime-50 border-lime-200',
    accent: 'text-green-700',
    chip: 'bg-green-500',
  },
} as const

export const ACTION_COLORS = {
  log: { bg: 'bg-orange-100', icon: 'text-orange-600', border: 'border-orange-200' },
  guide: { bg: 'bg-teal-100', icon: 'text-teal-600', border: 'border-teal-200' },
  class: { bg: 'bg-violet-100', icon: 'text-violet-600', border: 'border-violet-200' },
  impact: { bg: 'bg-indigo-100', icon: 'text-indigo-600', border: 'border-indigo-200' },
} as const

export const SCOPE_COLORS = {
  fuel: { bg: 'bg-red-100', text: 'text-red-700', bar: 'bg-red-500' },
  power: { bg: 'bg-amber-100', text: 'text-amber-800', bar: 'bg-amber-500' },
  travel: { bg: 'bg-indigo-100', text: 'text-indigo-700', bar: 'bg-indigo-500' },
} as const
