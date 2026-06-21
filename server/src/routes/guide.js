import { prisma } from '../lib/prisma.js'
import { authRouter, route, withParams, withParamsAndBody, created } from '../lib/router.js'
import { checklistCompleteSchema, contextIdParamSchema } from '../lib/schemas/guide.js'
import {
  listContexts,
  getContextChecklist,
  getSustainabilityTips,
  estimateChecklistCo2,
  computeComparison,
  buildMilestoneShare,
} from '../modules/guide/engine.js'
import { aggregateFootprint, aggregatePlastic } from '../modules/emissions/engine.js'
import { computeWeeklyRewards } from '../modules/rewards/engine.js'
import { fetchWeeklyActivity } from '../lib/weeklyActivity.js'

export const guideRouter = authRouter()

guideRouter.get('/contexts', (_req, res) => {
  res.json(listContexts())
})

guideRouter.get(
  '/contexts/:id',
  ...withParams(contextIdParamSchema, async (req, res) => {
    const ctx = getContextChecklist(req.params.id.toUpperCase())
    if (!ctx) return res.status(404).json({ error: 'Context not found' })
    res.json(ctx)
  })
)

guideRouter.post(
  '/contexts/:id/complete',
  ...withParamsAndBody(contextIdParamSchema, checklistCompleteSchema, async (req, res) => {
    const contextId = req.params.id.toUpperCase()
    const ctx = getContextChecklist(contextId)
    if (!ctx) return res.status(404).json({ error: 'Context not found' })

    const body = req.body
    const estCo2Saved = estimateChecklistCo2(body.itemsDone, contextId)

    const session = await prisma.contextChecklistSession.create({
      data: {
        userId: req.userId,
        contextId,
        itemsDone: JSON.stringify(body.itemsDone),
        itemCount: body.itemsDone.length,
        totalItems: ctx.items.length,
        estCo2Saved,
      },
    })

    const pct = Math.round((body.itemsDone.length / ctx.items.length) * 100)
    created(res, {
      session,
      reward: {
        title: pct === 100 ? 'Checklist complete!' : 'Great progress!',
        message:
          pct === 100
            ? `You finished all ${ctx.items.length} steps for ${ctx.label.toLowerCase()} — estimated ~${estCo2Saved} kg CO₂ impact avoided today!`
            : `You completed ${body.itemsDone.length} of ${ctx.items.length} low-carbon steps. Every tick helps!`,
        co2SavedKg: estCo2Saved,
        type: body.itemsDone.length >= ctx.items.length / 2 ? 'celebration' : 'info',
      },
    })
  })
)

guideRouter.get('/tips', (_req, res) => {
  res.json(getSustainabilityTips())
})

guideRouter.get(
  '/comparison',
  route(async (req, res) => {
    res.json(await computeComparison(prisma, req.userId))
  })
)

guideRouter.get(
  '/milestones/share',
  route(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.userId } })
    const footprint = await aggregateFootprint(prisma, req.userId, 'week')
    const plastic = await aggregatePlastic(prisma, req.userId, 'week')
    const { trips, orders } = await fetchWeeklyActivity(prisma, req.userId, {
      includeEnergy: false,
    })
    const rewards = computeWeeklyRewards({ trips, energy: [], plastic, orders })
    const comparison = await computeComparison(prisma, req.userId)

    const share = buildMilestoneShare({
      userName: user?.name,
      rewards,
      comparison,
    })

    const card = {
      userName: user?.name?.split(' ')[0] ?? 'GreenSteps user',
      headline: rewards.headline,
      co2SavedKg: rewards.co2SavedKg,
      co2TotalKg: Math.round(footprint.total * 10) / 10,
      percentile: comparison.percentile,
      rankLabel: comparison.rankLabel,
      badges: rewards.badges,
    }

    res.json({
      share,
      card,
      rewards,
      comparison,
      footprint: footprint.total,
    })
  })
)
