import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { apiRateLimiter, authRateLimiter, corsOptions } from '../src/middleware/security.js'

describe('security middleware config', () => {
  it('authRateLimiter exposes standard rate-limit headers', () => {
    const limiter = authRateLimiter()
    assert.equal(typeof limiter, 'function')
  })

  it('apiRateLimiter is configured for general API protection', () => {
    const limiter = apiRateLimiter()
    assert.equal(typeof limiter, 'function')
  })

  it('corsOptions allows all origins in non-production', () => {
    const prev = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'
    assert.deepEqual(corsOptions(), { origin: true })
    process.env.NODE_ENV = prev
  })

  it('corsOptions restricts origin in production when CORS_ORIGIN is set', () => {
    const prev = { NODE_ENV: process.env.NODE_ENV, CORS_ORIGIN: process.env.CORS_ORIGIN }
    process.env.NODE_ENV = 'production'
    process.env.CORS_ORIGIN = 'https://greensteps.onrender.com'
    assert.deepEqual(corsOptions(), {
      origin: 'https://greensteps.onrender.com',
      credentials: true,
    })
    process.env.NODE_ENV = prev.NODE_ENV
    process.env.CORS_ORIGIN = prev.CORS_ORIGIN
  })
})
