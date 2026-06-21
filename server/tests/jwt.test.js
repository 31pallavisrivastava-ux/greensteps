import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import jwt from 'jsonwebtoken'
import { signToken, verifyAccessToken, verifyTokenForRefresh } from '../src/lib/jwt.js'

const TEST_SECRET = 'jwt-unit-test-secret-isolated'

describe('jwt helpers', () => {
  it('signs and verifies access tokens with standard claims', () => {
    const prev = process.env.JWT_SECRET
    process.env.JWT_SECRET = TEST_SECRET
    const token = signToken('user-1')
    const payload = verifyAccessToken(token)
    assert.equal(payload.sub, 'user-1')
    assert.equal(payload.iss, 'greensteps-api')
    assert.equal(payload.aud, 'greensteps-client')
    process.env.JWT_SECRET = prev
  })

  it('allows refresh for recently expired tokens', () => {
    const prev = process.env.JWT_SECRET
    process.env.JWT_SECRET = TEST_SECRET
    const token = jwt.sign({ sub: 'user-2' }, TEST_SECRET, {
      expiresIn: '-1h',
      issuer: 'greensteps-api',
      audience: 'greensteps-client',
    })
    const payload = verifyTokenForRefresh(token)
    assert.equal(payload.sub, 'user-2')
    process.env.JWT_SECRET = prev
  })

  it('rejects refresh for tokens expired beyond grace window', () => {
    const prev = process.env.JWT_SECRET
    process.env.JWT_SECRET = TEST_SECRET
    const token = jwt.sign({ sub: 'user-3' }, TEST_SECRET, {
      expiresIn: '-60d',
      issuer: 'greensteps-api',
      audience: 'greensteps-client',
    })
    assert.throws(() => verifyTokenForRefresh(token))
    process.env.JWT_SECRET = prev
  })
})
