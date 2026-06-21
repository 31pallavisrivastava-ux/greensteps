import { prisma } from '../lib/prisma.js'
import { authRouter, route, withQuery } from '../lib/router.js'
import {
  aggregateFootprint,
  aggregatePlastic,
  compareScenarios,
  getAllFactors,
} from '../modules/emissions/engine.js'
import { computeWeeklyRewards } from '../modules/rewards/engine.js'
import { getWeeklyHistory, explainFootprint } from '../modules/insights/history.js'
import { getPersonalFootprint } from '../modules/family/engine.js'
import { buildWeeklyTips, computeCommuteSplit } from '../modules/insights/weeklyTips.js'
import { periodQuerySchema, weeksQuerySchema } from '../lib/schemas/queries.js'
import { fetchWeeklyActivity } from '../lib/weeklyActivity.js'

export const emissionsRouter = authRouter()

emissionsRouter.get(
  '/summary',
  ...withQuery(periodQuerySchema, async (req, res) => {
    const { period } = req.validatedQuery
    res.json(await aggregateFootprint(prisma, req.userId, period))
  })
)

emissionsRouter.get(
  '/factors',
  route(async (_req, res) => {
    res.json(await getAllFactors(prisma))
  })
)

export const insightsRouter = authRouter()

insightsRouter.get(
  '/personal',
  route(async (req, res) => {
    res.json(await getPersonalFootprint(prisma, req.userId))
  })
)

insightsRouter.get(
  '/weekly',
  route(async (req, res) => {
    const footprint = await aggregateFootprint(prisma, req.userId, 'week')
    const plastic = await aggregatePlastic(prisma, req.userId, 'week')
    const { trips, orders, energy, unconfirmedTrips } = await fetchWeeklyActivity(
      prisma,
      req.userId,
      { includeUnconfirmed: true }
    )

    const totalKm = trips.reduce((s, t) => s + t.distanceKm, 0)
    const publicKm = trips
      .filter((t) => t.transportCategory === 'PUBLIC')
      .reduce((s, t) => s + t.distanceKm, 0)
    const privateKm = trips
      .filter((t) => t.transportCategory === 'PRIVATE')
      .reduce((s, t) => s + t.distanceKm, 0)
    const activeKm = trips
      .filter((t) => t.transportCategory === 'ACTIVE')
      .reduce((s, t) => s + t.distanceKm, 0)

    const tips = buildWeeklyTips({
      totalKm,
      publicKm,
      privateKm,
      quickCommerceOrders: orders.filter((o) => o.orderType === 'QUICK_COMMERCE').length,
      foodDeliveryOrders: orders.filter((o) => o.orderType === 'FOOD_DELIVERY').length,
      plastic,
      unconfirmedTrips,
    })

    res.json({
      tips,
      commuteSplit: computeCommuteSplit(totalKm, publicKm, privateKm, activeKm),
      footprint,
      plastic,
      scenarios: compareScenarios(footprint, plastic, trips, orders),
      rewards: computeWeeklyRewards({ trips, energy, plastic, orders }),
    })
  })
)

insightsRouter.get(
  '/history',
  ...withQuery(weeksQuerySchema, async (req, res) => {
    const { weeks } = req.validatedQuery
    res.json(await getWeeklyHistory(prisma, req.userId, weeks))
  })
)

insightsRouter.get(
  '/explain',
  route(async (req, res) => {
    res.json(await explainFootprint(prisma, req.userId))
  })
)
