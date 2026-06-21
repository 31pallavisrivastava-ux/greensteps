import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { buildWeeklyTips, computeCommuteSplit } from '../src/modules/insights/weeklyTips.js'

describe('buildWeeklyTips', () => {
  const base = {
    totalKm: 20,
    publicKm: 10,
    privateKm: 5,
    quickCommerceOrders: 0,
    foodDeliveryOrders: 0,
    plastic: { landfillG: 0, recycledG: 10, disposalG: 0, purchaseG: 0 },
    unconfirmedTrips: 0,
  }

  it('nudges when private km exceeds 70%', () => {
    const tips = buildWeeklyTips({ ...base, privateKm: 16, publicKm: 2, totalKm: 20 })
    assert.ok(tips.some((t) => t.includes('70%')))
  })

  it('flags high delivery packaging plastic', () => {
    const tips = buildWeeklyTips({
      ...base,
      plastic: { landfillG: 0, recycledG: 0, disposalG: 0, purchaseG: 80 },
    })
    assert.ok(tips.some((t) => t.includes('packaging')))
  })

  it('returns encouragement when no issues', () => {
    const tips = buildWeeklyTips(base)
    assert.ok(tips.some((t) => t.includes('Great week')))
  })
})

describe('computeCommuteSplit', () => {
  it('returns percentage split rounded to integers', () => {
    const split = computeCommuteSplit(100, 40, 50, 10)
    assert.deepEqual(split, { public: 40, private: 50, active: 10 })
  })
})
