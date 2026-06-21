import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { runFallbackCoach } from '../src/modules/coach/fallbackCoach.js'

describe('runFallbackCoach', () => {
  const executeTool = async (name) => {
    if (name === 'get_today_action') {
      return {
        emoji: '✅',
        title: 'Log something',
        message: 'Keep your weekly picture accurate.',
        impactHint: 'Takes under 1 minute.',
        link: '/log',
      }
    }
    if (name === 'explain_footprint') {
      return {
        totalKg: 12.5,
        scope1: 2,
        scope2: 8,
        scope3: 2.5,
        lines: [{ label: 'Grid power', co2eKg: 8, formula: 'kWh × CEA factor' }],
        topLine: { label: 'Grid power', co2eKg: 8, formula: 'kWh × CEA factor' },
      }
    }
    return {}
  }

  it('routes "what should I do today" to today action tool', async () => {
    const result = await runFallbackCoach({
      message: 'What should I do today?',
      executeTool,
    })
    assert.equal(result.mode, 'rules')
    assert.ok(result.toolsUsed.includes('get_today_action'))
    assert.match(result.reply, /Log something/)
  })

  it('routes footprint questions to explain tool', async () => {
    const result = await runFallbackCoach({
      message: 'Why is my footprint high?',
      executeTool,
    })
    assert.equal(result.mode, 'rules')
    assert.ok(result.toolsUsed.includes('explain_footprint'))
    assert.match(result.reply, /12.5 kg/)
  })
})
