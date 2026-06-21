import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { WEEKLY_FAIR_SHARE_KG } from '../src/modules/engage/engine.js'

describe('WEEKLY_FAIR_SHARE_KG', () => {
  it('matches IPCC equity path (~2.3 t/person/year)', () => {
    const annualKg = WEEKLY_FAIR_SHARE_KG * 52
    assert.ok(annualKg > 2200 && annualKg < 2400, `expected ~2300 kg/year, got ${annualKg}`)
  })
})
