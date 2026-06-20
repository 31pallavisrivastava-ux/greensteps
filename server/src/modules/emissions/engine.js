import { modeToCategory } from '@carbon/shared'

const MODE_FACTOR_MAP = {
  WALK: 'walk_km',
  CYCLE: 'cycle_km',
  METRO: 'metro_km',
  BUS: 'bus_km',
  TRAIN: 'bus_km',
  CAR: 'car_km',
  BIKE: 'bike_km',
  TAXI: 'car_km',
  AUTO: 'bus_km',
}

const FUEL_FACTOR_MAP = {
  PETROL: 'petrol',
  DIESEL: 'diesel',
  CNG: 'cng',
  EV: null,
}

export async function getFactor(prisma, category, region = 'IN') {
  const regional = await prisma.emissionFactor.findFirst({
    where: { category, region },
    orderBy: { validFrom: 'desc' },
  })
  if (regional) return regional
  return prisma.emissionFactor.findFirst({
    where: { category, region: 'IN' },
    orderBy: { validFrom: 'desc' },
  })
}

export async function getAllFactors(prisma) {
  return prisma.emissionFactor.findMany({ orderBy: { category: 'asc' } })
}

export function inferModeFromPoints(points, distanceKm) {
  if (!points.length || distanceKm < 0.1) {
    return { mode: 'WALK', confidence: 0.5 }
  }
  const speeds = points
    .map((p) => p.speedKmh ?? 0)
    .filter((s) => s > 0)
  const avgSpeed =
    speeds.length > 0
      ? speeds.reduce((a, b) => a + b, 0) / speeds.length
      : distanceKm / Math.max(1, (points.length * 30) / 3600)

  if (avgSpeed < 6) return { mode: 'WALK', confidence: 0.75 }
  if (avgSpeed < 18) return { mode: 'CYCLE', confidence: 0.65 }
  if (avgSpeed < 35) return { mode: 'BUS', confidence: 0.6 }
  if (avgSpeed < 55) return { mode: 'CAR', confidence: 0.7 }
  return { mode: 'METRO', confidence: 0.55 }
}

export async function computeTripEmissions(prisma, trip, vehicle, userState) {
  const mode = trip.confirmedMode ?? trip.suggestedMode
  const categoryKey = MODE_FACTOR_MAP[mode] ?? 'car_km'
  const factor = await getFactor(prisma, categoryKey, userState ? `IN-${userState}` : 'IN')
  const perKm = factor?.value ?? 0.192
  const co2eKg = trip.distanceKm * perKm

  let fuelLitersEst = null
  if (vehicle && vehicle.mileageKmpl && vehicle.fuelType !== 'EV') {
    fuelLitersEst = trip.distanceKm / vehicle.mileageKmpl
    const fuelCat = FUEL_FACTOR_MAP[vehicle.fuelType]
    if (fuelCat) {
      const fuelFactor = await getFactor(prisma, fuelCat)
      if (fuelFactor) {
        return {
          co2eKg: fuelLitersEst * fuelFactor.value,
          fuelLitersEst,
          factorSource: fuelFactor.source,
        }
      }
    }
  }

  return { co2eKg, fuelLitersEst, factorSource: factor?.source ?? 'e-AMRIT' }
}

export async function computeFuelEmissions(prisma, liters, fuelType) {
  const cat = FUEL_FACTOR_MAP[fuelType] ?? 'petrol'
  const factor = await getFactor(prisma, cat)
  return {
    co2eKg: liters * (factor?.value ?? 2.31),
    factorSource: factor?.source ?? 'IPCC',
  }
}

export async function computeEnergyEmissions(prisma, kwh, solarOffsetKwh, lpgKg, state) {
  const region = state?.startsWith('IN') ? state : state ? `IN-${state}` : 'IN'
  const gridFactor = await getFactor(prisma, 'grid_electricity', region)
  const lpgFactor = await getFactor(prisma, 'lpg')
  const netKwh = Math.max(0, kwh - (solarOffsetKwh ?? 0))
  const gridCo2 = netKwh * (gridFactor?.value ?? 0.7117)
  const lpgCo2 = (lpgKg ?? 0) * (lpgFactor?.value ?? 1.51)
  return {
    co2eKg: gridCo2 + lpgCo2,
    factorSource: gridFactor?.source ?? 'CEA_V21',
  }
}

export async function computeOrderEmissions(prisma, merchantDefault, lineItems, catalogItems) {
  const packagingGrams =
    merchantDefault.defaultBagGrams +
    merchantDefault.defaultContainerGrams +
    merchantDefault.defaultCutleryGrams

  let itemPlastic = 0
  let productCo2e = 0
  for (const item of lineItems) {
    const catalog = item.catalogId
      ? catalogItems.find((c) => c.id === item.catalogId)
      : null
    const plasticPer = catalog?.plasticGramsPerUnit ?? 5
    itemPlastic += plasticPer * item.quantity
    productCo2e += (catalog?.co2ePerUnitKg ?? 0) * item.quantity
  }

  const deliveryCo2eKg = merchantDefault.deliveryCo2eKgDefault
  return {
    deliveryCo2eKg,
    productCo2eKg: productCo2e,
    plasticGrams: packagingGrams + itemPlastic,
    packagingGrams: packagingGrams,
  }
}

export function transportCategoryForMode(mode) {
  return modeToCategory(mode)
}

function startOfPeriod(date, period) {
  const d = new Date(date)
  if (period === 'week') {
    const day = d.getUTCDay()
    d.setUTCDate(d.getUTCDate() - day)
    d.setUTCHours(0, 0, 0, 0)
  } else {
    d.setUTCDate(1)
    d.setUTCHours(0, 0, 0, 0)
  }
  return d
}

function endOfPeriod(date) {
  const d = new Date(date)
  d.setUTCHours(23, 59, 59, 999)
  return d
}

export async function aggregateFootprint(prisma, userId, period = 'month') {
  const from = startOfPeriod(new Date(), period)
  const to = endOfPeriod(new Date())

  const [trips, fuel, energy, orders] = await Promise.all([
    prisma.trip.findMany({
      where: { userId, startedAt: { gte: from, lte: to }, co2eKg: { not: null } },
    }),
    prisma.fuelPurchase.findMany({
      where: { userId, purchasedAt: { gte: from, lte: to } },
    }),
    prisma.energyReading.findMany({
      where: {
        userId,
        periodStart: { lte: to },
        periodEnd: { gte: from },
      },
    }),
    prisma.deliveryOrder.findMany({
      where: { userId, orderedAt: { gte: from, lte: to } },
    }),
  ])

  let scope1 = fuel.reduce((s, f) => s + f.co2eKg, 0)
  let scope2 = energy.reduce((s, e) => s + e.co2eKg, 0)
  let scope3 =
    trips.reduce((s, t) => s + (t.co2eKg ?? 0), 0) +
    orders.reduce((s, o) => s + o.deliveryCo2eKg, 0)

  const byCategory = {
    commute: trips.reduce((s, t) => s + (t.co2eKg ?? 0), 0),
    fuel: scope1,
    energy: scope2,
    delivery: orders.reduce((s, o) => s + o.deliveryCo2eKg, 0),
  }

  const byMerchant = {}
  for (const o of orders) {
    byMerchant[o.merchant] = (byMerchant[o.merchant] ?? 0) + o.deliveryCo2eKg + o.plasticGrams * 0.001
  }

  const factors = await getAllFactors(prisma)
  const factorCitations = [...new Set(factors.map((f) => `${f.source}: ${f.category}`))].slice(0, 5)

  return {
    scope1,
    scope2,
    scope3,
    total: scope1 + scope2 + scope3,
    byCategory,
    byMerchant,
    factorCitations,
  }
}

export async function aggregatePlastic(prisma, userId, period = 'week') {
  const from = startOfPeriod(new Date(), period)
  const to = endOfPeriod(new Date())

  const events = await prisma.plasticEvent.findMany({
    where: { userId, occurredAt: { gte: from, lte: to } },
    include: { order: true },
  })

  let purchaseG = 0
  let disposalG = 0
  let recycledG = 0
  let landfillG = 0
  const byType = {}
  const byMerchant = {}

  for (const e of events) {
    if (e.source === 'PURCHASE') purchaseG += e.grams
    else disposalG += e.grams

    if (e.disposalMethod === 'RECYCLED') recycledG += e.grams
    if (e.disposalMethod === 'LANDFILL') landfillG += e.grams

    byType[e.plasticType] = (byType[e.plasticType] ?? 0) + e.grams
    if (e.order?.merchant) {
      byMerchant[e.order.merchant] = (byMerchant[e.order.merchant] ?? 0) + e.grams
    }
  }

  return { purchaseG, disposalG, recycledG, landfillG, byType, byMerchant }
}

export function compareScenarios(footprint, plastic, trips, orders) {
  const carFactor = 0.192
  const privateKm = trips
    .filter((t) => t.transportCategory === 'PRIVATE')
    .reduce((s, t) => s + t.distanceKm, 0)
  const shiftSaved = privateKm * 0.1 * carFactor

  const orderCo2 = orders.slice(0, 2).reduce((s, o) => s + o.deliveryCo2eKg, 0)
  const orderPlastic = orders.slice(0, 2).reduce((s, o) => s + o.plasticGrams, 0)

  return {
    shift10pctToPublic: { savedKg: Math.round(shiftSaved * 100) / 100 },
    reduceDeliveryOrdersBy2: {
      savedPlasticG: Math.round(orderPlastic),
      savedCo2eKg: Math.round(orderCo2 * 100) / 100,
    },
  }
}
