export type JwtPayload = {
  sub?: string
  exp?: number
  iat?: number
}

/** Decode JWT payload without verifying signature (client-side expiry hint only). */
export function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const part = token.split('.')[1]
    if (!part) return null
    const json = atob(part.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(json) as JwtPayload
  } catch {
    return null
  }
}

export function getTokenExpiryMs(token: string): number | null {
  const payload = decodeJwtPayload(token)
  return payload?.exp ? payload.exp * 1000 : null
}

export function isTokenExpired(token: string, skewSeconds = 60): boolean {
  const expMs = getTokenExpiryMs(token)
  if (!expMs) return true
  return Date.now() >= expMs - skewSeconds * 1000
}
