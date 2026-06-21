import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { loginSchema, registerSchema } from '../src/lib/schemas/auth.js'
import { familyJoinSchema, joinCodeSchema } from '../src/lib/schemas/common.js'

describe('auth schemas', () => {
  it('normalizes email to lowercase on register', () => {
    const parsed = registerSchema.parse({
      email: '  User@Example.COM  ',
      password: 'testpass1',
    })
    assert.equal(parsed.email, 'user@example.com')
  })

  it('rejects passwords shorter than 8 characters', () => {
    assert.throws(
      () =>
        registerSchema.parse({
          email: 'user@test.local',
          password: 'short',
        }),
      /at least 8/
    )
  })

  it('rejects passwords longer than 128 characters', () => {
    assert.throws(() =>
      registerSchema.parse({
        email: 'user@test.local',
        password: 'a'.repeat(129),
      })
    )
  })

  it('accepts login with normalized email', () => {
    const parsed = loginSchema.parse({
      email: ' Demo@Carbon.Local ',
      password: 'demo1234',
    })
    assert.equal(parsed.email, 'demo@carbon.local')
  })
})

describe('common schemas', () => {
  it('uppercases join codes', () => {
    const parsed = joinCodeSchema.parse({ joinCode: ' abc123 ' })
    assert.equal(parsed.joinCode, 'ABC123')
  })

  it('accepts optional family join role', () => {
    const parsed = familyJoinSchema.parse({ joinCode: 'xyz789', role: 'CHILD' })
    assert.equal(parsed.role, 'CHILD')
  })
})
