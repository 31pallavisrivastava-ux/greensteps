import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bot, Send, Sparkles } from 'lucide-react'
import { api } from '../lib/api'
import type { CoachChatMessage, CoachChatResponse, CoachStatus } from '@carbon/shared'

const STARTERS = [
  'Why is my footprint high this week?',
  'What should I do today?',
  'How am I trending vs last week?',
  'Am I on track for my carbon budget?',
]

export function CoachPage() {
  const [status, setStatus] = useState<CoachStatus | null>(null)
  const [messages, setMessages] = useState<CoachChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    api<CoachStatus>('/coach/status').then(setStatus).catch(console.error)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const send = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    setError('')
    setInput('')
    const userMsg: CoachChatMessage = { role: 'user', content: trimmed }
    const nextHistory = [...messages, userMsg]
    setMessages(nextHistory)
    setLoading(true)

    try {
      const res = await api<CoachChatResponse>('/coach/chat', {
        method: 'POST',
        body: JSON.stringify({ message: trimmed, history: messages }),
      })
      setMessages([...nextHistory, { role: 'assistant', content: res.reply }])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Coach unavailable')
      setMessages(messages)
      setInput(trimmed)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-stack flex min-h-[70dvh] flex-col">
      <div>
        <h1 className="page-title flex items-center gap-2">
          <Bot className="h-7 w-7 text-brand" aria-hidden />
          Coach
        </h1>
        <p className="page-sub">
          {status?.agentEnabled
            ? `Open-source agent (${status.model}) — reads your data before answering`
            : 'Rules coach — run Ollama locally for full agent mode'}
        </p>
      </div>

      {status && (
        <div
          className={`rounded-md border-2 px-3 py-2 text-sm font-medium ${
            status.agentEnabled
              ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
              : 'border-amber-500 bg-amber-50 text-amber-950'
          }`}
        >
          {status.agentEnabled ? (
            <span className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" aria-hidden />
              Agent mode · {status.provider} {status.model} · {status.tools.length} tools
            </span>
          ) : (
            <span>
              Demo mode: rules + live tools.
              {status.hint ? ` ${status.hint}` : ' Install Ollama and run: ollama pull llama3.1:8b'}
            </span>
          )}
        </div>
      )}

      <div className="block-panel flex-1 space-y-3 overflow-y-auto !p-3" role="log" aria-live="polite" aria-relevant="additions">
        {messages.length === 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-600">Try asking:</p>
            <div className="flex flex-wrap gap-2">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="rounded-md border-2 border-slate-900 bg-white px-2 py-1.5 text-left text-xs font-bold hover:bg-slate-50"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[92%] whitespace-pre-wrap rounded-md border-2 px-3 py-2 text-sm ${
              m.role === 'user'
                ? 'ml-auto border-brand bg-brand text-white'
                : 'border-slate-900 bg-slate-50 text-slate-900'
            }`}
          >
            {m.content}
          </div>
        ))}

        {loading && (
          <p className="text-sm font-medium text-slate-500" role="status">
            Coach is thinking…
          </p>
        )}
        <div ref={bottomRef} />
      </div>

      {error && (
        <p role="alert" className="text-sm font-bold text-red-700">
          {error}
        </p>
      )}

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          send(input)
        }}
      >
        <label htmlFor="coach-input" className="sr-only">
          Message to coach
        </label>
        <input
          id="coach-input"
          className="input flex-1"
          placeholder="Ask about your footprint…"
          value={input}
          disabled={loading}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit" className="btn-primary !min-w-11 !px-3" disabled={loading || !input.trim()} aria-label="Send">
          <Send className="h-4 w-4" aria-hidden />
        </button>
      </form>

      <Link to="/" className="text-center text-sm font-bold text-brand underline">
        Back to home
      </Link>
    </div>
  )
}
