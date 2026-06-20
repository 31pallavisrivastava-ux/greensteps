import { useEffect, useState } from 'react'
import { api } from '../lib/api'

interface EnergyReading {
  id: string
  periodStart: string
  periodEnd: string
  kwh: number
  solarOffsetKwh: number
  lpgKg: number
  co2eKg: number
}

export function EnergyPage() {
  const [readings, setReadings] = useState<EnergyReading[]>([])
  const [form, setForm] = useState({
    kwh: 150,
    solarOffsetKwh: 0,
    lpgKg: 14.2,
    periodStart: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .slice(0, 10),
    periodEnd: new Date().toISOString().slice(0, 10),
  })

  const load = () => api<EnergyReading[]>('/energy').then(setReadings).catch(console.error)
  useEffect(() => { load() }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    await api('/energy', {
      method: 'POST',
      body: JSON.stringify({
        ...form,
        periodStart: new Date(form.periodStart).toISOString(),
        periodEnd: new Date(form.periodEnd).toISOString(),
      }),
    })
    load()
  }

  return (
    <div className="space-y-4">
      <div className="card">
        <p className="text-xs text-slate-500">Scope 2 · CEA Grid V21 (0.7117 kg/kWh)</p>
        <h2 className="font-semibold text-brand">Log energy usage</h2>
        <form onSubmit={submit} className="mt-3 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label">Period start</label>
              <input
                className="input"
                type="date"
                value={form.periodStart}
                onChange={(e) => setForm({ ...form, periodStart: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Period end</label>
              <input
                className="input"
                type="date"
                value={form.periodEnd}
                onChange={(e) => setForm({ ...form, periodEnd: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="label">Electricity (kWh)</label>
            <input
              className="input"
              type="number"
              value={form.kwh}
              onChange={(e) => setForm({ ...form, kwh: +e.target.value })}
            />
          </div>
          <div>
            <label className="label">Solar offset (kWh)</label>
            <input
              className="input"
              type="number"
              value={form.solarOffsetKwh}
              onChange={(e) => setForm({ ...form, solarOffsetKwh: +e.target.value })}
            />
          </div>
          <div>
            <label className="label">LPG used (kg) — Scope 1</label>
            <input
              className="input"
              type="number"
              step="0.1"
              value={form.lpgKg}
              onChange={(e) => setForm({ ...form, lpgKg: +e.target.value })}
            />
          </div>
          <button type="submit" className="btn-primary w-full">Save energy reading</button>
        </form>
      </div>

      <h2 className="text-sm font-semibold">History</h2>
      {readings.map((r) => (
        <div key={r.id} className="card text-sm">
          <div className="flex justify-between font-medium">
            <span>{r.kwh} kWh</span>
            <span>{r.co2eKg.toFixed(2)} kg CO₂e</span>
          </div>
          <p className="text-xs text-slate-500">
            {new Date(r.periodStart).toLocaleDateString()} – {new Date(r.periodEnd).toLocaleDateString()}
            {r.lpgKg > 0 ? ` · LPG ${r.lpgKg}kg` : ''}
          </p>
        </div>
      ))}
    </div>
  )
}
