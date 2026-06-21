import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  Legend,
  XAxis,
  YAxis,
} from 'recharts'
import { api } from '../lib/api'
import { shareText } from '../lib/share'
import type {
  CommunityComparison,
  EngageDashboard,
  FamilyDashboard,
  FamilyGroupSummary,
  FootprintHistory,
  PersonalFootprint,
  ShareMilestone,
  WeeklyInsight,
} from '@carbon/shared'
import { LoadingScreen, TipCard } from '../components/ui'
import { CollapsibleSection } from '../components/ui-extra'
import { WeeklyRewardsCard } from '../components/rewards'
import { ComparisonCard } from '../components/comparison'
import { EngagePanel } from '../components/engage/EngagePanel'
import { FootprintExplainPanel } from '../components/FootprintExplainPanel'
import { ShareCardButton } from '../components/engage/ShareCardButton'
import { BlockOption } from '../components/BlockOption'

const SCOPE_COLORS = ['#dc2626', '#f59e0b', '#6366f1']
const SCOPE_LABELS = ['Fuel & gas', 'Electricity', 'Travel & orders']
const TREND_BAR = '#059669'

export function InsightsPage() {
  const [insight, setInsight] = useState<WeeklyInsight | null>(null)
  const [history, setHistory] = useState<FootprintHistory | null>(null)
  const [comparison, setComparison] = useState<CommunityComparison | null>(null)
  const [engage, setEngage] = useState<EngageDashboard | null>(null)
  const [publicShift, setPublicShift] = useState(10)
  const [orderReduction, setOrderReduction] = useState(2)
  const [sharing, setSharing] = useState(false)
  const [explainOpen, setExplainOpen] = useState(false)
  const [view, setView] = useState<'personal' | 'family'>('personal')
  const [personal, setPersonal] = useState<PersonalFootprint | null>(null)
  const [familyDashboard, setFamilyDashboard] = useState<FamilyDashboard | null>(null)

  useEffect(() => {
    Promise.all([
      api<WeeklyInsight>('/insights/weekly'),
      api<CommunityComparison>('/guide/comparison'),
      api<EngageDashboard>('/engage/dashboard'),
    ])
      .then(([ins, comp, eng]) => {
        setInsight(ins)
        setComparison(comp)
        setEngage(eng)
      })
      .catch(console.error)

    api<FootprintHistory>('/insights/history?weeks=12').then(setHistory).catch(console.error)
    api<PersonalFootprint>('/insights/personal').then(setPersonal).catch(console.error)
    api<FamilyGroupSummary[]>('/family')
      .then(async (families) => {
        if (families.length > 0) {
          const dash = await api<FamilyDashboard>(`/family/${families[0].id}/dashboard`)
          setFamilyDashboard(dash)
        }
      })
      .catch(console.error)
  }, [])

  const handleShare = async () => {
    setSharing(true)
    try {
      const data = await api<{ share: ShareMilestone }>('/guide/milestones/share')
      await shareText(data.share.title, data.share.text, window.location.origin)
    } catch {
      /* ignore */
    } finally {
      setSharing(false)
    }
  }

  if (!insight) {
    return <LoadingScreen label="Loading report…" />
  }

  const scopeData = [
    { name: SCOPE_LABELS[0], value: insight.footprint.scope1 },
    { name: SCOPE_LABELS[1], value: insight.footprint.scope2 },
    { name: SCOPE_LABELS[2], value: insight.footprint.scope3 },
  ]

  const merchantData = Object.entries(insight.footprint.byMerchant).map(([name, value]) => ({
    name: name.replace(/_/g, ' '),
    value: Math.round(value * 100) / 100,
  }))

  const shiftSaved = (insight.scenarios.shift10pctToPublic.savedKg * publicShift) / 10
  const orderSaved = {
    co2: (insight.scenarios.reduceDeliveryOrdersBy2.savedCo2eKg * orderReduction) / 2,
    plastic: (insight.scenarios.reduceDeliveryOrdersBy2.savedPlasticG * orderReduction) / 2,
  }

  return (
    <div className="page-stack">
      <div>
        <h1 className="page-title">Impact</h1>
        <p className="page-sub">
          {view === 'personal'
            ? `${personal?.totalKg ?? insight.footprint.total.toFixed(1)} kg CO₂ this week (you)`
            : familyDashboard
              ? `${familyDashboard.household.totalKg} kg CO₂ this week (household)`
              : `${insight.footprint.total.toFixed(1)} kg CO₂ this week`}
        </p>
        <button
          type="button"
          onClick={() => setExplainOpen(true)}
          className="mt-1 text-sm font-semibold text-brand underline"
        >
          Why this number? →
        </button>
      </div>

      <div className="block-grid !grid-cols-2">
        <BlockOption selected={view === 'personal'} onClick={() => setView('personal')} compact>
          👤 Personal
        </BlockOption>
        <BlockOption
          selected={view === 'family'}
          onClick={() => setView('family')}
          compact
          className={!familyDashboard ? 'opacity-60' : ''}
        >
          🏠 Family
        </BlockOption>
      </div>

      {view === 'personal' && personal && (
        <div className="block-panel space-y-3">
          <p className="text-xs font-black uppercase text-brand">Your personal footprint</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { l: 'Fuel', v: personal.scope1 },
              { l: 'Power', v: personal.scope2 },
              { l: 'Travel', v: personal.scope3 },
            ].map(({ l, v }) => (
              <div key={l} className="rounded-md border-2 border-slate-900 bg-slate-50 p-2 text-center">
                <p className="font-black">{v.toFixed(1)}</p>
                <p className="text-[10px] font-bold uppercase">{l}</p>
              </div>
            ))}
          </div>
          <p className="text-sm font-medium text-slate-600">{personal.statusLabel}</p>
        </div>
      )}

      {view === 'family' && (
        <>
          {familyDashboard ? (
            <div className="block-panel space-y-3">
              <p className="text-xs font-black uppercase text-brand">
                {familyDashboard.family.name} · {familyDashboard.family.memberCount} members
              </p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { l: 'Fuel', v: familyDashboard.household.scope1 },
                  { l: 'Power', v: familyDashboard.household.scope2 },
                  { l: 'Travel', v: familyDashboard.household.scope3 },
                ].map(({ l, v }) => (
                  <div key={l} className="rounded-md border-2 border-slate-900 bg-slate-50 p-2 text-center">
                    <p className="font-black">{v.toFixed(1)}</p>
                    <p className="text-[10px] font-bold uppercase">{l}</p>
                  </div>
                ))}
              </div>
              <ul className="space-y-2">
                {familyDashboard.members.map((m) => (
                  <li
                    key={m.userId}
                    className={`flex justify-between rounded-md border-2 px-3 py-2 text-sm ${
                      m.isYou ? 'border-brand bg-emerald-50' : 'border-slate-900 bg-white'
                    }`}
                  >
                    <span className="font-bold">
                      {m.name}
                      {m.isYou ? ' (you)' : ''}
                    </span>
                    <span className="font-black text-brand">{m.co2TotalKg} kg</span>
                  </li>
                ))}
              </ul>
              <p className="hint">
                Each member logs their own trips and bills — avoid double-counting shared electricity.
              </p>
            </div>
          ) : (
            <div className="block-panel text-center">
              <p className="font-bold text-slate-800">No family group yet</p>
              <Link to="/family" className="mt-2 inline-block text-sm font-black text-brand underline">
                Create or join a family →
              </Link>
            </div>
          )}
        </>
      )}

      {view === 'personal' && history && history.weeks.length > 0 && (
        <CollapsibleSection
          title="12-week trend"
          summary={history.trend.message}
          defaultOpen
        >
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={history.weeks} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={1} angle={-35} textAnchor="end" height={48} />
                <YAxis tick={{ fontSize: 10 }} unit=" kg" />
                <Tooltip formatter={(v) => [`${Number(v).toFixed(1)} kg`, 'Total CO₂']} />
                <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                  {history.weeks.map((_, i) => (
                    <Cell
                      key={i}
                      fill={i === history.weeks.length - 1 ? TREND_BAR : `${TREND_BAR}99`}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {history.trend.direction === 'down' && '📉 '}
            {history.trend.direction === 'up' && '📈 '}
            {history.trend.message}
          </p>
        </CollapsibleSection>
      )}

      {view === 'personal' && (
        <>
      <FootprintExplainPanel open={explainOpen} onClose={() => setExplainOpen(false)} />

      {insight.rewards && <WeeklyRewardsCard rewards={insight.rewards} compact />}

      {comparison && (
        <ComparisonCard comparison={comparison} onShare={handleShare} sharing={sharing} compact />
      )}

      {engage && <EngagePanel dashboard={engage} variant="impact" />}

      <CollapsibleSection title="Breakdown" summary="Fuel, power, travel split" defaultOpen>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={scopeData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={65}
                paddingAngle={2}
              >
                {scopeData.map((_, i) => (
                  <Cell key={i} fill={SCOPE_COLORS[i]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => [`${Number(v).toFixed(1)} kg`, '']} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title="How you travelled"
        summary={`${insight.commuteSplit.public}% public · ${insight.commuteSplit.active}% active`}
      >
        <div className="flex h-2 overflow-hidden rounded-full">
          <div className="bg-indigo-500" style={{ width: `${insight.commuteSplit.public}%` }} />
          <div className="bg-red-400" style={{ width: `${insight.commuteSplit.private}%` }} />
          <div className="bg-emerald-500" style={{ width: `${insight.commuteSplit.active}%` }} />
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
          <div><span className="font-bold">{insight.commuteSplit.public}%</span> bus/metro</div>
          <div><span className="font-bold">{insight.commuteSplit.private}%</span> car</div>
          <div><span className="font-bold">{insight.commuteSplit.active}%</span> walk/cycle</div>
        </div>
      </CollapsibleSection>

      {merchantData.length > 0 && (
        <CollapsibleSection title="Delivery apps" summary={`${merchantData.length} merchants`}>
          <div className="space-y-1.5">
            {merchantData.map((m) => (
              <div key={m.name} className="flex justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                <span>{m.name}</span>
                <span className="font-semibold">{m.value.toFixed(2)} kg</span>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      <CollapsibleSection
        title="Plastic"
        summary={`${(insight.plastic.purchaseG + insight.plastic.disposalG).toFixed(0)}g total`}
      >
        <p className="text-sm text-slate-600">
          Recycled {insight.plastic.recycledG.toFixed(0)}g · Landfill {insight.plastic.landfillG.toFixed(0)}g
        </p>
      </CollapsibleSection>

      <CollapsibleSection title="What-if scenarios" summary="Sliders to explore savings">
        <div className="space-y-4">
          <div>
            <label className="label" htmlFor="public-slider">
              +{publicShift}% public transport
            </label>
            <input
              id="public-slider"
              type="range"
              min={0}
              max={30}
              value={publicShift}
              onChange={(e) => setPublicShift(+e.target.value)}
              className="h-2 w-full accent-brand"
              aria-valuetext={`+${publicShift}% public transport`}
              aria-describedby="public-slider-desc"
            />
            <p id="public-slider-desc" className="mt-1 text-sm text-emerald-700">Save ~{shiftSaved.toFixed(1)} kg/week</p>
          </div>
          <div>
            <label className="label" htmlFor="order-slider">
              {orderReduction} fewer deliveries/week
            </label>
            <input
              id="order-slider"
              type="range"
              min={0}
              max={5}
              value={orderReduction}
              onChange={(e) => setOrderReduction(+e.target.value)}
              className="h-2 w-full accent-brand"
              aria-valuetext={`${orderReduction} fewer deliveries per week`}
              aria-describedby="order-slider-desc"
            />
            <p id="order-slider-desc" className="mt-1 text-sm text-emerald-700">
              Save ~{orderSaved.co2.toFixed(1)} kg + {orderSaved.plastic.toFixed(0)}g plastic
            </p>
          </div>
        </div>
      </CollapsibleSection>

      {insight.tips[0] && <TipCard>{insight.tips[0]}</TipCard>}

      <ShareCardButton label="Share WhatsApp image" className="btn-secondary w-full" />
        </>
      )}

      {view === 'family' && familyDashboard && (
        <Link to="/family" className="block text-center text-sm font-black text-brand underline">
          Manage family groups →
        </Link>
      )}
    </div>
  )
}
