import { useState } from 'react'
import { Fuel, IndianRupee } from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { usePageLoad } from '../lib/usePageLoad'
import { useSaveFeedback } from '../lib/useSaveFeedback'
import { useSubmit } from '../lib/useSubmit'
import { PageHeader, EmptyState, LoadingScreen } from '../components/ui'

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
  const { data: purchases, loading, error, reload } = usePageLoad(() => api<FuelPurchase[]>('/fuel'))
  const { saved, markSaved } = useSaveFeedback()
  const { submitting, error: submitError, run: runSubmit } = useSubmit()
  const [form, setForm] = useState({
    liters: 2,
    amountInr: 200,
    vehicleId: '',
    purchasedAt: new Date().toISOString().slice(0, 16),
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    void runSubmit(async () => {
      await api('/fuel', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          purchasedAt: new Date(form.purchasedAt).toISOString(),
          vehicleId: form.vehicleId || undefined,
        }),
      })
      markSaved()
      await reload()
    })
  }

  if (loading) return <LoadingScreen label="Loading fuel entries…" />

  return (
    <div className="space-y-5">
      <PageHeader
        icon={Fuel}
        iconBg="bg-red-100"
        iconColor="text-red-700"
        title="Petrol & diesel"
        subtitle="Log when you fill fuel at a petrol pump"
        help="Enter the number of litres from your bill. This helps calculate carbon from your vehicle."
      />

      <form onSubmit={submit} className="card space-y-4">
        <div>
          <label className="label" htmlFor="liters">Litres filled</label>
          <input
            id="liters"
            className="input"
            type="number"
            step="0.1"
            min={0.1}
            value={form.liters}
            onChange={(e) => setForm({ ...form, liters: +e.target.value })}
          />
          <p className="hint">Look on your petrol pump receipt</p>
        </div>

        <div>
          <label className="label" htmlFor="amount">
            <span className="flex items-center gap-2">
              <IndianRupee className="h-4 w-4" aria-hidden /> Amount paid (optional)
            </span>
          </label>
          <input
            id="amount"
            className="input"
            type="number"
            value={form.amountInr}
            onChange={(e) => setForm({ ...form, amountInr: +e.target.value })}
          />
        </div>

        <div>
          <label className="label" htmlFor="vehicle">Vehicle</label>
          <select
            id="vehicle"
            className="input"
            value={form.vehicleId}
            onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
          >
            <option value="">Select vehicle (optional)</option>
            {user?.vehicles?.map((v) => (
              <option key={v.id} value={v.id}>{v.label} — {v.fuelType}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="date">Date & time</label>
          <input
            id="date"
            className="input"
            type="datetime-local"
            value={form.purchasedAt}
            onChange={(e) => setForm({ ...form, purchasedAt: e.target.value })}
          />
        </div>

        <button type="submit" className="btn-primary w-full" disabled={submitting}>
          {saved ? 'Saved!' : submitting ? 'Saving…' : 'Save fuel entry'}
        </button>
        {submitError && (
          <p className="text-center text-sm font-medium text-red-600" role="alert">{submitError}</p>
        )}
      </form>

      {error && (
        <p className="text-center text-sm text-red-600" role="alert">{error}</p>
      )}

      <h2 className="section-title">Previous entries</h2>
      {(!purchases || purchases.length === 0) ? (
        <EmptyState
          icon={Fuel}
          title="No fuel logged yet"
          message="When you visit a petrol pump, come back here and add the litres you bought."
        />
      ) : (
        <div className="space-y-3">
          {(purchases ?? []).map((p) => (
            <div key={p.id} className="card flex items-center gap-4">
              <div className="icon-circle bg-red-50">
                <Fuel className="h-6 w-6 text-red-600" aria-hidden />
              </div>
              <div className="flex-1">
                <p className="text-lg font-bold text-slate-900">{p.liters} litres</p>
                <p className="text-sm text-slate-500">
                  {new Date(p.purchasedAt).toLocaleDateString()}
                  {p.amountInr ? ` · ₹${p.amountInr}` : ''}
                </p>
              </div>
              <p className="text-right text-sm font-bold text-brand">
                {p.co2eKg.toFixed(1)} kg<br />
                <span className="font-normal text-slate-500">CO₂</span>
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
