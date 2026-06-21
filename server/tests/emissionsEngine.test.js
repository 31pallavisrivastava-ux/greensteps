import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { inferModeFromPoints, transportCategoryForMode } from '../src/modules/emissions/engine.js'

describe('inferModeFromPoints', () => {
  it('suggests WALK for short slow trips', () => {
    const points = [
      { lat: 28.6, lng: 77.2, t: 0 },
      { lat: 28.601, lng: 77.201, t: 600 },
    ]
    const result = inferModeFromPoints(points, 0.5)
    assert.equal(result.mode, 'WALK')
    assert.ok(result.confidence >= 0.5)
  })

  it('suggests CAR for fast trips with explicit speed', () => {
    const points = [
      { lat: 28.6, lng: 77.2, t: 0, speedKmh: 45 },
      { lat: 28.65, lng: 77.25, t: 600, speedKmh: 48 },
    ]
    const result = inferModeFromPoints(points, 8)
    assert.equal(result.mode, 'CAR')
  })
})

describe('transportCategoryForMode', () => {
  it('maps metro and bus to PUBLIC', () => {
    assert.equal(transportCategoryForMode('METRO'), 'PUBLIC')
    assert.equal(transportCategoryForMode('BUS'), 'PUBLIC')
  })

  it('maps car and bike to PRIVATE', () => {
    assert.equal(transportCategoryForMode('CAR'), 'PRIVATE')
    assert.equal(transportCategoryForMode('BIKE'), 'PRIVATE')
  })

  it('maps walk and cycle to ACTIVE', () => {
    assert.equal(transportCategoryForMode('WALK'), 'ACTIVE')
    assert.equal(transportCategoryForMode('CYCLE'), 'ACTIVE')
  })
})
