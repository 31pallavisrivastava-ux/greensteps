import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { authMiddleware } from '../middleware/auth.js'
import { asyncHandler } from '../lib/http.js'
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

export const emissionsRouter = Router()
emissionsRouter.use(authMiddleware)

emissionsRouter.get(
  '/summary',
  asyncHandler(async (req, res) => {
    const period = req.query.period === 'week' ? 'week' : 'month'
    const summary = await aggregateFootprint(prisma, req.userId, period)
    res.json(summary)
  })
)

emissionsRouter.get(
  '/factors',
  asyncHandler(async (_req, res) => {
    const factors = await getAllFactors(prisma)
    res.json(factors)
  })
)

export const insightsRouter = Router()
insightsRouter.use(authMiddleware)

insightsRouter.get(
  '/personal',
  asyncHandler(async (req, res) => {
    const personal = await getPersonalFootprint(prisma, req.userId)
    res.json(personal)
  })
)

insightsRouter.get(
  '/weekly',
  asyncHandler(async (req, res) => {
    const footprint = await aggregateFootprint(prisma, req.userId, 'week')
    const plastic = await aggregatePlastic(prisma, req.userId, 'week')

    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    const [trips, orders, unconfirmed, energy] = await Promise.all([
      prisma.trip.findMany({
        where: { userId: req.userId, startedAt: { gte: weekAgo }, confirmedMode: { not: null } },
      }),
      prisma.deliveryOrder.findMany({
        where: { userId: req.userId, orderedAt: { gte: weekAgo } },
      }),
      prisma.trip.count({
        where: { userId: req.userId, confirmedMode: null, startedAt: { gte: weekAgo } },
      }),
      prisma.energyReading.findMany({
        where: { userId: req.userId, periodEnd: { gte: weekAgo } },
      }),
    ])

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
      unconfirmedTrips: unconfirmed,
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
  asyncHandler(async (req, res) => {
    const weeks = Math.min(24, Math.max(4, Number(req.query.weeks) || 12))
    const history = await getWeeklyHistory(prisma, req.userId, weeks)
    res.json(history)
  })
)

insightsRouter.get(
  '/explain',
  asyncHandler(async (req, res) => {
    const explanation = await explainFootprint(prisma, req.userId)
    res.json(explanation)
  })
)
