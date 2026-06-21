import { getPersonalFootprint } from '../family/engine.js'
import { getWeeklyHistory, explainFootprint } from '../insights/history.js'
import { getTodayAction } from '../engage/todayAction.js'
import { getEngageDashboard } from '../engage/engine.js'

export const COACH_TOOL_DEFINITIONS = [
  {
    type: 'function',
    function: {
      name: 'get_personal_footprint',
      description:
        'Get the user\'s personal weekly CO2 footprint: total kg, fuel/power/travel split, fair share status, trip and order counts.',
      parameters: { type: 'object', properties: {}, additionalProperties: false },
    },
  },
  {
    type: 'function',
    function: {
      name: 'explain_footprint',
      description:
        'Get a line-by-line breakdown of what contributed to this week\'s CO2 total (bills, fuel, trips, deliveries) with formulas.',
      parameters: { type: 'object', properties: {}, additionalProperties: false },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_weekly_trend',
      description: 'Get 12-week CO2 history and whether footprint is trending up or down vs last week.',
      parameters: {
        type: 'object',
        properties: {
          weeks: { type: 'number', description: 'Number of weeks (4–12)', minimum: 4, maximum: 12 },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_today_action',
      description:
        'Get the top prioritized daily sustainability action for this user based on their profile and recent logs.',
      parameters: { type: 'object', properties: {}, additionalProperties: false },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_engagement_summary',
      description: 'Get carbon budget progress, active challenges, streaks, and AQI nudge for the user\'s city.',
      parameters: { type: 'object', properties: {}, additionalProperties: false },
    },
  },
]

export async function executeCoachTool(prisma, userId, user, name, args = {}) {
  switch (name) {
    case 'get_personal_footprint':
      return getPersonalFootprint(prisma, userId)
    case 'explain_footprint':
      return explainFootprint(prisma, userId)
    case 'get_weekly_trend': {
      const weeks = Math.min(12, Math.max(4, Number(args.weeks) || 12))
      return getWeeklyHistory(prisma, userId, weeks)
    }
    case 'get_today_action':
      return getTodayAction(prisma, userId, user)
    case 'get_engagement_summary': {
      const dash = await getEngageDashboard(prisma, userId)
      return {
        budget: dash.budget,
        streaks: dash.streaks,
        openChallenges: dash.challenges.filter((c) => !c.completed).slice(0, 3),
        aqi: dash.aqi,
      }
    }
    default:
      return { error: `Unknown tool: ${name}` }
  }
}
