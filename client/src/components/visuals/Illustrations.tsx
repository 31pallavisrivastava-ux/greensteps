type IllustrationProps = { className?: string }

export function HeroEarthIllustration({ className = 'h-24 w-24' }: IllustrationProps) {
  return (
    <svg className={className} viewBox="0 0 120 120" fill="none" aria-hidden>
      <circle cx="60" cy="62" r="38" fill="#34d399" opacity="0.35" />
      <circle cx="60" cy="60" r="34" fill="#059669" />
      <path
        d="M34 58c8-14 22-22 26-22s18 8 26 22c-6 10-16 16-26 16s-20-6-26-16z"
        fill="#10b981"
      />
      <path d="M44 52c4-6 10-10 16-10s12 4 16 10" stroke="#ecfdf5" strokeWidth="2" strokeLinecap="round" />
      <ellipse cx="42" cy="44" rx="14" ry="8" fill="#fde68a" opacity="0.9" />
      <path d="M88 28c6 4 10 10 10 16" stroke="#fef08a" strokeWidth="3" strokeLinecap="round" />
      <path
        d="M18 78c8 6 18 10 28 10"
        stroke="#6ee7b7"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle cx="88" cy="36" r="3" fill="#fef9c3" />
    </svg>
  )
}

export function BeachIllustration({ className = 'h-20 w-20' }: IllustrationProps) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" aria-hidden>
      <rect width="100" height="100" rx="20" fill="url(#beachGrad)" />
      <path d="M0 68 Q25 58 50 68 T100 68 V100 H0Z" fill="#fde68a" />
      <path d="M0 76 Q30 70 55 76 T100 76 V100 H0Z" fill="#fbbf24" opacity="0.6" />
      <circle cx="72" cy="28" r="14" fill="#fef08a" />
      <path d="M20 55c8-12 16-18 24-18s16 6 24 18" stroke="#0ea5e9" strokeWidth="3" fill="#38bdf8" opacity="0.8" />
      <ellipse cx="35" cy="62" rx="8" ry="3" fill="#fff" opacity="0.5" />
      <defs>
        <linearGradient id="beachGrad" x1="0" y1="0" x2="100" y2="100">
          <stop stopColor="#22d3ee" />
          <stop offset="1" stopColor="#0284c7" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export function SchoolIllustration({ className = 'h-20 w-20' }: IllustrationProps) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" aria-hidden>
      <rect width="100" height="100" rx="20" fill="url(#schoolGrad)" />
      <rect x="22" y="42" width="56" height="38" rx="4" fill="#fff" opacity="0.95" />
      <path d="M50 22 L78 38 V42 H22 V38 Z" fill="#fde68a" />
      <rect x="30" y="50" width="10" height="10" rx="1" fill="#c4b5fd" />
      <rect x="45" y="50" width="10" height="10" rx="1" fill="#c4b5fd" />
      <rect x="60" y="50" width="10" height="10" rx="1" fill="#c4b5fd" />
      <rect x="44" y="62" width="12" height="18" rx="1" fill="#8b5cf6" />
      <circle cx="78" cy="28" r="8" fill="#fef08a" opacity="0.8" />
      <defs>
        <linearGradient id="schoolGrad" x1="0" y1="0" x2="100" y2="100">
          <stop stopColor="#a78bfa" />
          <stop offset="1" stopColor="#6366f1" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export function HomeIllustration({ className = 'h-20 w-20' }: IllustrationProps) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" aria-hidden>
      <rect width="100" height="100" rx="20" fill="url(#homeGrad)" />
      <path d="M50 24 L78 44 V72 H22 V44 Z" fill="#fff" opacity="0.95" />
      <rect x="42" y="52" width="16" height="20" rx="1" fill="#fb923c" />
      <rect x="30" y="48" width="10" height="10" rx="1" fill="#7dd3fc" />
      <circle cx="72" cy="30" r="10" fill="#fef08a" />
      <path d="M38 72h24" stroke="#fdba74" strokeWidth="2" />
      <defs>
        <linearGradient id="homeGrad" x1="0" y1="0" x2="100" y2="100">
          <stop stopColor="#fbbf24" />
          <stop offset="1" stopColor="#f97316" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export function TravelIllustration({ className = 'h-20 w-20' }: IllustrationProps) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" aria-hidden>
      <rect width="100" height="100" rx="20" fill="url(#travelGrad)" />
      <rect x="18" y="48" width="64" height="22" rx="6" fill="#fff" opacity="0.95" />
      <rect x="26" y="54" width="18" height="10" rx="2" fill="#93c5fd" />
      <circle cx="32" cy="72" r="6" fill="#1e3a8a" />
      <circle cx="68" cy="72" r="6" fill="#1e3a8a" />
      <path d="M70 38h16l-8 12h-8V38z" fill="#fde68a" />
      <defs>
        <linearGradient id="travelGrad" x1="0" y1="0" x2="100" y2="100">
          <stop stopColor="#38bdf8" />
          <stop offset="1" stopColor="#4f46e5" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export function MarketIllustration({ className = 'h-20 w-20' }: IllustrationProps) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" aria-hidden>
      <rect width="100" height="100" rx="20" fill="url(#marketGrad)" />
      <path d="M24 38h52l-6 44H30l-6-44z" fill="#fff" opacity="0.95" />
      <path d="M30 38c0-8 6-14 10-14s10 6 10 14" stroke="#86efac" strokeWidth="3" fill="none" />
      <circle cx="40" cy="56" r="6" fill="#f87171" />
      <circle cx="56" cy="58" r="5" fill="#fbbf24" />
      <rect x="62" y="52" width="8" height="10" rx="1" fill="#4ade80" />
      <defs>
        <linearGradient id="marketGrad" x1="0" y1="0" x2="100" y2="100">
          <stop stopColor="#86efac" />
          <stop offset="1" stopColor="#059669" />
        </linearGradient>
      </defs>
    </svg>
  )
}

const CONTEXT_ILLUSTRATIONS = {
  BEACH: BeachIllustration,
  SCHOOL: SchoolIllustration,
  HOME: HomeIllustration,
  TRAVEL: TravelIllustration,
  MARKET: MarketIllustration,
} as const

export function ContextIllustration({
  contextId,
  className,
}: {
  contextId: keyof typeof CONTEXT_ILLUSTRATIONS
  className?: string
}) {
  const Comp = CONTEXT_ILLUSTRATIONS[contextId] ?? HomeIllustration
  return <Comp className={className} />
}

export function ChallengeBusIllustration({ className = 'h-10 w-10' }: IllustrationProps) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden>
      <rect width="48" height="48" rx="12" fill="#dbeafe" />
      <rect x="8" y="16" width="32" height="18" rx="4" fill="#2563eb" />
      <rect x="12" y="20" width="8" height="6" rx="1" fill="#bfdbfe" />
      <circle cx="16" cy="36" r="3" fill="#1e3a8a" />
      <circle cx="32" cy="36" r="3" fill="#1e3a8a" />
    </svg>
  )
}
