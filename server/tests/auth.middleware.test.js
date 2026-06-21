import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { signToken, authMiddleware } from '../src/middleware/auth.js'
import { assertProductionSecrets } from '../src/middleware/security.js'

function mockRes() {
  const res = { statusCode: 200, body: null }
  res.status = (code) => {
    res.statusCode = code
    return res
  }
  res.json = (body) => {
    res.body = body
    return res
  }
  return res
}

describe('authMiddleware', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'unit-test-secret'
  })

  it('rejects missing Authorization header', () => {
    const req = { headers: {} }
    const res = mockRes()
    let nextCalled = false
    authMiddleware(req, res, () => {
      nextCalled = true
    })
    assert.equal(nextCalled, false)
    assert.equal(res.statusCode, 401)
    assert.equal(res.body.error, 'Unauthorized')
  })

  it('rejects malformed Bearer token', () => {
    const req = { headers: { authorization: 'Bearer not-a-valid-jwt' } }
    const res = mockRes()
    authMiddleware(req, res, () => {})
    assert.equal(res.statusCode, 401)
    assert.equal(res.body.error, 'Invalid token')
  })

  it('accepts valid token and sets userId', () => {
    const userId = 'user-abc-123'
    const token = signToken(userId)
    const req = { headers: { authorization: `Bearer ${token}` } }
    const res = mockRes()
    let nextCalled = false
    authMiddleware(req, res, () => {
      nextCalled = true
    })
    assert.equal(nextCalled, true)
    assert.equal(req.userId, userId)
  })
})

describe('assertProductionSecrets', () => {
  it('throws when JWT_SECRET is default in production', () => {
    const prev = { NODE_ENV: process.env.NODE_ENV, JWT_SECRET: process.env.JWT_SECRET }
    process.env.NODE_ENV = 'production'
    process.env.JWT_SECRET = 'dev-secret-change-in-production'
    assert.throws(() => assertProductionSecrets(), /JWT_SECRET/)
    process.env.NODE_ENV = prev.NODE_ENV
    process.env.JWT_SECRET = prev.JWT_SECRET
  })

  it('passes with custom secret in production', () => {
    const prev = { NODE_ENV: process.env.NODE_ENV, JWT_SECRET: process.env.JWT_SECRET }
    process.env.NODE_ENV = 'production'
    process.env.JWT_SECRET = 'strong-random-production-secret'
    assert.doesNotThrow(() => assertProductionSecrets())
    process.env.NODE_ENV = prev.NODE_ENV
    process.env.JWT_SECRET = prev.JWT_SECRET
  })
})
