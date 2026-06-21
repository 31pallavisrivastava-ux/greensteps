import { useEffect, useState } from 'react'
import { Settings } from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { CityPicker } from '../components/CityPicker'
import { BlockGrid, BlockOption, BlockSection } from '../components/BlockOption'
import { PageHeader } from '../components/ui'
import type { TopConcern, TransportPreference } from '@carbon/shared'

const TRANSPORT_OPTIONS: { id: TransportPreference; label: string }[] = [
  { id: 'CAR', label: 'Car / bike' },
  { id: 'BUS_METRO', label: 'Bus / metro' },
  { id: 'WALK_CYCLE', label: 'Walk / cycle' },
  { id: 'MIXED', label: 'Mixed' },
]

const CONCERN_OPTIONS: { id: TopConcern; label: string }[] = [
  { id: 'POWER', label: 'Electricity' },
  { id: 'TRAVEL', label: 'Commute' },
  { id: 'DELIVERY', label: 'Delivery' },
  { id: 'PLASTIC', label: 'Plastic' },
]

export function SettingsPage() {
  const { user, refreshUser } = useAuth()
  const [city, setCity] = useState(user?.city ?? '')
  const [transport, setTransport] = useState<TransportPreference>(user?.transportPreference ?? 'MIXED')
  const [concern, setConcern] = useState<TopConcern>(user?.topConcern ?? 'POWER')
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) {
      setCity(user.city ?? '')
      setTransport(user.transportPreference ?? 'MIXED')
      setConcern(user.topConcern ?? 'POWER')
    }
  }, [user])

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!city) {
      setError('Please select a city')
      return
    }
    setError('')
    try {
      await api('/users/me', {
        method: 'PATCH',
        body: JSON.stringify({ city, transportPreference: transport, topConcern: concern }),
      })
      await refreshUser()
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        icon={Settings}
        iconBg="bg-slate-100"
        iconColor="text-slate-700"
        title="Settings"
        subtitle="Tap blocks to update your preferences"
      />

      <form onSubmit={save} className="block-panel space-y-5">
        <CityPicker value={city} onChange={setCity} />
        <p className="hint -mt-2">CEA grid factor region and AQI nudges</p>

        <BlockSection label="Usual transport" labelId="settings-transport-label">
          <BlockGrid labelledBy="settings-transport-label">
            {TRANSPORT_OPTIONS.map((o) => (
              <BlockOption
                key={o.id}
                selected={transport === o.id}
                onClick={() => setTransport(o.id)}
                compact
              >
                {o.label}
              </BlockOption>
            ))}
          </BlockGrid>
        </BlockSection>

        <BlockSection label="Top concern" labelId="settings-concern-label">
          <BlockGrid labelledBy="settings-concern-label">
            {CONCERN_OPTIONS.map((o) => (
              <BlockOption
                key={o.id}
                selected={concern === o.id}
                onClick={() => setConcern(o.id)}
                compact
              >
                {o.label}
              </BlockOption>
            ))}
          </BlockGrid>
          <p className="hint mt-2">Drives your &quot;Do this today&quot; card</p>
        </BlockSection>

        <button type="submit" className="btn-primary w-full" disabled={!city} aria-live="polite">
          {saved ? 'Saved!' : 'Save settings'}
        </button>
        {saved && (
          <p role="status" className="text-sm font-bold text-brand">
            Settings saved successfully.
          </p>
        )}
        {error && (
          <p
            role="alert"
            className="rounded-md border-2 border-red-600 bg-red-50 px-3 py-2 text-sm font-bold text-red-700"
          >
            {error}
          </p>
        )}
      </form>
    </div>
  )
}
