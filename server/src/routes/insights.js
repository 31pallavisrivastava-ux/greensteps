import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { authMiddleware } from '../middleware/auth.js'
import {
  aggregateFootprint,
  aggregatePlastic,
  compareScenarios,
  getAllFactors,
} from '../modules/emissions/engine.js'
import { computeWeeklyRewards } from '../modules/rewards/engine.js'
import { getWeeklyHistory, explainFootprint } from '../modules/insights/history.js'
import { getPersonalFootprint } from '../modules/family/engine.js'

export const emissionsRouter = Router()
emissionsRouter.use(authMiddleware)

emissionsRouter.get('/summary', async (req, res) => {
  const period = req.query.period === 'week' ? 'week' : 'month'
  const summary = await aggregateFootprint(prisma, req.userId, period)
  res.json(summary)
})

emissionsRouter.get('/factors', async (_req, res) => {
  const factors = await getAllFactors(prisma)
  res.json(factors)
})

export const insightsRouter = Router()
insightsRouter.use(authMiddleware)

insightsRouter.get('/personal', async (req, res) => {
  const personal = await getPersonalFootprint(prisma, req.userId)
  res.json(personal)
})

insightsRouter.get('/weekly', async (req, res) => {
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

  const totalKm = trips.reduce((s, t) => s + t.distanceKm, 0) || 1
  const publicKm = trips.filter((t) => t.transportCategory === 'PUBLIC').reduce((s, t) => s + t.distanceKm, 0)
  const privateKm = trips.filter((t) => t.transportCategory === 'PRIVATE').reduce((s, t) => s + t.distanceKm, 0)
  const activeKm = trips.filter((t) => t.transportCategory === 'ACTIVE').reduce((s, t) => s + t.distanceKm, 0)

  const tips = []
  if (privateKm / totalKm > 0.7) {
    tips.push('Over 70% of commute km is private — try metro or bus for your recurring route.')
  }
  if (orders.filter((o) => o.orderType === 'QUICK_COMMERCE').length >= 4) {
    tips.push('4+ quick-commerce orders this week — batch groceries into one Zepto/Blinkit run.')
  }
  if (orders.filter((o) => o.orderType === 'FOOD_DELIVERY').length >= 3) {
    tips.push('3+ food deliveries — cook one meal at home or choose "no cutlery" when ordering.')
  }
  if (plastic.landfillG > plastic.recycledG && plastic.disposalG > 0) {
    tips.push('More plastic going to landfill than recycled — segregate and use local kabadi.')
  }
  if (plastic.purchaseG > 0 && plastic.purchaseG * 0.5 < plastic.purchaseG) {
    tips.push('Delivery bags may be a large share of plastic — reuse bags when offered.')
  }
  if (unconfirmed > 0) {
    tips.push(`You have ${unconfirmed} trip(s) awaiting mode confirmation — confirm for accurate Scope 3 data.`)
  }
  if (tips.length === 0) {
    tips.push('Great week! Keep tracking to build your 4-week plastic and CO₂e trends.')
  }

  const scenarios = compareScenarios(footprint, plastic, trips, orders)
  const rewards = computeWeeklyRewards({ trips, energy, plastic, orders })

  res.json({
    tips: tips.slice(0, 2),
    commuteSplit: {
      public: Math.round((publicKm / totalKm) * 100),
      private: Math.round((privateKm / totalKm) * 100),
      active: Math.round((activeKm / totalKm) * 100),
    },
    footprint,
    plastic,
    scenarios,
    rewards,
  })
})

insightsRouter.get('/history', async (req, res) => {
  const weeks = Math.min(24, Math.max(4, Number(req.query.weeks) || 12))
  const history = await getWeeklyHistory(prisma, req.userId, weeks)
  res.json(history)
})

insightsRouter.get('/explain', async (req, res) => {
  const explanation = await explainFootprint(prisma, req.userId)
  res.json(explanation)
})
