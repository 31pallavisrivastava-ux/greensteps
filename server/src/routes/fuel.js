import { prisma } from '../lib/prisma.js'
import { authRouter, route, withBody, created, notImplemented } from '../lib/router.js'
import { fuelPurchaseSchema } from '../lib/schemas/fuel.js'
import { computeFuelEmissions } from '../modules/emissions/engine.js'

export const fuelRouter = authRouter()

fuelRouter.get(
  '/',
  route(async (req, res) => {
    res.json(
      await prisma.fuelPurchase.findMany({
        where: { userId: req.userId },
        orderBy: { purchasedAt: 'desc' },
        include: { vehicle: true },
      })
    )
  })
)

fuelRouter.post(
  '/',
  ...withBody(fuelPurchaseSchema, async (req, res) => {
    const body = req.body
    let fuelType = body.fuelType ?? 'PETROL'
    if (body.vehicleId) {
      const vehicle = await prisma.vehicle.findFirst({
        where: { id: body.vehicleId, userId: req.userId },
      })
      if (vehicle) fuelType = vehicle.fuelType
    }

    const { co2eKg } = await computeFuelEmissions(prisma, body.liters, fuelType)
    created(
      res,
      await prisma.fuelPurchase.create({
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
    )
  })
)

fuelRouter.post('/ocr', notImplemented('Phase 2: upload fuel receipt image for automatic parsing'))
