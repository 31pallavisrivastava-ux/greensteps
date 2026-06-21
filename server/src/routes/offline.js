import { prisma } from '../lib/prisma.js'
import { authRouter, route, withBody, created } from '../lib/router.js'
import { offlineQueueSchema } from '../lib/schemas/offline.js'

export const offlineRouter = authRouter()

offlineRouter.get(
  '/queue',
  route(async (req, res) => {
    res.json(
      await prisma.offlineQueueItem.findMany({
        where: { userId: req.userId, synced: false },
        orderBy: { createdAt: 'asc' },
      })
    )
  })
)

offlineRouter.post(
  '/queue',
  ...withBody(offlineQueueSchema, async (req, res) => {
    const { type, payload } = req.body
    created(
      res,
      await prisma.offlineQueueItem.create({
        data: {
          userId: req.userId,
          type,
          payload: typeof payload === 'string' ? payload : JSON.stringify(payload),
        },
      })
    )
  })
)

offlineRouter.post(
  '/sync',
  route(async (req, res) => {
    const items = await prisma.offlineQueueItem.findMany({
      where: { userId: req.userId, synced: false },
    })

    const results = []
    for (const item of items) {
      try {
        const payload = JSON.parse(item.payload)
        if (item.type === 'trip_draft') {
          const { inferModeFromPoints } = await import('../modules/emissions/engine.js')
          const { mode, confidence } = inferModeFromPoints(payload.points, payload.distanceKm)
          await prisma.trip.create({
            data: {
              userId: req.userId,
              startedAt: new Date(payload.startedAt),
              endedAt: new Date(payload.endedAt),
              distanceKm: payload.distanceKm,
              suggestedMode: mode,
              isCommute: payload.isCommute ?? false,
              source: 'GPS',
              confidence,
              routePolyline: JSON.stringify(payload.points),
            },
          })
        }
        await prisma.offlineQueueItem.update({
          where: { id: item.id },
          data: { synced: true },
        })
        results.push({ id: item.id, status: 'synced' })
      } catch (e) {
        results.push({ id: item.id, status: 'error', error: String(e) })
      }
    }

    res.json({ synced: results.filter((r) => r.status === 'synced').length, results })
  })
)
