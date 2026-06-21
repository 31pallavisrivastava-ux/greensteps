import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { CityPicker } from '../components/CityPicker'
import { BlockGrid, BlockOption, BlockSection } from '../components/BlockOption'
import { SkipLink } from '../components/SkipLink'
import { usePageTitle } from '../lib/usePageTitle'
import type { TopConcern, TransportPreference, UserProfile } from '@carbon/shared'

const STEP_KEY = 'greensteps_onboarding_step'

const TRANSPORT_OPTIONS: { id: TransportPreference; label: string; emoji: string }[] = [
  { id: 'CAR', label: 'Mostly car or bike', emoji: '🚗' },
  { id: 'BUS_METRO', label: 'Bus or metro', emoji: '🚇' },
  { id: 'WALK_CYCLE', label: 'Walk or cycle', emoji: '🚶' },
  { id: 'MIXED', label: 'Mix of everything', emoji: '🔀' },
]

const CONCERN_OPTIONS: { id: TopConcern; label: string; emoji: string }[] = [
  { id: 'POWER', label: 'Electricity & AC bills', emoji: '⚡' },
  { id: 'TRAVEL', label: 'Commute & fuel', emoji: '🚌' },
  { id: 'DELIVERY', label: 'Swiggy, Zepto, Amazon', emoji: '📦' },
  { id: 'PLASTIC', label: 'Plastic & waste', emoji: '♻️' },
]

function readSavedStep() {
  try {
    const n = Number(sessionStorage.getItem(STEP_KEY))
    return n >= 0 && n <= 2 ? n : 0
  } catch {
    return 0
  }
}

export function OnboardingPage() {
  const { user, setUserProfile } = useAuth()
  const navigate = useNavigate()
  usePageTitle()
  const headingRef = useRef<HTMLHeadingElement>(null)
  const [step, setStep] = useState(readSavedStep)
  const [city, setCity] = useState(user?.city ?? '')
  const [transport, setTransport] = useState<TransportPreference>(user?.transportPreference ?? 'MIXED')
  const [concern, setConcern] = useState<TopConcern>(user?.topConcern ?? 'POWER')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    sessionStorage.setItem(STEP_KEY, String(step))
    headingRef.current?.focus()
  }, [step])

  useEffect(() => {
    if (user?.city) setCity(user.city)
    if (user?.transportPreference) setTransport(user.transportPreference)
    if (user?.topConcern) setConcern(user.topConcern)
  }, [user?.city, user?.transportPreference, user?.topConcern])

  if (user?.onboardingCompleted === true) {
    sessionStorage.removeItem(STEP_KEY)
    return <Navigate to="/" replace />
  }

  const goToStep = (next: number) => {
    setError('')
    setStep(next)
  }

  const pickCity = (name: string) => {
    setCity(name)
    goToStep(1)
  }

  const pickTransport = (mode: TransportPreference) => {
    setTransport(mode)
    goToStep(2)
  }

  const finish = async () => {
    if (!city) {
      setError('Please select your city')
      goToStep(0)
      return
    }
    setSaving(true)
    setError('')
    try {
      const updated = await api<UserProfile>('/users/me', {
        method: 'PATCH',
        body: JSON.stringify({
          city,
          transportPreference: transport,
          topConcern: concern,
          onboardingCompleted: true,
        }),
      })
      sessionStorage.removeItem(STEP_KEY)
      setUserProfile({ ...updated, onboardingCompleted: true })
      navigate('/', { replace: true })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save — try again')
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const titles = [
    { title: 'Where do you live?', subtitle: 'Tap your city block to continue.' },
    { title: 'How do you usually travel?', subtitle: 'Pick one block below.' },
    { title: 'What matters most?', subtitle: 'Pick a focus for your daily action.' },
  ]

  const { title, subtitle } = titles[step]

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col bg-slate-100">
      <SkipLink />
      <main id="main-content" className="flex flex-1 flex-col" tabIndex={-1}>
      <div className="flex-1 overflow-y-auto px-4 pb-28 pt-6">
        <div className="block-panel mb-4 !py-3">
          <p className="text-xs font-bold uppercase tracking-wider text-brand">GreenSteps setup</p>
        </div>

        <ol className="block-stepper mb-6 list-none" aria-label="Setup progress">
          {[0, 1, 2].map((i) => (
            <li
              key={i}
              aria-current={i === step ? 'step' : undefined}
              className={`block-step ${i === step ? 'block-step-active' : i < step ? 'block-step-done' : ''}`}
            >
              <span className="sr-only">Step {i + 1}</span>
              {i + 1}
            </li>
          ))}
        </ol>

        <p className="sr-only" aria-live="polite" aria-atomic="true">
          Step {step + 1} of 3: {title}
        </p>

        <h1 ref={headingRef} tabIndex={-1} className="text-2xl font-black text-slate-900">
          {title}
        </h1>
        <p className="mt-2 text-sm font-medium text-slate-600">{subtitle}</p>

        <div className="mt-6 space-y-4">
          {step === 0 && <CityPicker id="onboard-city" value={city} onChange={pickCity} />}

          {step === 1 && (
            <BlockSection label="Transport" labelId="transport-label">
              <BlockGrid labelledBy="transport-label">
                {TRANSPORT_OPTIONS.map((opt) => (
                  <BlockOption
                    key={opt.id}
                    selected={transport === opt.id}
                    onClick={() => pickTransport(opt.id)}
                  >
                    <span className="text-xl" aria-hidden>
                      {opt.emoji}
                    </span>
                    <span>{opt.label}</span>
                  </BlockOption>
                ))}
              </BlockGrid>
            </BlockSection>
          )}

          {step === 2 && (
            <BlockSection label="Top concern" labelId="concern-label">
              <BlockGrid labelledBy="concern-label">
                {CONCERN_OPTIONS.map((opt) => (
                  <BlockOption
                    key={opt.id}
                    selected={concern === opt.id}
                    onClick={() => setConcern(opt.id)}
                  >
                    <span className="text-xl" aria-hidden>
                      {opt.emoji}
                    </span>
                    <span>{opt.label}</span>
                  </BlockOption>
                ))}
              </BlockGrid>
            </BlockSection>
          )}
        </div>

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-md border-2 border-red-600 bg-red-50 px-3 py-2 text-sm font-bold text-red-700"
          >
            {error}
          </p>
        )}
      </div>

      <div className="block-action-bar">
        <div className="mx-auto flex max-w-lg gap-3">
          {step > 0 && (
            <button type="button" className="btn-secondary flex-1" onClick={() => goToStep(step - 1)}>
              Back
            </button>
          )}
          {step === 0 && (
            <button
              type="button"
              className="btn-primary flex-1"
              disabled={!city}
              onClick={() => goToStep(1)}
            >
              Continue
            </button>
          )}
          {step === 1 && (
            <button type="button" className="btn-primary flex-1" onClick={() => goToStep(2)}>
              Continue
            </button>
          )}
          {step === 2 && (
            <button type="button" className="btn-primary flex-1" disabled={saving} onClick={finish}>
              {saving ? 'Saving…' : 'Start tracking'}
            </button>
          )}
        </div>
      </div>
      </main>
    </div>
  )
}
