import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { api } from '../lib/api'
import type { FootprintExplanation } from '@carbon/shared'

interface FootprintExplainPanelProps {
  open: boolean
  onClose: () => void
}

export function FootprintExplainPanel({ open, onClose }: FootprintExplainPanelProps) {
  const [data, setData] = useState<FootprintExplanation | null>(null)
  const [loading, setLoading] = useState(false)
  const closeRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    api<FootprintExplanation>('/insights/explain')
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [open])

  useEffect(() => {
    if (!open) return

    const previousFocus = document.activeElement as HTMLElement | null
    closeRef.current?.focus()

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }
      if (e.key !== 'Tab' || !dialogRef.current) return

      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      if (!focusable.length) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      const trigger = document.getElementById('explain-trigger')
      if (trigger instanceof HTMLElement) trigger.focus()
      else previousFocus?.focus?.()
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={dialogRef}
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-md border-2 border-slate-900 bg-white"
        style={{ boxShadow: 'var(--shadow-block)' }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="explain-title"
        aria-describedby="explain-desc"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between border-b-2 border-slate-900 bg-white px-4 py-3">
          <h2 id="explain-title" className="text-lg font-black text-slate-900">
            Why this number?
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-md border-2 border-slate-900 bg-white hover:bg-slate-50"
            aria-label="Close explanation"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <div id="explain-desc" className="space-y-4 p-4">
          {loading && (
            <p className="text-sm font-medium text-slate-600" role="status" aria-live="polite">
              Loading breakdown…
            </p>
          )}

          {data && (
            <>
              <div className="rounded-md border-2 border-slate-900 bg-slate-50 p-3">
                <p className="text-2xl font-black text-slate-900">{data.totalKg} kg CO₂</p>
                <p className="mt-1 text-xs font-medium text-slate-600">
                  Scope 1 {data.scope1} · Scope 2 {data.scope2} · Scope 3 {data.scope3}
                </p>
              </div>

              {data.lines.length === 0 ? (
                <p className="text-sm font-medium text-slate-700">
                  Log trips, bills, or orders this week to see line-by-line calculations.
                </p>
              ) : (
                <ul className="space-y-3">
                  {data.lines.map((line, i) => (
                    <li key={i} className="rounded-md border-2 border-slate-900 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-bold uppercase text-slate-600">{line.scope}</p>
                          <p className="font-bold text-slate-900">{line.label}</p>
                          <p className="mt-1 font-mono text-xs text-slate-700">{line.formula}</p>
                          {line.detail && (
                            <p className="mt-1 text-xs font-medium text-slate-600">{line.detail}</p>
                          )}
                        </div>
                        <p className="shrink-0 text-sm font-black text-brand">{line.co2eKg} kg</p>
                      </div>
                      <p className="mt-2 text-[10px] font-medium text-slate-600">Source: {line.source}</p>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
