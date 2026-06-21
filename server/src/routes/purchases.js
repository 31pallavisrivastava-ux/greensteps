import { MERCHANTS, getMerchantInfo } from '@carbon/shared'
import { prisma } from '../lib/prisma.js'
import { parseOptionalDate } from '../lib/http.js'
import { authRouter, route, withBody, created, notImplemented } from '../lib/router.js'
import { deliveryOrderSchema } from '../lib/schemas/purchases.js'
import { computeOrderEmissions } from '../modules/emissions/engine.js'

export const purchasesRouter = authRouter()

purchasesRouter.get(
  '/merchants',
  route(async (_req, res) => {
    const defaults = await prisma.merchantPackagingDefault.findMany()
    res.json(
      MERCHANTS.map((m) => {
        const d = defaults.find((x) => x.merchant === m.merchant)
        return { ...m, ...(d ?? {}) }
      })
    )
  })
)

purchasesRouter.get(
  '/',
  route(async (req, res) => {
    const from = parseOptionalDate(req.query.from, 'from')
    const to = parseOptionalDate(req.query.to, 'to')
    const merchant = req.query.merchant

    res.json(
      await prisma.deliveryOrder.findMany({
        where: {
          userId: req.userId,
          ...(merchant ? { merchant: String(merchant) } : {}),
          ...(from && to ? { orderedAt: { gte: from, lte: to } } : {}),
        },
        include: { lineItems: true },
        orderBy: { orderedAt: 'desc' },
      })
    )
  })
)

purchasesRouter.post(
  '/orders',
  ...withBody(deliveryOrderSchema, async (req, res) => {
    const body = req.body
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

    const emissions = await computeOrderEmissions(prisma, defaults, body.lineItems, catalogItems)

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

    created(res, order)
  })
)

purchasesRouter.post(
  '/ocr',
  route((req, res) => {
    res.status(501).json({
      error: 'Not implemented yet',
      message: 'Phase 2: upload order screenshot with ?merchant=BLINKIT',
      merchant: req.query.merchant,
      stub: true,
    })
  })
)

purchasesRouter.post('/email-ingest', notImplemented('Phase 2: forward order confirmation emails'))
