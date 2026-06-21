import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Leaf, Lock, Mail, User } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { SkipLink } from '../components/SkipLink'
import { usePageTitle } from '../lib/usePageTitle'
import { HeroEarthIllustration } from '../components/visuals/Illustrations'

export function LoginPage() {
  const { user, loading, login, register } = useAuth()
  usePageTitle()
  const [email, setEmail] = useState('demo@carbon.local')
  const [password, setPassword] = useState('demo1234')
  const [isRegister, setIsRegister] = useState(false)
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      if (isRegister) await register(email, password, name)
      else await login(email, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div
        className="flex min-h-dvh items-center justify-center bg-brand-muted text-lg text-slate-600"
        role="status"
        aria-live="polite"
      >
        Opening app…
      </div>
    )
  }

  if (user) {
    return <Navigate to={user.onboardingCompleted === true ? '/' : '/onboarding'} replace />
  }

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-slate-100 p-5">
      <SkipLink />
      <div className="pointer-events-none absolute -right-8 top-12 opacity-40">
        <HeroEarthIllustration className="h-40 w-40" />
      </div>
      <div className="pointer-events-none absolute -left-10 bottom-24 opacity-30">
        <HeroEarthIllustration className="h-32 w-32" />
      </div>
      <main id="main-content" className="relative w-full max-w-md" tabIndex={-1}>
      <div className="mb-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-md border-2 border-slate-900 bg-brand">
          <Leaf className="h-8 w-8 text-white" strokeWidth={2} aria-hidden />
        </div>
        <p className="mt-5 text-sm font-bold uppercase tracking-wide text-brand">GreenSteps</p>
        <h1 className="mt-2 text-2xl font-black text-slate-900">
          {isRegister ? 'Create your account' : 'Sign in'}
        </h1>
        <p className="mt-2 max-w-xs text-base font-medium leading-relaxed text-slate-600">
          Track travel, electricity, deliveries, and plastic — for a cleaner planet.
        </p>
      </div>

      <form onSubmit={submit} className="card-soft space-y-5">
        <h2 className="sr-only">{isRegister ? 'Registration form' : 'Sign in form'}</h2>

        {isRegister && (
          <div>
            <label className="label" htmlFor="name">
              <span className="flex items-center gap-2">
                <User className="h-5 w-5 text-brand" aria-hidden /> Your name
              </span>
            </label>
            <input
              id="name"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Priya"
              autoComplete="name"
            />
          </div>
        )}

        <div>
          <label className="label" htmlFor="email">
            <span className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-brand" aria-hidden /> Email address
            </span>
          </label>
          <input
            id="email"
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            autoComplete="email"
            required
          />
        </div>

        <div>
          <label className="label" htmlFor="password">
            <span className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-brand" aria-hidden /> Password
            </span>
          </label>
          <input
            id="password"
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={isRegister ? 'At least 8 characters' : 'Your password'}
            autoComplete={isRegister ? 'new-password' : 'current-password'}
            minLength={isRegister ? 8 : undefined}
            required
          />
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-md border-2 border-red-600 bg-red-50 px-4 py-3 text-sm font-bold text-red-800"
          >
            {error}
          </div>
        )}

        <button type="submit" className="btn-primary w-full" disabled={submitting}>
          {submitting ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'}
        </button>

        <button
          type="button"
          className="w-full text-center text-base font-medium text-brand underline-offset-2 hover:underline"
          onClick={() => setIsRegister(!isRegister)}
        >
          {isRegister ? 'Already have an account? Sign in' : 'New here? Create an account'}
        </button>

        <div className="rounded-xl bg-brand-muted px-4 py-3 text-center text-sm text-slate-600">
          <p className="font-semibold text-brand">Try the demo</p>
          <p className="mt-1">Email: demo@carbon.local</p>
          <p>Password: demo1234</p>
        </div>
      </form>
      </main>
    </div>
  )
}
