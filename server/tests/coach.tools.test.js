import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { COACH_TOOL_DEFINITIONS, executeCoachTool } from '../src/modules/coach/tools.js'

describe('COACH_TOOL_DEFINITIONS', () => {
  it('defines five agent tools for footprint coaching', () => {
    assert.equal(COACH_TOOL_DEFINITIONS.length, 5)
    const names = COACH_TOOL_DEFINITIONS.map((t) => t.function.name)
    assert.ok(names.includes('get_personal_footprint'))
    assert.ok(names.includes('explain_footprint'))
    assert.ok(names.includes('get_weekly_trend'))
    assert.ok(names.includes('get_today_action'))
    assert.ok(names.includes('get_engagement_summary'))
  })
})

describe('executeCoachTool', () => {
  it('returns error for unknown tool name', async () => {
    const result = await executeCoachTool(null, 'u1', null, 'invalid_tool', {})
    assert.equal(result.error, 'Unknown tool: invalid_tool')
  })
})
