import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { authMiddleware } from '../middleware/auth.js'
import { computeFuelEmissions } from '../modules/emissions/engine.js'

export const fuelRouter = Router()
fuelRouter.use(authMiddleware)

fuelRouter.get('/', async (req, res) => {
  const purchases = await prisma.fuelPurchase.findMany({
    where: { userId: req.userId },
    orderBy: { purchasedAt: 'desc' },
    include: { vehicle: true },
  })
  res.json(purchases)
})

fuelRouter.post('/', async (req, res) => {
  try {
    const body = z
      .object({
        vehicleId: z.string().optional(),
        purchasedAt: z.string(),
        liters: z.number().positive(),
        amountInr: z.number().optional(),
        fuelType: z.enum(['PETROL', 'DIESEL', 'CNG', 'EV']).optional(),
      })
      .parse(req.body)

    let fuelType = body.fuelType ?? 'PETROL'
    if (body.vehicleId) {
      const vehicle = await prisma.vehicle.findFirst({
        where: { id: body.vehicleId, userId: req.userId },
      })
      if (vehicle) fuelType = vehicle.fuelType
    }

    const { co2eKg } = await computeFuelEmissions(prisma, body.liters, fuelType)
    const purchase = await prisma.fuelPurchase.create({
      data: {
        userId: req.userId,
        vehicleId: body.vehicleId,
        purchasedAt: new Date(body.purchasedAt),
        liters: body.liters,
        amountInr: body.amountInr,
        fuelType,
        co2eKg,
      },
    })
    res.status(201).json(purchase)
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors })
    res.status(500).json({ error: 'Failed to log fuel purchase' })
  }
})

fuelRouter.post('/ocr', async (req, res) => {
  res.status(501).json({
    error: 'OCR not implemented yet',
    message: 'Phase 2: upload fuel receipt image for automatic parsing',
    stub: true,
  })
})
