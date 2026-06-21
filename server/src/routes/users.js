import { prisma } from '../lib/prisma.js'
import { serializeUser } from '../lib/userProfile.js'
import { authRouter, route, withBody, created } from '../lib/router.js'
import { createVehicleSchema, updateProfileSchema } from '../lib/schemas/user.js'
import { INDIAN_CITIES } from '../modules/engage/engine.js'
import { Router } from 'express'

export const packagingRouter = Router()

packagingRouter.get(
  '/catalog',
  route(async (req, res) => {
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
)

export const usersRouter = authRouter()

usersRouter.get(
  '/me',
  route(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { vehicles: true },
    })
    if (!user) return res.status(404).json({ error: 'Not found' })
    res.json(serializeUser(user))
  })
)

usersRouter.patch(
  '/me',
  ...withBody(updateProfileSchema, async (req, res) => {
    const body = req.body
    const data = { ...body }
    if (body.city && INDIAN_CITIES[body.city]) {
      const meta = INDIAN_CITIES[body.city]
      data.state = meta.state
      data.homeLat = meta.lat
      data.homeLng = meta.lng
    }

    const user = await prisma.user.update({
      where: { id: req.userId },
      data,
      include: { vehicles: true },
    })
    res.json(serializeUser(user))
  })
)

usersRouter.post(
  '/vehicles',
  ...withBody(createVehicleSchema, async (req, res) => {
    created(
      res,
      await prisma.vehicle.create({
        data: { userId: req.userId, ...req.body },
      })
    )
  })
)
