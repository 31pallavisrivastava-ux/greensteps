import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { isoDateString } from '../src/lib/schemas/primitives.js'

describe('primitives schemas', () => {
  it('isoDateString accepts valid ISO datetimes', () => {
    const parsed = isoDateString.parse(new Date().toISOString())
    assert.ok(parsed.includes('T'))
  })

  it('isoDateString rejects non-datetime strings', () => {
    assert.throws(() => isoDateString.parse('not-a-date'))
  })
})
