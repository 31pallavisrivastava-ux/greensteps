import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { authMiddleware } from '../middleware/auth.js'
import {
  computeTripEmissions,
  inferModeFromPoints,
  transportCategoryForMode,
} from '../modules/emissions/engine.js'

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

tripsRouter.get('/', async (req, res) => {
  const from = req.query.from ? new Date(req.query.from) : undefined
  const to = req.query.to ? new Date(req.query.to) : undefined
  const trips = await prisma.trip.findMany({
    where: {
      userId: req.userId,
      ...(from && to ? { startedAt: { gte: from, lte: to } } : {}),
    },
    orderBy: { startedAt: 'desc' },
  })
  res.json(trips.map(mapTrip))
})

tripsRouter.post('/draft', async (req, res) => {
  try {
    const body = z
      .object({
        points: z.array(
          z.object({
            lat: z.number(),
            lng: z.number(),
            timestamp: z.number(),
            speedKmh: z.number().optional(),
          })
        ),
        startedAt: z.string(),
        endedAt: z.string(),
        distanceKm: z.number(),
        isCommute: z.boolean().optional(),
      })
      .parse(req.body)

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
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors })
    res.status(500).json({ error: 'Failed to create trip draft' })
  }
})

tripsRouter.post('/manual', async (req, res) => {
  try {
    const body = z
      .object({
        startedAt: z.string(),
        endedAt: z.string(),
        distanceKm: z.number(),
        confirmedMode: z.string(),
        isCommute: z.boolean().optional(),
        vehicleId: z.string().optional(),
      })
      .parse(req.body)

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
    res.status(201).json(mapTrip(trip))
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors })
    res.status(500).json({ error: 'Failed to create manual trip' })
  }
})

tripsRouter.patch('/:id/confirm', async (req, res) => {
  try {
    const body = z
      .object({
        confirmedMode: z.string(),
        vehicleId: z.string().optional(),
        isCommute: z.boolean().optional(),
      })
      .parse(req.body)

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
    res.json(mapTrip(updated))
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors })
    res.status(500).json({ error: 'Failed to confirm trip' })
  }
})
