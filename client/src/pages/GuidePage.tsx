import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Check, ChevronRight } from 'lucide-react'
import { api } from '../lib/api'
import type { ActionReward, ContextChecklist, SustainabilityTip } from '@carbon/shared'
import { CelebrationBanner } from '../components/rewards'
import { ShareCardButton } from '../components/engage/ShareCardButton'
import { ContextBanner } from '../components/visuals/ContextBanner'
import { CONTEXT_THEMES } from '../lib/visuals'
import { useRadioGroup } from '../lib/useRadioGroup'

interface ContextSummary {
  id: string
  label: string
  emoji: string
  intro: string
  itemCount: number
}

export function GuidePage() {
  const [params, setParams] = useSearchParams()
  const initial = params.get('context')?.toUpperCase() ?? 'BEACH'

  const [contexts, setContexts] = useState<ContextSummary[]>([])
  const [activeId, setActiveId] = useState(initial)
  const [checklist, setChecklist] = useState<ContextChecklist | null>(null)
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [tips, setTips] = useState<SustainabilityTip[]>([])
  const [lastReward, setLastReward] = useState<ActionReward | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  const contextIds = contexts.map((c) => c.id)
  const { onKeyDown: onTabKeyDown } = useRadioGroup(activeId, contextIds, setActiveId)

  useEffect(() => {
    api<ContextSummary[]>('/guide/contexts').then(setContexts).catch(console.error)
    api<SustainabilityTip[]>('/guide/tips').then(setTips).catch(console.error)
  }, [])

  useEffect(() => {
    const id = activeId
    setParams({ context: id.toLowerCase() }, { replace: true })
    setChecked(new Set())
    setLastReward(null)
    api<ContextChecklist>(`/guide/contexts/${id}`).then(setChecklist).catch(console.error)
  }, [activeId, setParams])

  const toggle = (itemId: string) => {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(itemId)) next.delete(itemId)
      else next.add(itemId)
      return next
    })
  }

  const submitChecklist = async () => {
    if (!checklist || checked.size === 0) return
    const res = await api<{ reward: ActionReward }>(`/guide/contexts/${activeId}/complete`, {
      method: 'POST',
      body: JSON.stringify({ itemsDone: [...checked] }),
    })
    setLastReward(res.reward)
  }

  return (
    <div className="page-stack">
      <div className="flex items-end justify-between gap-2">
        <div>
          <h1 className="page-title">Guide</h1>
          <p className="page-sub">Checklists for where you are today</p>
        </div>
        <Link to="/class" className="text-sm font-semibold text-brand">
          Class →
        </Link>
      </div>

      <div
        className="flex gap-2 overflow-x-auto pb-1 scrollbar-none"
        role="tablist"
        aria-label="Guide contexts"
        onKeyDown={onTabKeyDown}
      >
        {contexts.map((c) => {
          const active = activeId === c.id
          const theme = CONTEXT_THEMES[c.id as keyof typeof CONTEXT_THEMES]
          return (
            <button
              key={c.id}
              id={`tab-${c.id.toLowerCase()}`}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={`tabpanel-${c.id.toLowerCase()}`}
              tabIndex={active ? 0 : -1}
              onClick={() => setActiveId(c.id)}
              className={`chip shrink-0 ${
                active && theme
                  ? `border-transparent bg-gradient-to-r ${theme.gradient} text-white shadow-sm`
                  : 'chip-inactive'
              }`}
            >
              <span aria-hidden>{c.emoji}</span>
              {c.label.split(' ').slice(-1)[0]}
            </button>
          )
        })}
      </div>

      {checklist && (
        <div
          id={`tabpanel-${activeId.toLowerCase()}`}
          role="tabpanel"
          aria-labelledby={`tab-${activeId.toLowerCase()}`}
          className="space-y-4"
        >
          <ContextBanner
            contextId={activeId as keyof typeof CONTEXT_THEMES}
            title={checklist.label}
            emoji={checklist.emoji}
            intro={checklist.intro}
          />

        <div className="card">
          <ul className="space-y-2">
            {checklist.items.map((item) => {
              const done = checked.has(item.id)
              const isOpen = expanded === item.id
              return (
                <li key={item.id}>
                  <div
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${
                      done ? 'bg-emerald-50' : ''
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggle(item.id)}
                      role="checkbox"
                      aria-checked={done}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    >
                      <div
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${
                          done ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300'
                        }`}
                      >
                        {done && <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />}
                      </div>
                      <span className="text-sm font-medium text-slate-900">{item.label}</span>
                    </button>
                    <button
                      type="button"
                      className="shrink-0 p-2.5 text-slate-400 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 rounded"
                      onClick={() => setExpanded(isOpen ? null : item.id)}
                      aria-label={`More info for ${item.label}`}
                    >
                      <ChevronRight className={`h-4 w-4 transition ${isOpen ? 'rotate-90' : ''}`} />
                    </button>
                  </div>
                  {isOpen && (
                    <p className="px-3 pb-2 text-xs leading-relaxed text-slate-500">
                      {item.tip} · {item.co2eHint}
                    </p>
                  )}
                </li>
              )
            })}
          </ul>

          <p className="mt-3 text-center text-xs text-slate-500">
            {checked.size}/{checklist.items.length} done
          </p>

          <button
            type="button"
            className="btn-primary mt-3 w-full"
            disabled={checked.size === 0}
            onClick={submitChecklist}
          >
            Save checklist
          </button>

          {lastReward && <CelebrationBanner reward={lastReward} />}

          {checked.size > 0 && (
            <div className="mt-3">
              <ShareCardButton
                contextEmoji={checklist.emoji}
                contextLabel={checklist.label}
                checklistPct={Math.round((checked.size / checklist.items.length) * 100)}
                label="Share image"
                className="btn-secondary w-full !text-sm"
              />
            </div>
          )}
        </div>
        </div>
      )}

      {tips.length > 0 && (
        <div className="card">
          <h2 className="section-title text-base font-bold text-slate-900">Tips</h2>
          <ul className="mt-2 space-y-2">
            {tips.slice(0, 3).map((tip) => (
              <li key={tip.id} className="text-sm text-slate-600">
                <span className="font-medium text-slate-900">{tip.title}</span> — {tip.body}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
