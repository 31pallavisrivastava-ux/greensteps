import { useEffect, useState } from 'react'
import { Copy, GraduationCap, Plus, Trophy, Users } from 'lucide-react'
import { api } from '../lib/api'
import type { ClassGroupSummary, ClassLeaderboard } from '@carbon/shared'

export function ClassPage() {
  const [groups, setGroups] = useState<ClassGroupSummary[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [board, setBoard] = useState<ClassLeaderboard | null>(null)
  const [newName, setNewName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  const loadGroups = () =>
    api<ClassGroupSummary[]>('/groups')
      .then((g) => {
        setGroups(g)
        if (g.length > 0 && !selectedId) setSelectedId(g[0].id)
      })
      .catch(console.error)
      .finally(() => setLoading(false))

  useEffect(() => {
    loadGroups()
  }, [])

  useEffect(() => {
    if (!selectedId) {
      setBoard(null)
      return
    }
    api<ClassLeaderboard>(`/groups/${selectedId}/leaderboard`).then(setBoard).catch(console.error)
  }, [selectedId])

  const createGroup = async () => {
    if (newName.trim().length < 2) return
    const g = await api<ClassGroupSummary>('/groups', {
      method: 'POST',
      body: JSON.stringify({ name: newName.trim() }),
    })
    setNewName('')
    setShowCreate(false)
    setMsg(`Created! Code: ${g.joinCode}`)
    await loadGroups()
    setSelectedId(g.id)
  }

  const joinGroup = async () => {
    const g = await api<{ id: string; joinCode: string; name: string }>('/groups/join', {
      method: 'POST',
      body: JSON.stringify({ joinCode: joinCode.trim() }),
    })
    setJoinCode('')
    setMsg(`Joined ${g.name}`)
    await loadGroups()
    setSelectedId(g.id)
  }

  if (loading) {
    return <p className="py-16 text-center text-sm text-slate-500">Loading…</p>
  }

  return (
    <div className="page-stack">
      <div>
        <h1 className="page-title">Class</h1>
        <p className="page-sub">Compete on CO₂ saved this week</p>
      </div>

      {msg && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-center text-sm font-medium text-emerald-800">
          {msg}
        </p>
      )}

      <div className="flex gap-2">
        <button type="button" className="btn-primary flex-1" onClick={() => setShowCreate((v) => !v)}>
          <Plus className="h-4 w-4" aria-hidden />
          Create
        </button>
        <div className="flex flex-1 gap-2">
          <input
            className="input !min-h-11 flex-1 uppercase"
            placeholder="Join code"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
          />
          <button type="button" className="btn-secondary !px-3" onClick={joinGroup}>
            <Users className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>

      {showCreate && (
        <div className="card space-y-2">
          <input
            className="input"
            placeholder="Class name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <button type="button" className="btn-primary w-full" onClick={createGroup}>
            Create class
          </button>
        </div>
      )}

      {groups.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {groups.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => setSelectedId(g.id)}
              className={`chip ${selectedId === g.id ? 'chip-active' : 'chip-inactive'}`}
            >
              {g.name}
            </button>
          ))}
        </div>
      )}

      {board && (
        <div className="card !p-0 overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div>
              <p className="font-semibold text-slate-900">{board.group.name}</p>
              <p className="text-xs text-slate-500">Code {board.group.joinCode}</p>
            </div>
            <button
              type="button"
              className="flex items-center gap-1 text-xs font-semibold text-brand"
              onClick={() => {
                navigator.clipboard.writeText(board.group.joinCode)
                setMsg('Code copied')
              }}
            >
              <Copy className="h-3.5 w-3.5" aria-hidden />
              Copy
            </button>
          </div>

          {board.yourRank != null && (
            <div className="flex items-center gap-2 border-b border-slate-100 bg-brand-muted/50 px-4 py-2 text-sm font-semibold text-brand">
              <Trophy className="h-4 w-4" aria-hidden />
              You&apos;re #{board.yourRank} this week
            </div>
          )}

          <ol className="divide-y divide-slate-100">
            {board.leaderboard.map((entry) => (
              <li
                key={entry.userId}
                className={`flex items-center gap-3 px-4 py-2.5 ${entry.isYou ? 'bg-slate-50' : ''}`}
              >
                <span className="w-6 text-center text-sm font-bold text-slate-400">{entry.rank}</span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-900">
                  {entry.name}{entry.isYou && ' · you'}
                </span>
                <span className="text-sm font-semibold text-emerald-700">+{entry.co2SavedKg}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {groups.length === 0 && !showCreate && (
        <div className="card py-8 text-center">
          <GraduationCap className="mx-auto h-8 w-8 text-slate-300" aria-hidden />
          <p className="mt-2 text-sm text-slate-500">Create or join a class to get started</p>
        </div>
      )}
    </div>
  )
}
