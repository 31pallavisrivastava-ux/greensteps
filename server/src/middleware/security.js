import helmet from 'helmet'
import rateLimit from 'express-rate-limit'

/** Security headers (CSP relaxed for Vite PWA inline assets). */
export function securityMiddleware() {
  return helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    hsts: process.env.NODE_ENV === 'production',
  })
}

/** Brute-force protection on login/register. */
export function authRateLimiter() {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === 'test' ? 10_000 : 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many auth attempts — try again later' },
  })
}

/** General API abuse protection. */
export function apiRateLimiter() {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === 'test' ? 10_000 : 400,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests — try again later' },
  })
}

/** Restrict cross-origin access in production when CORS_ORIGIN is set. */
export function corsOptions() {
  const origin = process.env.CORS_ORIGIN?.trim()
  if (process.env.NODE_ENV === 'production' && origin) {
    return { origin, credentials: true }
  }
  return { origin: true }
}

export function assertProductionSecrets() {
  if (process.env.NODE_ENV !== 'production') return
  const secret = process.env.JWT_SECRET?.trim()
  if (!secret || secret === 'dev-secret' || secret === 'dev-secret-change-in-production') {
    throw new Error('JWT_SECRET must be set to a strong value in production')
  }
}
