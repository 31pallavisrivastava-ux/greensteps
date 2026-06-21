import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { authMiddleware } from '../middleware/auth.js'
import { getEngageDashboard, INDIAN_CITIES } from '../modules/engage/engine.js'
import { getTodayAction } from '../modules/engage/todayAction.js'

export const engageRouter = Router()

engageRouter.get('/cities', (_req, res) => {
  res.json(
    Object.entries(INDIAN_CITIES).map(([name, meta]) => ({
      name,
      lat: meta.lat,
      lng: meta.lng,
      state: meta.state,
    }))
  )
})

engageRouter.use(authMiddleware)

engageRouter.get('/dashboard', async (req, res) => {
  const dashboard = await getEngageDashboard(prisma, req.userId)
  res.json(dashboard)
})

engageRouter.get('/today-action', async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId } })
  const action = await getTodayAction(prisma, req.userId, user)
  res.json(action)
})

// cities route is above authMiddleware
