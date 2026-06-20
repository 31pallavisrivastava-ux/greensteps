import { useEffect, useState } from 'react'
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts'
import { api } from '../lib/api'
import type { WeeklyInsight } from '@carbon/shared'

const SCOPE_COLORS = ['#dc2626', '#f59e0b', '#6366f1']

export function InsightsPage() {
  const [insight, setInsight] = useState<WeeklyInsight | null>(null)
  const [publicShift, setPublicShift] = useState(10)
  const [orderReduction, setOrderReduction] = useState(2)

  useEffect(() => {
    api<WeeklyInsight>('/insights/weekly').then(setInsight).catch(console.error)
  }, [])

  if (!insight) {
    return <p className="text-sm text-slate-500">Loading insights…</p>
  }

  const scopeData = [
    { name: 'Scope 1 (Fuel/LPG)', value: insight.footprint.scope1 },
    { name: 'Scope 2 (Energy)', value: insight.footprint.scope2 },
    { name: 'Scope 3 (Mobility/Delivery)', value: insight.footprint.scope3 },
  ]

  const merchantData = Object.entries(insight.footprint.byMerchant).map(([name, value]) => ({
    name: name.replace(/_/g, ' '),
    value: Math.round(value * 100) / 100,
  }))

  const shiftSaved =
    (insight.scenarios.shift10pctToPublic.savedKg * publicShift) / 10
  const orderSaved = {
    co2: (insight.scenarios.reduceDeliveryOrdersBy2.savedCo2eKg * orderReduction) / 2,
    plastic: (insight.scenarios.reduceDeliveryOrdersBy2.savedPlasticG * orderReduction) / 2,
  }

  return (
    <div className="space-y-4">
      <div className="card">
        <h2 className="font-semibold text-brand">GHG Protocol summary</h2>
        <p className="text-2xl font-semibold">{insight.footprint.total.toFixed(1)} kg CO₂e</p>
        <p className="text-xs text-slate-500">This week · NCMA India aligned</p>
        <div className="mt-2 h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={scopeData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                paddingAngle={2}
              >
                {scopeData.map((_, i) => (
                  <Cell key={i} fill={SCOPE_COLORS[i]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => `${Number(v).toFixed(2)} kg`} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 space-y-1 text-xs text-slate-500">
          {insight.footprint.factorCitations.map((c, i) => (
            <p key={i}>Source: {c}</p>
          ))}
        </div>
      </div>

      <div className="card">
        <h3 className="text-sm font-semibold">Commute split</h3>
        <div className="mt-2 flex h-3 overflow-hidden rounded-full">
          <div className="bg-indigo-500" style={{ width: `${insight.commuteSplit.public}%` }} />
          <div className="bg-red-500" style={{ width: `${insight.commuteSplit.private}%` }} />
          <div className="bg-emerald-500" style={{ width: `${insight.commuteSplit.active}%` }} />
        </div>
        <div className="mt-2 flex justify-between text-xs text-slate-500">
          <span>Public {insight.commuteSplit.public}%</span>
          <span>Private {insight.commuteSplit.private}%</span>
          <span>Active {insight.commuteSplit.active}%</span>
        </div>
      </div>

      {merchantData.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-semibold">Delivery by merchant</h3>
          {merchantData.map((m) => (
            <div key={m.name} className="mt-2 flex justify-between text-sm">
              <span>{m.name}</span>
              <span>{m.value.toFixed(2)} kg eq.</span>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <h3 className="text-sm font-semibold">Plastic this week</h3>
        <p className="text-lg font-medium">
          {(insight.plastic.purchaseG + insight.plastic.disposalG).toFixed(0)} g
        </p>
        <p className="text-xs text-slate-500">
          Purchases {insight.plastic.purchaseG.toFixed(0)}g · Recycled {insight.plastic.recycledG.toFixed(0)}g · Landfill {insight.plastic.landfillG.toFixed(0)}g
        </p>
      </div>

      <div className="card space-y-4">
        <h3 className="text-sm font-semibold">What-if scenarios</h3>
        <div>
          <label className="label">Shift {publicShift}% private trips to public</label>
          <input
            type="range"
            min={0}
            max={30}
            value={publicShift}
            onChange={(e) => setPublicShift(+e.target.value)}
            className="w-full"
          />
          <p className="text-sm text-brand">Save ~{shiftSaved.toFixed(2)} kg CO₂e</p>
        </div>
        <div>
          <label className="label">Reduce {orderReduction} delivery orders/week</label>
          <input
            type="range"
            min={0}
            max={5}
            value={orderReduction}
            onChange={(e) => setOrderReduction(+e.target.value)}
            className="w-full"
          />
          <p className="text-sm text-brand">
            Save ~{orderSaved.co2.toFixed(2)} kg CO₂e & {orderSaved.plastic.toFixed(0)}g plastic
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Tips</h3>
        {insight.tips.map((tip, i) => (
          <div key={i} className="card text-sm text-slate-600">{tip}</div>
        ))}
      </div>
    </div>
  )
}
