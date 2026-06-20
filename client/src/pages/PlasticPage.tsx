import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import type { PlasticSummary } from '@carbon/shared'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const PLASTIC_TYPES = ['PET', 'HDPE', 'LDPE', 'PP', 'MULTILAYER', 'MIXED'] as const
const DISPOSAL = ['RECYCLED', 'LANDFILL', 'REUSED'] as const

export function PlasticPage() {
  const [summary, setSummary] = useState<PlasticSummary | null>(null)
  const [form, setForm] = useState({
    plasticType: 'PET' as typeof PLASTIC_TYPES[number],
    grams: 25,
    disposalMethod: 'RECYCLED' as typeof DISPOSAL[number],
    occurredAt: new Date().toISOString().slice(0, 16),
    notes: '',
  })

  const load = () => api<PlasticSummary>('/plastic/summary?period=week').then(setSummary).catch(console.error)
  useEffect(() => { load() }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    await api('/plastic/disposal', {
      method: 'POST',
      body: JSON.stringify({
        ...form,
        occurredAt: new Date(form.occurredAt).toISOString(),
      }),
    })
    load()
  }

  const chartData = summary
    ? [
        { name: 'Purchase', grams: summary.purchaseG },
        { name: 'Disposal', grams: summary.disposalG },
        { name: 'Recycled', grams: summary.recycledG },
        { name: 'Landfill', grams: summary.landfillG },
      ]
    : []

  return (
    <div className="space-y-4">
      {summary && (
        <div className="card">
          <h2 className="font-semibold text-brand">Weekly plastic ledger</h2>
          <p className="mt-1 text-2xl font-semibold">
            {(summary.purchaseG + summary.disposalG).toFixed(0)} g total
          </p>
          <div className="mt-2 h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="grams" fill="#34d399" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="card">
        <h3 className="font-semibold">Log household disposal</h3>
        <form onSubmit={submit} className="mt-3 space-y-3">
          <div>
            <label className="label">Plastic type</label>
            <select
              className="input"
              value={form.plasticType}
              onChange={(e) => setForm({ ...form, plasticType: e.target.value as typeof form.plasticType })}
            >
              {PLASTIC_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Weight (grams)</label>
            <input
              className="input"
              type="number"
              value={form.grams}
              onChange={(e) => setForm({ ...form, grams: +e.target.value })}
            />
          </div>
          <div>
            <label className="label">Disposal method</label>
            <select
              className="input"
              value={form.disposalMethod}
              onChange={(e) => setForm({ ...form, disposalMethod: e.target.value as typeof form.disposalMethod })}
            >
              {DISPOSAL.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Date</label>
            <input
              className="input"
              type="datetime-local"
              value={form.occurredAt}
              onChange={(e) => setForm({ ...form, occurredAt: e.target.value })}
            />
          </div>
          <button type="submit" className="btn-primary w-full">Log disposal</button>
        </form>
      </div>
    </div>
  )
}
