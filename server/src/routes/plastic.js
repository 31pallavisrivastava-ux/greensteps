import { prisma } from '../lib/prisma.js'
import { authRouter, route, withBody, created } from '../lib/router.js'
import { plasticDisposalSchema } from '../lib/schemas/plastic.js'
import { aggregatePlastic } from '../modules/emissions/engine.js'
import { computePlasticReward } from '../modules/rewards/engine.js'

export const plasticRouter = authRouter()

plasticRouter.post(
  '/disposal',
  ...withBody(plasticDisposalSchema, async (req, res) => {
    const body = req.body
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
    created(res, { ...event, reward: computePlasticReward(event) })
  })
)

plasticRouter.get(
  '/summary',
  route(async (req, res) => {
    const period = req.query.period === 'month' ? 'month' : 'week'
    res.json(await aggregatePlastic(prisma, req.userId, period))
  })
)

plasticRouter.get(
  '/events',
  route(async (req, res) => {
    res.json(
      await prisma.plasticEvent.findMany({
        where: { userId: req.userId },
        orderBy: { occurredAt: 'desc' },
        include: { order: true },
      })
    )
  })
)
