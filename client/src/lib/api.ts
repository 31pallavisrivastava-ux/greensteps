const API = '/api'

function getToken() {
  return localStorage.getItem('carbon_token')
}

/** Typed API failure with HTTP status for UI error handling. */
export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export function getErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (error instanceof ApiError || error instanceof Error) return error.message
  return fallback
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${API}${path}`, { ...options, headers }).catch(() => {
    throw new ApiError(
      'Cannot reach API server — run: npm run dev -w server (port 3001)',
      0
    )
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    const message =
      typeof err.error === 'string'
        ? err.error
        : res.status === 401
          ? 'Unauthorized — check email/password or start the API server'
          : res.status === 404
            ? 'API route not found — restart the server: npm run dev (old process may still be on port 3001)'
            : `Request failed (${res.status})`
    throw new ApiError(message, res.status)
  }

  return res.json()
}

export function setToken(token: string) {
  localStorage.setItem('carbon_token', token)
}

export function clearToken() {
  localStorage.removeItem('carbon_token')
}

export function hasToken() {
  return !!getToken()
}
