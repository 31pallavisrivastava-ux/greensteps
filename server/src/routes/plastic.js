import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { authMiddleware } from '../middleware/auth.js'
import { aggregatePlastic } from '../modules/emissions/engine.js'
import { computePlasticReward } from '../modules/rewards/engine.js'

export const plasticRouter = Router()
plasticRouter.use(authMiddleware)

plasticRouter.post('/disposal', async (req, res) => {
  try {
    const body = z
      .object({
        occurredAt: z.string(),
        plasticType: z.enum(['PET', 'HDPE', 'LDPE', 'PP', 'MULTILAYER', 'MIXED']),
        grams: z.number().positive(),
        disposalMethod: z.enum(['RECYCLED', 'LANDFILL', 'REUSED']),
        notes: z.string().optional(),
      })
      .parse(req.body)

    const event = await prisma.plasticEvent.create({
      data: {
        userId: req.userId,
        occurredAt: new Date(body.occurredAt),
        source: 'DISPOSAL',
        plasticType: body.plasticType,
        grams: body.grams,
        disposalMethod: body.disposalMethod,
        notes: body.notes,
        confidence: 0.95,
      },
    })
    const reward = computePlasticReward(event)
    res.status(201).json({ ...event, reward })
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors })
    res.status(500).json({ error: 'Failed to log disposal' })
  }
})

plasticRouter.get('/summary', async (req, res) => {
  const period = req.query.period === 'month' ? 'month' : 'week'
  const summary = await aggregatePlastic(prisma, req.userId, period)
  res.json(summary)
})

plasticRouter.get('/events', async (req, res) => {
  const events = await prisma.plasticEvent.findMany({
    where: { userId: req.userId },
    orderBy: { occurredAt: 'desc' },
    include: { order: true },
  })
  res.json(events)
})
