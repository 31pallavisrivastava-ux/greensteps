import jwt from 'jsonwebtoken'

const JWT_ISSUER = 'greensteps-api'
const JWT_AUDIENCE = 'greensteps-client'
const JWT_EXPIRES = process.env.JWT_EXPIRES ?? '7d'
/** Allow refresh for tokens expired up to 30 days ago. */
const REFRESH_GRACE_MS = 30 * 24 * 60 * 60 * 1000

function jwtSecret() {
  return process.env.JWT_SECRET ?? 'dev-secret'
}

export function signToken(userId) {
  return jwt.sign({ sub: userId }, jwtSecret(), {
    expiresIn: JWT_EXPIRES,
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  })
}

export function verifyAccessToken(token) {
  return jwt.verify(token, jwtSecret(), {
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  })
}

/** Verify signature while ignoring expiry — used for token refresh. */
export function verifyTokenForRefresh(token) {
  const payload = jwt.verify(token, jwtSecret(), {
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
    ignoreExpiration: true,
  })
  if (payload.exp && Date.now() - payload.exp * 1000 > REFRESH_GRACE_MS) {
    const err = new Error('Refresh window expired')
    err.name = 'TokenExpiredError'
    throw err
  }
  return payload
}

export function getTokenFromHeader(header) {
  if (!header?.startsWith('Bearer ')) return null
  return header.slice(7).trim()
}
