import { Router } from 'express'
import { z } from 'zod'
import { authMiddleware } from '../middleware/auth.js'
import { prisma } from '../lib/prisma.js'

export const packagingRouter = Router()

packagingRouter.get('/catalog', async (req, res) => {
  const orderType = req.query.orderType
  const items = await prisma.packagingCatalogItem.findMany()
  const filtered = orderType
    ? items.filter((i) => i.orderTypes.includes(String(orderType)))
    : items
  res.json(
    filtered.map((i) => ({
      id: i.id,
      category: i.category,
      label: i.label,
      orderTypes: [i.orderTypes],
      plasticGramsPerUnit: i.plasticGramsPerUnit,
      plasticType: i.plasticType,
      co2ePerUnitKg: i.co2ePerUnitKg,
    }))
  )
})

export const usersRouter = Router()
usersRouter.use(authMiddleware)

usersRouter.get('/me', async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    include: { vehicles: true },
  })
  if (!user) return res.status(404).json({ error: 'Not found' })
  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    state: user.state,
    homeLat: user.homeLat,
    homeLng: user.homeLng,
    workLat: user.workLat,
    workLng: user.workLng,
    vehicles: user.vehicles,
  })
})

usersRouter.patch('/me', async (req, res) => {
  try {
    const body = z
      .object({
        name: z.string().optional(),
        state: z.string().optional(),
        homeLat: z.number().optional(),
        homeLng: z.number().optional(),
        workLat: z.number().optional(),
        workLng: z.number().optional(),
      })
      .parse(req.body)

    const user = await prisma.user.update({
      where: { id: req.userId },
      data: body,
      include: { vehicles: true },
    })
    res.json(user)
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors })
    res.status(500).json({ error: 'Update failed' })
  }
})

usersRouter.post('/vehicles', async (req, res) => {
  try {
    const body = z
      .object({
        label: z.string(),
        fuelType: z.enum(['PETROL', 'DIESEL', 'CNG', 'EV']),
        mileageKmpl: z.number().optional(),
      })
      .parse(req.body)

    const vehicle = await prisma.vehicle.create({
      data: { userId: req.userId, ...body },
    })
    res.status(201).json(vehicle)
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors })
    res.status(500).json({ error: 'Failed to add vehicle' })
  }
})
