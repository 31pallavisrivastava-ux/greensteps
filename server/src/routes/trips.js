import { prisma } from '../lib/prisma.js'
import { authRouter, route, withBody, withParamsAndBody, created } from '../lib/router.js'
import { uuidParamSchema } from '../lib/schemas/common.js'
import {
  confirmTripSchema,
  manualTripSchema,
  tripDraftSchema,
} from '../lib/schemas/trip.js'
import {
  computeTripEmissions,
  transportCategoryForMode,
} from '../modules/emissions/engine.js'
import { computeTripReward } from '../modules/rewards/engine.js'
import { createTripFromDraft } from '../lib/tripDraft.js'
import { parseOptionalDate } from '../lib/http.js'

export const tripsRouter = authRouter()

function mapTrip(t) {
  return {
    id: t.id,
    startedAt: t.startedAt.toISOString(),
    endedAt: t.endedAt.toISOString(),
    distanceKm: t.distanceKm,
    suggestedMode: t.suggestedMode,
    confirmedMode: t.confirmedMode,
    transportCategory: t.transportCategory,
    co2eKg: t.co2eKg,
    fuelLitersEst: t.fuelLitersEst,
    isCommute: t.isCommute,
    source: t.source,
    confidence: t.confidence,
  }
}

tripsRouter.get(
  '/',
  route(async (req, res) => {
    const from = parseOptionalDate(req.query.from, 'from')
    const to = parseOptionalDate(req.query.to, 'to')
    const trips = await prisma.trip.findMany({
      where: {
        userId: req.userId,
        ...(from && to ? { startedAt: { gte: from, lte: to } } : {}),
      },
      orderBy: { startedAt: 'desc' },
    })
    res.json(trips.map(mapTrip))
  })
)

tripsRouter.post(
  '/draft',
  ...withBody(tripDraftSchema, async (req, res) => {
    created(res, mapTrip(await createTripFromDraft(prisma, req.userId, req.body)))
  })
)

tripsRouter.post(
  '/manual',
  ...withBody(manualTripSchema, async (req, res) => {
    const body = req.body
    const user = await prisma.user.findUnique({ where: { id: req.userId } })
    const vehicle = body.vehicleId
      ? await prisma.vehicle.findFirst({ where: { id: body.vehicleId, userId: req.userId } })
      : null

    const category = transportCategoryForMode(body.confirmedMode)
    const tripData = {
      userId: req.userId,
      startedAt: new Date(body.startedAt),
      endedAt: new Date(body.endedAt),
      distanceKm: body.distanceKm,
      suggestedMode: body.confirmedMode,
      confirmedMode: body.confirmedMode,
      transportCategory: category,
      isCommute: body.isCommute ?? true,
      source: 'MANUAL',
      confidence: 1,
      vehicleId: body.vehicleId,
    }

    const emissions = await computeTripEmissions(
      prisma,
      { ...tripData, confirmedMode: body.confirmedMode },
      vehicle,
      user?.state?.replace('IN-', '')
    )

    const trip = await prisma.trip.create({
      data: {
        ...tripData,
        co2eKg: emissions.co2eKg,
        fuelLitersEst: emissions.fuelLitersEst,
      },
    })
    created(res, { ...mapTrip(trip), reward: computeTripReward(trip) })
  })
)

tripsRouter.patch(
  '/:id/confirm',
  ...withParamsAndBody(uuidParamSchema, confirmTripSchema, async (req, res) => {
    const body = req.body
    const trip = await prisma.trip.findFirst({
      where: { id: req.params.id, userId: req.userId },
    })
    if (!trip) return res.status(404).json({ error: 'Trip not found' })

    const user = await prisma.user.findUnique({ where: { id: req.userId } })
    const vehicle = body.vehicleId
      ? await prisma.vehicle.findFirst({ where: { id: body.vehicleId, userId: req.userId } })
      : null

    const category = transportCategoryForMode(body.confirmedMode)
    const emissions = await computeTripEmissions(
      prisma,
      { ...trip, confirmedMode: body.confirmedMode },
      vehicle,
      user?.state?.replace('IN-', '')
    )

    const updated = await prisma.trip.update({
      where: { id: trip.id },
      data: {
        confirmedMode: body.confirmedMode,
        transportCategory: category,
        vehicleId: body.vehicleId,
        isCommute: body.isCommute ?? trip.isCommute,
        co2eKg: emissions.co2eKg,
        fuelLitersEst: emissions.fuelLitersEst,
      },
    })
    res.json({ ...mapTrip(updated), reward: computeTripReward(updated) })
  })
)
