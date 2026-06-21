import { useState } from 'react'
import { MapPin, Navigation, Play, Square, Plus } from 'lucide-react'
import { api } from '../lib/api'
import {
  getTripDistanceKm,
  isTracking,
  queueOfflineTrip,
  startTripTracking,
  stopTripTracking,
  type GpsPoint,
} from '../lib/geolocation/tripDetector'
import type { TripResponse, ActionReward } from '@carbon/shared'
import { CelebrationBanner } from '../components/rewards'
import { useAuth } from '../lib/auth'
import { usePageLoad } from '../lib/usePageLoad'
import { PageHeader, EmptyState, LoadingScreen } from '../components/ui'
import { BlockGrid, BlockOption, BlockSection } from '../components/BlockOption'
import { useRadioGroup } from '../lib/useRadioGroup'
import { TRANSPORT_MODES, getModeInfo, ModeIcon } from '../lib/transportModes'

export function TripsPage() {
  const { user } = useAuth()
  const { data: trips, loading, error: loadError, reload: load } = usePageLoad(() =>
    api<TripResponse[]>('/trips')
  )
  const [tracking, setTracking] = useState(isTracking())
  const [points, setPoints] = useState<GpsPoint[]>([])
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [selectedMode, setSelectedMode] = useState<string>('METRO')
  const [vehicleId, setVehicleId] = useState('')
  const [lastReward, setLastReward] = useState<ActionReward | null>(null)
  const [manual, setManual] = useState({ distanceKm: 5, mode: 'METRO' })
  const [gpsError, setGpsError] = useState<string | null>(null)
  const [offlineMsg, setOfflineMsg] = useState<string | null>(null)
  const modeIds = TRANSPORT_MODES.map((m) => m.id)
  const { onKeyDown: onModeKeyDown } = useRadioGroup(selectedMode, modeIds, setSelectedMode)

  const handleStart = async () => {
    setGpsError(null)
    try {
      await startTripTracking(setPoints)
      setTracking(true)
    } catch {
      setGpsError('Location access is needed to track your trip. Please allow GPS in your browser settings.')
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
      setOfflineMsg('Saved offline. It will sync when you are back online.')
    }
  }

  const confirmTrip = async (id: string) => {
    const res = await api<TripResponse & { reward?: ActionReward | null }>(`/trips/${id}/confirm`, {
      method: 'PATCH',
      body: JSON.stringify({
        confirmedMode: selectedMode,
        vehicleId: vehicleId || undefined,
        isCommute: true,
      }),
    })
    setConfirmId(null)
    if (res.reward) setLastReward(res.reward)
    load()
  }

  const addManual = async () => {
    const now = new Date()
    const start = new Date(now.getTime() - 30 * 60000)
    const res = await api<TripResponse & { reward?: ActionReward | null }>('/trips/manual', {
      method: 'POST',
      body: JSON.stringify({
        startedAt: start.toISOString(),
        endedAt: now.toISOString(),
        distanceKm: manual.distanceKm,
        confirmedMode: manual.mode,
        isCommute: true,
      }),
    })
    if (res.reward) setLastReward(res.reward)
    load()
  }

  const pendingId = confirmId ?? (trips ?? []).find((t) => !t.confirmedMode)?.id

  if (loading) return <LoadingScreen label="Loading trips…" />

  return (
    <div className="space-y-5">
      {loadError && (
        <p className="rounded-md border-2 border-red-600 bg-red-50 px-3 py-2 text-sm font-medium text-red-800" role="alert">
          {loadError}
        </p>
      )}
      <PageHeader
        icon={MapPin}
        iconBg="bg-indigo-100"
        iconColor="text-indigo-700"
        title="Travel & commute"
        subtitle="Record how you got from place to place"
        help="Tip: Press Start when you begin travelling, and Stop when you arrive. We will ask how you travelled — bus, metro, car, etc."
      />

      {lastReward && <CelebrationBanner reward={lastReward} />}

      {gpsError && (
        <p className="rounded-md border-2 border-red-600 bg-red-50 px-3 py-2 text-sm font-medium text-red-800" role="alert">
          {gpsError}
        </p>
      )}
      {offlineMsg && (
        <p className="rounded-md border-2 border-amber-500 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-950" role="status">
          {offlineMsg}
        </p>
      )}

      <div className={`card ${tracking ? 'border-2 border-brand ring-4 ring-brand/10' : ''}`} aria-describedby="page-help-text">
        <div className="flex items-center gap-3">
          <div className={`icon-circle ${tracking ? 'bg-brand' : 'bg-indigo-100'}`}>
            <Navigation className={`h-7 w-7 ${tracking ? 'text-white' : 'text-indigo-700'}`} aria-hidden />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {tracking ? 'Tracking your trip…' : 'Live GPS tracking'}
            </h2>
            <p className="text-sm text-slate-500" aria-live="polite">
              Distance so far: <strong>{getTripDistanceKm(points).toFixed(1)} km</strong>
            </p>
          </div>
        </div>
        <div className="mt-4 flex gap-3">
          {!tracking ? (
            <button type="button" className="btn-primary flex-1" onClick={handleStart}>
              <Play className="h-5 w-5" aria-hidden /> Start trip
            </button>
          ) : (
            <button type="button" className="btn-danger flex-1" onClick={handleStop}>
              <Square className="h-5 w-5" aria-hidden /> Stop trip
            </button>
          )}
        </div>
      </div>

      {pendingId && (
        <div className="card border-2 border-brand/30 bg-brand-muted/50" role="status" aria-live="polite">
          <BlockSection label="How did you travel?" labelId="confirm-mode-label">
            <p id="confirm-mode-hint" className="hint mb-2">Tap the option that best matches your trip</p>
            <BlockGrid labelledBy="confirm-mode-label" onKeyDown={onModeKeyDown} aria-describedby="confirm-mode-hint">
              {TRANSPORT_MODES.map((m) => {
                const Icon = m.icon
                return (
                  <BlockOption
                    key={m.id}
                    selected={selectedMode === m.id}
                    onClick={() => setSelectedMode(m.id)}
                    compact
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                    {m.label}
                  </BlockOption>
                )
              })}
            </BlockGrid>
          </BlockSection>
          {user?.vehicles?.length ? (
            <div className="mt-4">
              <label className="label" htmlFor="vehicle">Your vehicle (optional)</label>
              <select
                id="vehicle"
                className="input"
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
              >
                <option value="">Not applicable</option>
                {user.vehicles.map((v) => (
                  <option key={v.id} value={v.id}>{v.label}</option>
                ))}
              </select>
            </div>
          ) : null}
          <button type="button" className="btn-primary mt-4 w-full" onClick={() => confirmTrip(pendingId)}>
            Save my answer
          </button>
        </div>
      )}

      <div className="card">
        <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
          <Plus className="h-5 w-5 text-brand" aria-hidden />
          Add trip manually
        </h3>
        <p className="hint mb-4">If you already know the distance and how you travelled</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="distance">Distance (km)</label>
            <input
              id="distance"
              className="input"
              type="number"
              min={0.1}
              step={0.1}
              value={manual.distanceKm}
              onChange={(e) => setManual({ ...manual, distanceKm: +e.target.value })}
            />
          </div>
          <div>
            <label className="label" htmlFor="mode">How you travelled</label>
            <select
              id="mode"
              className="input"
              value={manual.mode}
              onChange={(e) => setManual({ ...manual, mode: e.target.value })}
            >
              {TRANSPORT_MODES.map((m) => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
          </div>
        </div>
        <button type="button" className="btn-secondary mt-4 w-full" onClick={addManual}>
          Add this trip
        </button>
      </div>

      <h2 className="section-title">Past trips</h2>
      {(!trips || trips.length === 0) ? (
        <EmptyState
          icon={MapPin}
          title="No trips yet"
          message="Start GPS tracking or add a trip manually. Your travel history will show here."
        />
      ) : (
        <div className="space-y-3">
          {(trips ?? []).map((t) => {
            const mode = getModeInfo(t.confirmedMode ?? t.suggestedMode)
            return (
              <div key={t.id} className="card flex gap-4">
                <div className="icon-circle bg-slate-100">
                  <ModeIcon mode={mode.id} className="h-6 w-6 text-slate-700" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between gap-2">
                    <p className="font-bold text-slate-900">{mode.label}</p>
                    <p className="font-semibold text-brand">{t.distanceKm.toFixed(1)} km</p>
                  </div>
                  <p className="text-sm text-slate-500">
                    {new Date(t.startedAt).toLocaleDateString(undefined, {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                    })}
                  </p>
                  {!t.confirmedMode && (
                    <span className="mt-2 inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                      Needs confirmation
                    </span>
                  )}
                  {t.co2eKg != null && (
                    <p className="mt-1 text-sm font-medium text-slate-700">
                      {t.co2eKg.toFixed(2)} kg CO₂
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
