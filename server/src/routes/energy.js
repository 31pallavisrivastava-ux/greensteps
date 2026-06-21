import { prisma } from '../lib/prisma.js'
import { authRouter, route, withBody, created } from '../lib/router.js'
import { energyOcrSchema, energyReadingSchema } from '../lib/schemas/energy.js'
import { computeEnergyEmissions } from '../modules/emissions/engine.js'
import { computeEnergyReward } from '../modules/rewards/engine.js'
import { parseUtilityBillText, SAMPLE_BILL_TEXT } from '../modules/ocr/utilityBillParser.js'

export const energyRouter = authRouter()

energyRouter.get(
  '/',
  route(async (req, res) => {
    res.json(
      await prisma.energyReading.findMany({
        where: { userId: req.userId },
        orderBy: { periodStart: 'desc' },
      })
    )
  })
)

energyRouter.post(
  '/',
  ...withBody(energyReadingSchema, async (req, res) => {
    const body = req.body
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
    created(res, { ...reading, reward: computeEnergyReward(reading) })
  })
)

energyRouter.post(
  '/ocr',
  ...withBody(energyOcrSchema, async (req, res) => {
    const body = req.body
    const parsed = parseUtilityBillText(body.text)
    if (!parsed.kwh) {
      return res.status(422).json({ error: 'Could not parse kWh from bill text', ...parsed })
    }

    if (!body.save) return res.json(parsed)

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
    created(res, { ...parsed, reading, reward: computeEnergyReward(reading) })
  })
)

energyRouter.get('/ocr/sample', (_req, res) => {
  res.json({ text: SAMPLE_BILL_TEXT.trim() })
})
