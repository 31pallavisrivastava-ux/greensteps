import { prisma } from '../lib/prisma.js'
import { authRouter, route } from '../lib/router.js'
import { getEngageDashboard, INDIAN_CITIES } from '../modules/engage/engine.js'
import { getTodayAction } from '../modules/engage/todayAction.js'
import { Router } from 'express'

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

const authed = authRouter()
authed.get(
  '/dashboard',
  route(async (req, res) => {
    res.json(await getEngageDashboard(prisma, req.userId))
  })
)
authed.get(
  '/today-action',
  route(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.userId } })
    res.json(await getTodayAction(prisma, req.userId, user))
  })
)

engageRouter.use(authed)
