import { useEffect, useState } from 'react'
import { Copy, Home, Plus, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { BlockOption } from '../components/BlockOption'
import { LoadingScreen } from '../components/ui'
import type { FamilyDashboard, FamilyGroupSummary, PersonalFootprint } from '@carbon/shared'

export function FamilyPage() {
  const [families, setFamilies] = useState<FamilyGroupSummary[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [dashboard, setDashboard] = useState<FamilyDashboard | null>(null)
  const [personal, setPersonal] = useState<PersonalFootprint | null>(null)
  const [newName, setNewName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [view, setView] = useState<'personal' | 'family'>('personal')

  const loadFamilies = () =>
    api<FamilyGroupSummary[]>('/family')
      .then((f) => {
        setFamilies(f)
        if (f.length > 0 && !selectedId) setSelectedId(f[0].id)
        if (f.length > 0) setView('family')
      })
      .catch(console.error)
      .finally(() => setLoading(false))

  useEffect(() => {
    Promise.all([loadFamilies(), api<PersonalFootprint>('/insights/personal').then(setPersonal)]).catch(
      console.error
    )
  }, [])

  useEffect(() => {
    if (!selectedId) {
      setDashboard(null)
      return
    }
    api<FamilyDashboard>(`/family/${selectedId}/dashboard`).then(setDashboard).catch(console.error)
  }, [selectedId])

  const createFamily = async () => {
    if (newName.trim().length < 2) return
    const f = await api<FamilyGroupSummary>('/family', {
      method: 'POST',
      body: JSON.stringify({ name: newName.trim() }),
    })
    setNewName('')
    setShowCreate(false)
    setMsg(`Family created! Code: ${f.joinCode}`)
    await loadFamilies()
    setSelectedId(f.id)
    setView('family')
  }

  const joinFamily = async () => {
    const f = await api<{ id: string; name: string; joinCode: string }>('/family/join', {
      method: 'POST',
      body: JSON.stringify({ joinCode: joinCode.trim() }),
    })
    setJoinCode('')
    setMsg(`Joined ${f.name}`)
    await loadFamilies()
    setSelectedId(f.id)
    setView('family')
  }

  const copyCode = (code: string) => {
    navigator.clipboard?.writeText(code)
    setMsg('Code copied!')
  }

  if (loading) {
    return <LoadingScreen label="Loading family…" />
  }

  return (
    <div className="page-stack">
      <div>
        <h1 className="page-title">Footprint</h1>
        <p className="page-sub">Personal tracking and household totals</p>
      </div>

      <div className="block-grid !grid-cols-2">
        <BlockOption selected={view === 'personal'} onClick={() => setView('personal')} compact>
          👤 Personal
        </BlockOption>
        <BlockOption
          selected={view === 'family'}
          onClick={() => setView('family')}
          compact
          className={families.length === 0 ? 'opacity-60' : ''}
        >
          🏠 Family
        </BlockOption>
      </div>

      {msg && (
        <p role="status" className="rounded-md border-2 border-emerald-600 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-900">
          {msg}
        </p>
      )}

      {view === 'personal' && personal && (
        <div className="block-panel space-y-4">
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6 text-brand" aria-hidden />
            <div>
              <p className="font-black text-slate-900">Your personal CO₂</p>
              <p className="text-sm font-medium text-slate-600">Only what you log counts here</p>
            </div>
          </div>
          <p className="text-4xl font-black text-slate-900">
            {personal.totalKg} <span className="text-lg font-bold text-slate-600">kg this week</span>
          </p>
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
          <Link to="/insights" className="btn-secondary w-full text-center">
            Full personal report
          </Link>
        </div>
      )}

      {view === 'family' && (
        <>
          <div className="flex gap-2">
            <button type="button" className="btn-primary flex-1" onClick={() => setShowCreate((v) => !v)}>
              <Plus className="h-4 w-4" aria-hidden />
              Create family
            </button>
          </div>

          {showCreate && (
            <div className="block-panel space-y-3">
              <label className="label" htmlFor="family-name">
                Family name
              </label>
              <input
                id="family-name"
                className="input"
                placeholder="e.g. Sharma household"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
              <button type="button" className="btn-primary w-full" onClick={createFamily}>
                Create & get code
              </button>
            </div>
          )}

          <div className="block-panel space-y-3">
            <label className="label" htmlFor="join-code">
              Join with code
            </label>
            <div className="flex gap-2">
              <input
                id="join-code"
                className="input flex-1 uppercase"
                placeholder="ABC123"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
              />
              <button type="button" className="btn-secondary" onClick={joinFamily}>
                Join
              </button>
            </div>
            <p className="hint">Share the code with family — each person logs their own trips & bills</p>
          </div>

          {families.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {families.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setSelectedId(f.id)}
                  className={`rounded-md border-2 px-3 py-2 text-sm font-bold ${
                    selectedId === f.id
                      ? 'border-brand bg-brand text-white'
                      : 'border-slate-900 bg-white'
                  }`}
                >
                  {f.name} ({f.memberCount})
                </button>
              ))}
            </div>
          )}

          {dashboard && (
            <div className="block-panel space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-black uppercase text-brand">Household total</p>
                  <p className="text-3xl font-black text-slate-900">{dashboard.household.totalKg} kg</p>
                  <p className="text-sm font-medium text-slate-600">
                    {dashboard.family.memberCount} members · avg{' '}
                    {dashboard.household.perPersonAvgKg} kg/person
                  </p>
                </div>
                <button
                  type="button"
                  className="btn-secondary !min-h-10 !px-2 text-xs"
                  onClick={() => copyCode(dashboard.family.joinCode)}
                  aria-label={`Copy family join code ${dashboard.family.joinCode}`}
                >
                  <Copy className="h-3.5 w-3.5" aria-hidden />
                  {dashboard.family.joinCode}
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { l: 'Fuel', v: dashboard.household.scope1 },
                  { l: 'Power', v: dashboard.household.scope2 },
                  { l: 'Travel', v: dashboard.household.scope3 },
                ].map(({ l, v }) => (
                  <div key={l} className="rounded-md border-2 border-slate-900 bg-slate-50 p-2 text-center">
                    <p className="font-black">{v.toFixed(1)}</p>
                    <p className="text-[10px] font-bold uppercase">{l}</p>
                  </div>
                ))}
              </div>

              <p className="text-sm font-medium text-slate-600">
                {dashboard.household.vsFairSharePct}% of household fair share ({dashboard.household.fairShareKg}{' '}
                kg) · Top driver: {dashboard.household.topDriver}
                {dashboard.yourSharePct != null && ` · You: ${dashboard.yourSharePct}% of total`}
              </p>

              <div>
                <p className="block-label mb-2">Each member</p>
                <ul className="space-y-2">
                  {dashboard.members.map((m) => (
                    <li
                      key={m.userId}
                      className={`flex items-center justify-between rounded-md border-2 px-3 py-2.5 ${
                        m.isYou ? 'border-brand bg-emerald-50' : 'border-slate-900 bg-white'
                      }`}
                    >
                      <div>
                        <p className="text-sm font-black text-slate-900">
                          {m.name}
                          {m.isYou && ' (you)'}
                        </p>
                        <p className="text-xs font-medium text-slate-600">
                          {m.role.toLowerCase()} · {m.tripCount} trips · {m.orderCount} orders
                        </p>
                      </div>
                      <p className="text-sm font-black text-brand">{m.co2TotalKg} kg</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {families.length === 0 && !dashboard && (
            <div className="block-panel flex flex-col items-center py-8 text-center">
              <Home className="h-8 w-8 text-slate-400" aria-hidden />
              <p className="mt-3 font-black text-slate-800">No family yet</p>
              <p className="mt-1 max-w-xs text-sm font-medium text-slate-600">
                Create a household and invite family with a join code to see combined footprint.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
