import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'

interface FuelPurchase {
  id: string
  purchasedAt: string
  liters: number
  co2eKg: number
  fuelType: string
  amountInr: number | null
}

export function FuelPage() {
  const { user } = useAuth()
  const [purchases, setPurchases] = useState<FuelPurchase[]>([])
  const [form, setForm] = useState({
    liters: 2,
    amountInr: 200,
    vehicleId: '',
    purchasedAt: new Date().toISOString().slice(0, 16),
  })

  const load = () => api<FuelPurchase[]>('/fuel').then(setPurchases).catch(console.error)
  useEffect(() => { load() }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    await api('/fuel', {
      method: 'POST',
      body: JSON.stringify({
        ...form,
        purchasedAt: new Date(form.purchasedAt).toISOString(),
        vehicleId: form.vehicleId || undefined,
      }),
    })
    load()
  }

  return (
    <div className="space-y-4">
      <div className="card">
        <p className="text-xs text-slate-500">Scope 1 · IPCC fuel factors</p>
        <h2 className="font-semibold text-brand">Log fuel purchase</h2>
        <form onSubmit={submit} className="mt-3 space-y-3">
          <div>
            <label className="label">Liters</label>
            <input
              className="input"
              type="number"
              step="0.1"
              value={form.liters}
              onChange={(e) => setForm({ ...form, liters: +e.target.value })}
            />
          </div>
          <div>
            <label className="label">Amount (₹)</label>
            <input
              className="input"
              type="number"
              value={form.amountInr}
              onChange={(e) => setForm({ ...form, amountInr: +e.target.value })}
            />
          </div>
          <div>
            <label className="label">Vehicle</label>
            <select
              className="input"
              value={form.vehicleId}
              onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
            >
              <option value="">None</option>
              {user?.vehicles?.map((v) => (
                <option key={v.id} value={v.id}>{v.label} ({v.fuelType})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Date</label>
            <input
              className="input"
              type="datetime-local"
              value={form.purchasedAt}
              onChange={(e) => setForm({ ...form, purchasedAt: e.target.value })}
            />
          </div>
          <button type="submit" className="btn-primary w-full">Save fuel log</button>
        </form>
      </div>

      <h2 className="text-sm font-semibold">History</h2>
      {purchases.map((p) => (
        <div key={p.id} className="card text-sm">
          <div className="flex justify-between font-medium">
            <span>{p.liters}L {p.fuelType}</span>
            <span>{p.co2eKg.toFixed(2)} kg CO₂e</span>
          </div>
          <p className="text-xs text-slate-500">
            {new Date(p.purchasedAt).toLocaleString()}
            {p.amountInr ? ` · ₹${p.amountInr}` : ''}
          </p>
        </div>
      ))}
    </div>
  )
}
