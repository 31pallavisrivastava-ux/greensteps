import { isTokenExpired } from './jwt'

const API = '/api'

function getToken() {
  return localStorage.getItem('carbon_token')
}

let unauthorizedHandler: (() => void) | null = null
let refreshInFlight: Promise<boolean> | null = null

/** Typed API failure with HTTP status for UI error handling. */
export class ApiError extends Error {
  readonly status: number
  readonly code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler
}

export function getErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (error instanceof ApiError || error instanceof Error) return error.message
  return fallback
}

async function refreshAccessToken(): Promise<boolean> {
  const token = getToken()
  if (!token) return false
  if (!refreshInFlight) {
    refreshInFlight = fetch(`${API}/auth/refresh`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    })
      .then(async (res) => {
        if (!res.ok) return false
        const body = (await res.json()) as { token?: string }
        if (!body.token) return false
        setToken(body.token)
        return true
      })
      .catch(() => false)
      .finally(() => {
        refreshInFlight = null
      })
  }
  return refreshInFlight
}

async function parseErrorResponse(res: Response) {
  const err = await res.json().catch(() => ({ error: res.statusText }))
  const message =
    typeof err.error === 'string'
      ? err.error
      : res.status === 401
        ? 'Session expired — please sign in again'
        : res.status === 404
          ? 'API route not found — restart the server: npm run dev (old process may still be on port 3001)'
          : `Request failed (${res.status})`
  const code = typeof err.code === 'string' ? err.code : undefined
  return new ApiError(message, res.status, code)
}

async function fetchWithAuth(path: string, options: RequestInit, allowRefresh: boolean): Promise<Response> {
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

  if (
    res.status === 401 &&
    allowRefresh &&
    !path.startsWith('/auth/login') &&
    !path.startsWith('/auth/register') &&
    !path.startsWith('/auth/refresh')
  ) {
    const errBody = await res.clone().json().catch(() => ({}))
    const code = typeof errBody.code === 'string' ? errBody.code : undefined
    if (code === 'TOKEN_EXPIRED' || code === 'INVALID_TOKEN' || code === 'NO_TOKEN') {
      const refreshed = await refreshAccessToken()
      if (refreshed) {
        return fetchWithAuth(path, options, false)
      }
      unauthorizedHandler?.()
    }
  }

  return res
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  if (token && isTokenExpired(token) && !path.startsWith('/auth/')) {
    const refreshed = await refreshAccessToken()
    if (!refreshed) unauthorizedHandler?.()
  }

  const res = await fetchWithAuth(path, options, true)

  if (!res.ok) {
    const error = await parseErrorResponse(res)
    if (res.status === 401 && !path.startsWith('/auth/login') && !path.startsWith('/auth/register')) {
      unauthorizedHandler?.()
    }
    throw error
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
