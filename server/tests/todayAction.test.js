import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { resolveTodayAction } from '../src/modules/engage/todayAction.js'

const base = {
  unconfirmed: 0,
  concern: null,
  powerShare: 0.2,
  energyReadings: 1,
  deliveryCount: 0,
  publicTrips: 3,
  transportPreference: 'MIXED',
  plasticLandfillG: 0,
  plasticRecycledG: 0,
}

describe('resolveTodayAction', () => {
  it('prioritises unconfirmed trips', () => {
    const action = resolveTodayAction({ ...base, unconfirmed: 2 })
    assert.equal(action.id, 'confirm-trips')
    assert.match(action.message, /2 trips/)
  })

  it('suggests bill scan when power is top concern and no energy logged', () => {
    const action = resolveTodayAction({
      ...base,
      concern: 'POWER',
      energyReadings: 0,
      powerShare: 0.6,
    })
    assert.equal(action.id, 'scan-bill')
  })

  it('nudges delivery-free day after multiple orders', () => {
    const action = resolveTodayAction({ ...base, deliveryCount: 3 })
    assert.equal(action.id, 'delivery-free')
  })

  it('promotes public transport for car users with few bus trips', () => {
    const action = resolveTodayAction({
      ...base,
      transportPreference: 'CAR',
      publicTrips: 0,
    })
    assert.equal(action.id, 'public-transport')
  })

  it('falls back to daily log when no rule matches', () => {
    const action = resolveTodayAction(base)
    assert.equal(action.id, 'daily-log')
  })
})
