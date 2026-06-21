import helmet from 'helmet'
import rateLimit from 'express-rate-limit'

/** Security headers (CSP relaxed for Vite PWA inline assets). */
export function securityMiddleware() {
  return helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
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

export function assertProductionSecrets() {
  if (process.env.NODE_ENV !== 'production') return
  const secret = process.env.JWT_SECRET?.trim()
  if (!secret || secret === 'dev-secret' || secret === 'dev-secret-change-in-production') {
    throw new Error('JWT_SECRET must be set to a strong value in production')
  }
}
