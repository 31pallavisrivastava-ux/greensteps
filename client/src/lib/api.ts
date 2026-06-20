const API = '/api'

function getToken() {
  return localStorage.getItem('carbon_token')
}

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${API}${path}`, { ...options, headers })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error ?? 'Request failed')
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
