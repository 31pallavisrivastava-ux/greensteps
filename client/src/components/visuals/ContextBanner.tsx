import { CONTEXT_THEMES } from '../../lib/visuals'
import { ContextIllustration } from './Illustrations'

interface ContextBannerProps {
  contextId: keyof typeof CONTEXT_THEMES
  title: string
  emoji: string
  intro: string
}

export function ContextBanner({ contextId, title, emoji, intro }: ContextBannerProps) {
  const theme = CONTEXT_THEMES[contextId] ?? CONTEXT_THEMES.HOME

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${theme.gradient} p-4 text-white shadow-md`}>
      <div className="relative z-10 flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-2xl" aria-hidden>{emoji}</p>
          <h2 className="mt-1 text-lg font-bold">{title}</h2>
          <p className="mt-1 text-sm leading-snug text-white/90">{intro}</p>
        </div>
        <ContextIllustration contextId={contextId} className="h-20 w-20 shrink-0 drop-shadow-md" />
      </div>
      <div className="pointer-events-none absolute -bottom-6 -right-6 h-32 w-32 rounded-full bg-white/10" />
    </div>
  )
}
