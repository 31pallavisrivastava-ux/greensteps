import { useEffect, useState } from 'react'
import { Settings } from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { useSaveFeedback } from '../lib/useSaveFeedback'
import { useSubmit } from '../lib/useSubmit'
import { CityPicker } from '../components/CityPicker'
import { BlockGrid, BlockOption, BlockSection } from '../components/BlockOption'
import { PageHeader } from '../components/ui'
import type { TopConcern, TransportPreference } from '@carbon/shared'

import { useRadioGroup } from '../lib/useRadioGroup'

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
  const { saved, markSaved } = useSaveFeedback(2000)
  const { submitting, error: submitError, run: runSubmit } = useSubmit()
  const [error, setError] = useState('')

  const transportIds = TRANSPORT_OPTIONS.map((o) => o.id)
  const concernIds = CONCERN_OPTIONS.map((o) => o.id)
  const { onKeyDown: onTransportKeyDown } = useRadioGroup(transport, transportIds, setTransport)
  const { onKeyDown: onConcernKeyDown } = useRadioGroup(concern, concernIds, setConcern)

  useEffect(() => {
    if (user) {
      setCity(user.city ?? '')
      setTransport(user.transportPreference ?? 'MIXED')
      setConcern(user.topConcern ?? 'POWER')
    }
  }, [user])

  const save = (e: React.FormEvent) => {
    e.preventDefault()
    if (!city) {
      setError('Please select a city')
      return
    }
    void runSubmit(async () => {
      await api('/users/me', {
        method: 'PATCH',
        body: JSON.stringify({ city, transportPreference: transport, topConcern: concern }),
      })
      await refreshUser()
      markSaved()
      setError('')
    })
  }

  const displayError = error || submitError

  return (
    <div className="space-y-5">
      <PageHeader
        icon={Settings}
        iconBg="bg-slate-100"
        iconColor="text-slate-700"
        title="Settings"
        subtitle="Tap blocks to update your preferences"
      />

      <form onSubmit={save} className="block-panel space-y-5" aria-describedby="city-hint">
        <CityPicker value={city} onChange={setCity} />
        <p id="city-hint" className="hint -mt-2">CEA grid factor region and AQI nudges</p>

        <BlockSection label="Usual transport" labelId="settings-transport-label">
          <BlockGrid labelledBy="settings-transport-label" onKeyDown={onTransportKeyDown}>
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
          <BlockGrid labelledBy="settings-concern-label" onKeyDown={onConcernKeyDown} aria-describedby="concern-hint">
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
          <p id="concern-hint" className="hint mt-2">Drives your &quot;Do this today&quot; card</p>
        </BlockSection>

        <button type="submit" className="btn-primary w-full" disabled={!city || submitting} aria-live="polite">
          {saved ? 'Saved!' : submitting ? 'Saving…' : 'Save settings'}
        </button>
        {saved && (
          <p role="status" className="text-sm font-bold text-brand">
            Settings saved successfully.
          </p>
        )}
        {displayError && (
          <p
            role="alert"
            className="rounded-md border-2 border-red-600 bg-red-50 px-3 py-2 text-sm font-bold text-red-700"
          >
            {displayError}
          </p>
        )}
      </form>
    </div>
  )
}
