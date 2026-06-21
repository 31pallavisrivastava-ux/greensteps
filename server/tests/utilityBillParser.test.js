import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { parseUtilityBillText } from '../src/modules/ocr/utilityBillParser.js'

describe('parseUtilityBillText', () => {
  it('extracts kWh from typical Indian bill text', () => {
    const result = parseUtilityBillText(
      'BSES Yamuna Bill Period 01/04/2026 to 30/04/2026 Units Consumed: 245 kWh'
    )
    assert.equal(result.kwh, 245)
    assert.ok(result.confidence > 0)
  })

  it('returns null kWh for empty text', () => {
    const result = parseUtilityBillText('')
    assert.equal(result.kwh, null)
  })
})
