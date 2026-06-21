import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { authMiddleware } from '../middleware/auth.js'
import { asyncHandler, parseOptionalDate } from '../lib/http.js'
import {
  confirmTripSchema,
  manualTripSchema,
  tripDraftSchema,
} from '../lib/schemas/trip.js'
import {
  computeTripEmissions,
  inferModeFromPoints,
  transportCategoryForMode,
} from '../modules/emissions/engine.js'
import { computeTripReward } from '../modules/rewards/engine.js'

export const tripsRouter = Router()
tripsRouter.use(authMiddleware)

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
  asyncHandler(async (req, res) => {
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
  asyncHandler(async (req, res) => {
    const body = tripDraftSchema.parse(req.body)
    const { mode, confidence } = inferModeFromPoints(body.points, body.distanceKm)
    const trip = await prisma.trip.create({
      data: {
        userId: req.userId,
        startedAt: new Date(body.startedAt),
        endedAt: new Date(body.endedAt),
        distanceKm: body.distanceKm,
        suggestedMode: mode,
        isCommute: body.isCommute ?? false,
        source: 'GPS',
        confidence,
        routePolyline: JSON.stringify(body.points),
      },
    })
    res.status(201).json(mapTrip(trip))
  })
)

tripsRouter.post(
  '/manual',
  asyncHandler(async (req, res) => {
    const body = manualTripSchema.parse(req.body)
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
    const reward = computeTripReward(trip)
    res.status(201).json({ ...mapTrip(trip), reward })
  })
)

tripsRouter.patch(
  '/:id/confirm',
  asyncHandler(async (req, res) => {
    const body = confirmTripSchema.parse(req.body)
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
    const reward = computeTripReward(updated)
    res.json({ ...mapTrip(updated), reward })
  })
)