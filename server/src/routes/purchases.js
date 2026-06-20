import { Router } from 'express'
import { z } from 'zod'
import { MERCHANTS, getMerchantInfo } from '@carbon/shared'
import { prisma } from '../lib/prisma.js'
import { authMiddleware } from '../middleware/auth.js'
import { computeOrderEmissions } from '../modules/emissions/engine.js'

export const purchasesRouter = Router()
purchasesRouter.use(authMiddleware)

purchasesRouter.get('/merchants', async (_req, res) => {
  const defaults = await prisma.merchantPackagingDefault.findMany()
  res.json(
    MERCHANTS.map((m) => {
      const d = defaults.find((x) => x.merchant === m.merchant)
      return { ...m, ...(d ?? {}) }
    })
  )
})

purchasesRouter.get('/', async (req, res) => {
  const from = req.query.from ? new Date(req.query.from) : undefined
  const to = req.query.to ? new Date(req.query.to) : undefined
  const merchant = req.query.merchant

  const orders = await prisma.deliveryOrder.findMany({
    where: {
      userId: req.userId,
      ...(merchant ? { merchant } : {}),
      ...(from && to ? { orderedAt: { gte: from, lte: to } } : {}),
    },
    include: { lineItems: true },
    orderBy: { orderedAt: 'desc' },
  })
  res.json(orders)
})

purchasesRouter.post('/orders', async (req, res) => {
  try {
    const body = z
      .object({
        merchant: z.enum(['BLINKIT', 'ZEPTO', 'SWIGGY_INSTAMART', 'SWIGGY_FOOD', 'ZOMATO']),
        orderedAt: z.string(),
        amountInr: z.number().optional(),
        lineItems: z.array(
          z.object({
            catalogId: z.string().optional(),
            label: z.string(),
            quantity: z.number().int().positive(),
          })
        ),
      })
      .parse(req.body)

    const merchantInfo = getMerchantInfo(body.merchant)
    const merchantDefault = await prisma.merchantPackagingDefault.findUnique({
      where: { id: body.merchant },
    })
    const defaults = merchantDefault ?? {
      defaultBagGrams: merchantInfo.defaultBagGrams,
      defaultContainerGrams: merchantInfo.defaultContainerGrams,
      defaultCutleryGrams: merchantInfo.defaultCutleryGrams,
      deliveryCo2eKgDefault: merchantInfo.deliveryCo2eKgDefault,
    }

    const catalogIds = body.lineItems.map((i) => i.catalogId).filter(Boolean)
    const catalogItems = catalogIds.length
      ? await prisma.packagingCatalogItem.findMany({ where: { id: { in: catalogIds } } })
      : []

    const emissions = await computeOrderEmissions(
      prisma,
      defaults,
      body.lineItems,
      catalogItems
    )

    const order = await prisma.deliveryOrder.create({
      data: {
        userId: req.userId,
        merchant: body.merchant,
        orderType: merchantInfo.orderType,
        orderedAt: new Date(body.orderedAt),
        itemCount: body.lineItems.reduce((s, i) => s + i.quantity, 0),
        amountInr: body.amountInr,
        deliveryCo2eKg: emissions.deliveryCo2eKg,
        plasticGrams: emissions.plasticGrams,
        packagingGrams: emissions.packagingGrams,
        source: 'MANUAL',
        lineItems: {
          create: body.lineItems.map((item) => {
            const catalog = catalogItems.find((c) => c.id === item.catalogId)
            return {
              catalogId: item.catalogId,
              label: item.label,
              quantity: item.quantity,
              plasticGrams: (catalog?.plasticGramsPerUnit ?? 5) * item.quantity,
              co2eKg: (catalog?.co2ePerUnitKg ?? 0) * item.quantity,
            }
          }),
        },
      },
      include: { lineItems: true },
    })

    await prisma.plasticEvent.create({
      data: {
        userId: req.userId,
        occurredAt: order.orderedAt,
        source: 'PURCHASE',
        plasticType: 'LDPE',
        grams: order.plasticGrams,
        orderId: order.id,
        confidence: 0.75,
        notes: `Auto from ${body.merchant} order`,
      },
    })

    res.status(201).json(order)
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors })
    console.error(e)
    res.status(500).json({ error: 'Failed to create order' })
  }
})

purchasesRouter.post('/ocr', async (req, res) => {
  res.status(501).json({
    error: 'OCR not implemented yet',
    message: 'Phase 2: upload order screenshot with ?merchant=BLINKIT',
    merchant: req.query.merchant,
    stub: true,
  })
})

purchasesRouter.post('/email-ingest', async (_req, res) => {
  res.status(501).json({
    error: 'Email ingest not implemented yet',
    message: 'Phase 2: forward order confirmation emails',
    stub: true,
  })
})
