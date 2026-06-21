import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import jwt from 'jsonwebtoken'
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

  it('rejects missing Authorization header', async () => {
    const req = { headers: {} }
    const res = mockRes()
    let nextCalled = false
    await authMiddleware(req, res, () => {
      nextCalled = true
    })
    assert.equal(nextCalled, false)
    assert.equal(res.statusCode, 401)
    assert.equal(res.body.code, 'NO_TOKEN')
  })

  it('rejects malformed Bearer token', async () => {
    const req = { headers: { authorization: 'Bearer not-a-valid-jwt' } }
    const res = mockRes()
    await authMiddleware(req, res, () => {})
    assert.equal(res.statusCode, 401)
    assert.equal(res.body.code, 'INVALID_TOKEN')
  })

  it('returns TOKEN_EXPIRED for expired JWT', async () => {
    const token = jwt.sign({ sub: 'user-abc' }, process.env.JWT_SECRET, {
      expiresIn: '-1h',
      issuer: 'greensteps-api',
      audience: 'greensteps-client',
    })
    const req = { headers: { authorization: `Bearer ${token}` } }
    const res = mockRes()
    await authMiddleware(req, res, () => {})
    assert.equal(res.statusCode, 401)
    assert.equal(res.body.code, 'TOKEN_EXPIRED')
  })

  it('signToken produces verifiable JWT with issuer and audience', () => {
    const token = signToken('user-xyz')
    const payload = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: 'greensteps-api',
      audience: 'greensteps-client',
    })
    assert.equal(payload.sub, 'user-xyz')
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
