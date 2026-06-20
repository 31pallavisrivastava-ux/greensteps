import { useEffect, useState } from 'react'
import { Play, Square } from 'lucide-react'
import { api } from '../lib/api'
import {
  getTripDistanceKm,
  isTracking,
  queueOfflineTrip,
  startTripTracking,
  stopTripTracking,
  type GpsPoint,
} from '../lib/geolocation/tripDetector'
import type { TripResponse } from '@carbon/shared'
import { useAuth } from '../lib/auth'

const MODES = ['WALK', 'CYCLE', 'BUS', 'METRO', 'CAR', 'BIKE', 'TAXI', 'AUTO'] as const

export function TripsPage() {
  const { user } = useAuth()
  const [trips, setTrips] = useState<TripResponse[]>([])
  const [tracking, setTracking] = useState(isTracking())
  const [points, setPoints] = useState<GpsPoint[]>([])
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [selectedMode, setSelectedMode] = useState<string>('CAR')
  const [vehicleId, setVehicleId] = useState('')
  const [manual, setManual] = useState({ distanceKm: 5, mode: 'METRO' })

  const load = () => api<TripResponse[]>('/trips').then(setTrips).catch(console.error)
  useEffect(() => { load() }, [])

  const handleStart = async () => {
    try {
      await startTripTracking(setPoints)
      setTracking(true)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'GPS failed')
    }
  }

  const handleStop = async () => {
    const result = stopTripTracking()
    setTracking(false)
    setPoints([])
    const payload = {
      points: result.points,
      startedAt: result.startedAt?.toISOString() ?? new Date().toISOString(),
      endedAt: result.endedAt.toISOString(),
      distanceKm: result.distanceKm,
      isCommute: true,
    }
    try {
      const trip = await api<TripResponse>('/trips/draft', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      setConfirmId(trip.id)
      load()
    } catch {
      await queueOfflineTrip(payload)
      alert('Saved offline — will sync when online')
    }
  }

  const confirmTrip = async (id: string) => {
    await api(`/trips/${id}/confirm`, {
      method: 'PATCH',
      body: JSON.stringify({
        confirmedMode: selectedMode,
        vehicleId: vehicleId || undefined,
        isCommute: true,
      }),
    })
    setConfirmId(null)
    load()
  }

  const addManual = async () => {
    const now = new Date()
    const start = new Date(now.getTime() - 30 * 60000)
    await api('/trips/manual', {
      method: 'POST',
      body: JSON.stringify({
        startedAt: start.toISOString(),
        endedAt: now.toISOString(),
        distanceKm: manual.distanceKm,
        confirmedMode: manual.mode,
        isCommute: true,
      }),
    })
    load()
  }

  return (
    <div className="space-y-4">
      <div className="card">
        <h2 className="font-semibold text-brand">GPS commute tracking</h2>
        <p className="mt-1 text-xs text-slate-500">
          Foreground tracking · {points.length} points · {getTripDistanceKm(points).toFixed(2)} km
        </p>
        <div className="mt-3 flex gap-2">
          {!tracking ? (
            <button className="btn-primary flex items-center gap-2" onClick={handleStart}>
              <Play className="h-4 w-4" /> Start trip
            </button>
          ) : (
            <button className="btn-primary flex items-center gap-2 bg-red-700" onClick={handleStop}>
              <Square className="h-4 w-4" /> Stop & save
            </button>
          )}
        </div>
      </div>

      {(confirmId || trips.some((t) => !t.confirmedMode)) && (
        <div className="card border-brand/30">
          <h3 className="text-sm font-semibold">Confirm transport mode</h3>
          <p className="text-xs text-slate-500">Public vs private classification</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {MODES.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setSelectedMode(m)}
                className={`rounded-full px-3 py-1 text-xs ${
                  selectedMode === m ? 'bg-brand text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
          {user?.vehicles?.length ? (
            <select
              className="input mt-2"
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
            >
              <option value="">No vehicle</option>
              {user.vehicles.map((v) => (
                <option key={v.id} value={v.id}>{v.label}</option>
              ))}
            </select>
          ) : null}
          <button
            className="btn-primary mt-3"
            onClick={() => confirmTrip(confirmId ?? trips.find((t) => !t.confirmedMode)!.id)}
          >
            Confirm mode
          </button>
        </div>
      )}

      <div className="card">
        <h3 className="text-sm font-semibold">Manual trip</h3>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <div>
            <label className="label">Distance (km)</label>
            <input
              className="input"
              type="number"
              value={manual.distanceKm}
              onChange={(e) => setManual({ ...manual, distanceKm: +e.target.value })}
            />
          </div>
          <div>
            <label className="label">Mode</label>
            <select
              className="input"
              value={manual.mode}
              onChange={(e) => setManual({ ...manual, mode: e.target.value })}
            >
              {MODES.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>
        <button className="btn-secondary mt-2 w-full" onClick={addManual}>
          Add manual trip
        </button>
      </div>

      <h2 className="text-sm font-semibold">Recent trips</h2>
      <div className="space-y-2">
        {trips.map((t) => (
          <div key={t.id} className="card text-sm">
            <div className="flex justify-between">
              <span className="font-medium">
                {t.confirmedMode ?? t.suggestedMode}
                {!t.confirmedMode && (
                  <span className="ml-1 text-xs text-amber-600">(unconfirmed)</span>
                )}
              </span>
              <span className="text-slate-500">{t.distanceKm.toFixed(1)} km</span>
            </div>
            <div className="mt-1 flex justify-between text-xs text-slate-500">
              <span>{new Date(t.startedAt).toLocaleDateString()}</span>
              <span>{t.co2eKg != null ? `${t.co2eKg.toFixed(2)} kg CO₂e` : '—'}</span>
            </div>
            {t.transportCategory && (
              <span className="mt-1 inline-block rounded bg-slate-100 px-2 py-0.5 text-xs">
                {t.transportCategory}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
