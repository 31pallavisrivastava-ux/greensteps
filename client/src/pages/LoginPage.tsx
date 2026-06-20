import { useState } from 'react'
import { useAuth } from '../lib/auth'

export function LoginPage() {
  const { login, register } = useAuth()
  const [email, setEmail] = useState('demo@carbon.local')
  const [password, setPassword] = useState('demo1234')
  const [isRegister, setIsRegister] = useState(false)
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (isRegister) await register(email, password, name)
      else await login(email, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Auth failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-brand-muted p-4">
      <form onSubmit={submit} className="card w-full max-w-sm space-y-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-brand">Carbon Footprint Tracker</h1>
          <p className="mt-1 text-sm text-slate-500">Track commute, energy, orders & plastic</p>
        </div>

        {isRegister && (
          <div>
            <label className="label">Name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
        )}
        <div>
          <label className="label">Email</label>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label">Password</label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'}
        </button>

        <button
          type="button"
          className="w-full text-center text-sm text-slate-500"
          onClick={() => setIsRegister(!isRegister)}
        >
          {isRegister ? 'Already have an account? Sign in' : 'New user? Register'}
        </button>

        <p className="text-center text-xs text-slate-400">
          Demo: demo@carbon.local / demo1234
        </p>
      </form>
    </div>
  )
}
