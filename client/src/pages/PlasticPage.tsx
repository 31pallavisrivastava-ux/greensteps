import { useState } from 'react'
import { Recycle, Trash2, Droplets } from 'lucide-react'
import { api } from '../lib/api'
import type { PlasticSummary } from '@carbon/shared'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { ActionReward } from '@carbon/shared'
import { CelebrationBanner } from '../components/rewards'
import { PageHeader, EmptyState, LoadingScreen } from '../components/ui'
import { BlockGrid, BlockOption, BlockSection } from '../components/BlockOption'
import { useRadioGroup } from '../lib/useRadioGroup'
import { usePageLoad } from '../lib/usePageLoad'
import { useSaveFeedback } from '../lib/useSaveFeedback'

const PLASTIC_TYPES = [
  { id: 'PET', label: 'Water bottle (PET)' },
  { id: 'HDPE', label: 'Milk jug / bottle (HDPE)' },
  { id: 'LDPE', label: 'Carry bag (LDPE)' },
  { id: 'PP', label: 'Food container (PP)' },
  { id: 'MULTILAYER', label: 'Chip / snack pack' },
  { id: 'MIXED', label: 'Mixed plastic' },
] as const

const DISPOSAL = [
  { id: 'RECYCLED', label: 'Recycled ♻️', icon: Recycle, color: 'text-emerald-700' },
  { id: 'LANDFILL', label: 'Bin / landfill', icon: Trash2, color: 'text-slate-700' },
  { id: 'REUSED', label: 'Reused at home', icon: Droplets, color: 'text-sky-700' },
] as const

export function PlasticPage() {
  const { data: summary, loading, reload } = usePageLoad(() =>
    api<PlasticSummary>('/plastic/summary?period=week')
  )
  const { saved, markSaved } = useSaveFeedback()
  const [form, setForm] = useState({
    plasticType: 'PET' as (typeof PLASTIC_TYPES)[number]['id'],
    grams: 25,
    disposalMethod: 'RECYCLED' as (typeof DISPOSAL)[number]['id'],
    occurredAt: new Date().toISOString().slice(0, 16),
    notes: '',
  })
  const [lastReward, setLastReward] = useState<ActionReward | null>(null)
  const disposalIds = DISPOSAL.map((d) => d.id)
  const { onKeyDown: onDisposalKeyDown } = useRadioGroup(
    form.disposalMethod,
    disposalIds,
    (id) => setForm({ ...form, disposalMethod: id })
  )

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await api<{ reward?: ActionReward }>('/plastic/disposal', {
      method: 'POST',
      body: JSON.stringify({
        ...form,
        occurredAt: new Date(form.occurredAt).toISOString(),
      }),
    })
    if (res.reward) setLastReward(res.reward)
    markSaved()
    reload()
  }

  const chartData = summary
    ? [
        { name: 'From orders', grams: summary.purchaseG },
        { name: 'You logged', grams: summary.disposalG },
        { name: 'Recycled', grams: summary.recycledG },
        { name: 'Landfill', grams: summary.landfillG },
      ]
    : []

  if (loading) return <LoadingScreen label="Loading plastic data…" />

  return (
    <div className="space-y-5">
      <PageHeader
        icon={Droplets}
        iconBg="bg-cyan-100"
        iconColor="text-cyan-700"
        title="Plastic waste"
        subtitle="Track plastic from deliveries and what you throw away"
        help="Rough guide: 1 small carry bag ≈ 10g · 1 chips packet ≈ 8g · 1 food container ≈ 35g"
      />

      {summary && (
        <div className="card">
          <p className="text-sm font-medium text-slate-600">Plastic this week</p>
          <p className="mt-1 text-3xl font-bold text-cyan-800">
            {(summary.purchaseG + summary.disposalG).toFixed(0)} grams
          </p>
          <div className="mt-4 h-44" role="img" aria-label={`Plastic chart: from orders ${summary.purchaseG.toFixed(0)}g, logged ${summary.disposalG.toFixed(0)}g, recycled ${summary.recycledG.toFixed(0)}g, landfill ${summary.landfillG.toFixed(0)}g`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [`${Number(v).toFixed(0)} g`, 'Weight']} />
                <Bar dataKey="grams" fill="#06b6d4" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <form onSubmit={submit} className="card space-y-4">
        <h3 className="text-lg font-bold text-slate-900">Log plastic you threw away</h3>

        <div>
          <label className="label" htmlFor="type">Type of plastic</label>
          <select
            id="type"
            className="input"
            value={form.plasticType}
            onChange={(e) => setForm({ ...form, plasticType: e.target.value as typeof form.plasticType })}
          >
            {PLASTIC_TYPES.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="grams">Weight in grams</label>
          <input
            id="grams"
            className="input"
            type="number"
            min={1}
            value={form.grams}
            onChange={(e) => setForm({ ...form, grams: +e.target.value })}
          />
        </div>

        <BlockSection label="What did you do with it?" labelId="disposal-method">
          <BlockGrid labelledBy="disposal-method" onKeyDown={onDisposalKeyDown}>
            {DISPOSAL.map((d) => {
              const Icon = d.icon
              return (
                <BlockOption
                  key={d.id}
                  selected={form.disposalMethod === d.id}
                  onClick={() => setForm({ ...form, disposalMethod: d.id })}
                >
                  <Icon className={`h-6 w-6 ${form.disposalMethod === d.id ? 'text-brand' : d.color}`} aria-hidden />
                  {d.label}
                </BlockOption>
              )
            })}
          </BlockGrid>
        </BlockSection>

        <div>
          <label className="label" htmlFor="when">When?</label>
          <input
            id="when"
            className="input"
            type="datetime-local"
            value={form.occurredAt}
            onChange={(e) => setForm({ ...form, occurredAt: e.target.value })}
          />
        </div>

        <button type="submit" className="btn-primary w-full">
          {saved ? 'Saved!' : 'Save plastic entry'}
        </button>
        {saved && (
          <p className="text-center text-sm font-medium text-emerald-700" role="status">
            Plastic entry saved
          </p>
        )}
        {lastReward && <CelebrationBanner reward={lastReward} />}
      </form>

      {!summary?.disposalG && !summary?.purchaseG && (
        <EmptyState
          icon={Recycle}
          title="Start tracking plastic"
          message="Log delivery orders in the Shop tab, or add plastic you throw away here."
        />
      )}
    </div>
  )
}
