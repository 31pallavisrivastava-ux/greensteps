import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { authMiddleware } from '../middleware/auth.js'
import { computeEnergyEmissions } from '../modules/emissions/engine.js'
import { computeEnergyReward } from '../modules/rewards/engine.js'
import { parseUtilityBillText, SAMPLE_BILL_TEXT } from '../modules/ocr/utilityBillParser.js'

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
        source: z.enum(['MANUAL', 'OCR']).optional(),
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
        source: body.source === 'OCR' ? 'OCR' : 'MANUAL',
      },
    })
    const reward = computeEnergyReward(reading)
    res.status(201).json({ ...reading, reward })
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors })
    res.status(500).json({ error: 'Failed to log energy reading' })
  }
})

energyRouter.post('/ocr', async (req, res) => {
  try {
    const body = z
      .object({
        text: z.string().min(10),
        save: z.boolean().optional(),
        solarOffsetKwh: z.number().nonnegative().optional(),
        lpgKg: z.number().nonnegative().optional(),
      })
      .parse(req.body)

    const parsed = parseUtilityBillText(body.text)
    if (!parsed.kwh) {
      return res.status(422).json({ error: 'Could not parse kWh from bill text', ...parsed })
    }

    if (!body.save) {
      return res.json(parsed)
    }

    const user = await prisma.user.findUnique({ where: { id: req.userId } })
    const { co2eKg } = await computeEnergyEmissions(
      prisma,
      parsed.kwh,
      body.solarOffsetKwh ?? 0,
      body.lpgKg ?? 0,
      user?.state
    )

    const reading = await prisma.energyReading.create({
      data: {
        userId: req.userId,
        periodStart: new Date(parsed.periodStart),
        periodEnd: new Date(parsed.periodEnd),
        kwh: parsed.kwh,
        solarOffsetKwh: body.solarOffsetKwh ?? 0,
        lpgKg: body.lpgKg ?? 0,
        co2eKg,
        source: 'OCR',
      },
    })
    const reward = computeEnergyReward(reading)
    res.status(201).json({ ...parsed, reading, reward })
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors })
    res.status(500).json({ error: 'OCR parse failed' })
  }
})

energyRouter.get('/ocr/sample', (_req, res) => {
  res.json({ text: SAMPLE_BILL_TEXT.trim() })
})
