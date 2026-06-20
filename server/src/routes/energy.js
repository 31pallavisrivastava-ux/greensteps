import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { authMiddleware } from '../middleware/auth.js'
import { computeEnergyEmissions } from '../modules/emissions/engine.js'

export const energyRouter = Router()
energyRouter.use(authMiddleware)

energyRouter.get('/', async (req, res) => {
  const readings = await prisma.energyReading.findMany({
    where: { userId: req.userId },
    orderBy: { periodStart: 'desc' },
  })
  res.json(readings)
})

energyRouter.post('/', async (req, res) => {
  try {
    const body = z
      .object({
        periodStart: z.string(),
        periodEnd: z.string(),
        kwh: z.number().nonnegative(),
        solarOffsetKwh: z.number().nonnegative().optional(),
        lpgKg: z.number().nonnegative().optional(),
      })
      .parse(req.body)

    const user = await prisma.user.findUnique({ where: { id: req.userId } })
    const { co2eKg } = await computeEnergyEmissions(
      prisma,
      body.kwh,
      body.solarOffsetKwh ?? 0,
      body.lpgKg ?? 0,
      user?.state
    )

    const reading = await prisma.energyReading.create({
      data: {
        userId: req.userId,
        periodStart: new Date(body.periodStart),
        periodEnd: new Date(body.periodEnd),
        kwh: body.kwh,
        solarOffsetKwh: body.solarOffsetKwh ?? 0,
        lpgKg: body.lpgKg ?? 0,
        co2eKg,
        source: 'MANUAL',
      },
    })
    res.status(201).json(reading)
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors })
    res.status(500).json({ error: 'Failed to log energy reading' })
  }
})

energyRouter.post('/ocr', async (req, res) => {
  res.status(501).json({
    error: 'OCR not implemented yet',
    message: 'Phase 2: upload electricity bill for automatic parsing',
    stub: true,
  })
})
