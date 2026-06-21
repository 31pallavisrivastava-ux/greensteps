import {
  aggregateFootprint,
  getFactor,
} from '../emissions/engine.js'

function weekWindow(weeksAgo) {
  const now = new Date()
  const end = new Date(now)
  end.setUTCDate(end.getUTCDate() - weeksAgo * 7)
  const day = end.getUTCDay()
  end.setUTCDate(end.getUTCDate() - day)
  end.setUTCHours(23, 59, 59, 999)

  const start = new Date(end)
  start.setUTCDate(start.getUTCDate() - 6)
  start.setUTCHours(0, 0, 0, 0)

  return { start, end }
}

async function footprintForWindow(prisma, userId, from, to) {
  const [trips, fuel, energy, orders] = await Promise.all([
    prisma.trip.findMany({
      where: { userId, startedAt: { gte: from, lte: to }, co2eKg: { not: null } },
    }),
    prisma.fuelPurchase.findMany({
      where: { userId, purchasedAt: { gte: from, lte: to } },
    }),
    prisma.energyReading.findMany({
      where: { userId, periodStart: { lte: to }, periodEnd: { gte: from } },
    }),
    prisma.deliveryOrder.findMany({
      where: { userId, orderedAt: { gte: from, lte: to } },
    }),
  ])

  const scope1 = fuel.reduce((s, f) => s + f.co2eKg, 0)
  const scope2 = energy.reduce((s, e) => s + e.co2eKg, 0)
  const scope3 =
    trips.reduce((s, t) => s + (t.co2eKg ?? 0), 0) +
    orders.reduce((s, o) => s + o.deliveryCo2eKg, 0)

  return {
    scope1,
    scope2,
    scope3,
    total: scope1 + scope2 + scope3,
    tripCount: trips.length,
    orderCount: orders.length,
  }
}

export async function getWeeklyHistory(prisma, userId, weeks = 12) {
  const points = []

  for (let w = weeks - 1; w >= 0; w--) {
    const { start, end } = weekWindow(w)
    const fp = await footprintForWindow(prisma, userId, start, end)
    const label = start.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
    points.push({
      weekStart: start.toISOString(),
      weekEnd: end.toISOString(),
      label,
      ...fp,
    })
  }

  const current = points[points.length - 1]?.total ?? 0
  const previous = points[points.length - 2]?.total ?? 0
  const deltaKg = Math.round((previous - current) * 10) / 10

  return {
    weeks: points,
    trend: {
      deltaKg,
      direction: deltaKg > 0.5 ? 'down' : deltaKg < -0.5 ? 'up' : 'flat',
      message:
        deltaKg > 0.5
          ? `${deltaKg} kg less than last week`
          : deltaKg < -0.5
            ? `${Math.abs(deltaKg)} kg more than last week`
            : 'About the same as last week',
    },
  }
}

export async function explainFootprint(prisma, userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  const footprint = await aggregateFootprint(prisma, userId, 'week')
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)

  const [fuel, energy, trips, orders] = await Promise.all([
    prisma.fuelPurchase.findMany({
      where: { userId, purchasedAt: { gte: weekAgo } },
      orderBy: { purchasedAt: 'desc' },
    }),
    prisma.energyReading.findMany({
      where: { userId, periodEnd: { gte: weekAgo } },
      orderBy: { periodEnd: 'desc' },
    }),
    prisma.trip.findMany({
      where: { userId, startedAt: { gte: weekAgo }, co2eKg: { not: null } },
      orderBy: { startedAt: 'desc' },
      take: 10,
    }),
    prisma.deliveryOrder.findMany({
      where: { userId, orderedAt: { gte: weekAgo } },
      orderBy: { orderedAt: 'desc' },
    }),
  ])

  const region = user?.state?.startsWith('IN') ? user.state : user?.state ? `IN-${user.state}` : 'IN'
  const gridFactor = await getFactor(prisma, 'grid_electricity', region)
  const petrolFactor = await getFactor(prisma, 'petrol')

  const lines = []

  for (const e of energy) {
    const netKwh = Math.max(0, e.kwh - (e.solarOffsetKwh ?? 0))
    lines.push({
      scope: 'Scope 2',
      category: 'Electricity',
      label: `${e.kwh} kWh bill`,
      co2eKg: Math.round(e.co2eKg * 10) / 10,
      formula: `${netKwh} kWh × ${gridFactor?.value ?? 0.7117} kg/kWh`,
      source: gridFactor?.source ?? 'CEA_V21',
      detail: e.lpgKg > 0 ? `Includes ${e.lpgKg} kg LPG` : undefined,
    })
  }

  for (const f of fuel) {
    lines.push({
      scope: 'Scope 1',
      category: 'Fuel',
      label: `${f.liters}L ${f.fuelType}`,
      co2eKg: Math.round(f.co2eKg * 10) / 10,
      formula: `${f.liters} L × ${petrolFactor?.value ?? 2.31} kg/L`,
      source: petrolFactor?.source ?? 'IPCC',
    })
  }

  for (const t of trips.slice(0, 5)) {
    lines.push({
      scope: 'Scope 3',
      category: 'Travel',
      label: `${t.confirmedMode} ${t.distanceKm.toFixed(1)} km`,
      co2eKg: Math.round((t.co2eKg ?? 0) * 10) / 10,
      formula: `${t.distanceKm.toFixed(1)} km × mode factor`,
      source: 'e-AMRIT / IPCC',
    })
  }

  for (const o of orders) {
    lines.push({
      scope: 'Scope 3',
      category: 'Delivery',
      label: `${o.merchant.replace(/_/g, ' ')} order`,
      co2eKg: Math.round(o.deliveryCo2eKg * 100) / 100,
      formula: `Delivery + ${o.plasticGrams.toFixed(0)}g plastic packaging`,
      source: 'Merchant defaults',
    })
  }

  lines.sort((a, b) => b.co2eKg - a.co2eKg)

  return {
    totalKg: Math.round(footprint.total * 10) / 10,
    scope1: Math.round(footprint.scope1 * 10) / 10,
    scope2: Math.round(footprint.scope2 * 10) / 10,
    scope3: Math.round(footprint.scope3 * 10) / 10,
    lines,
    topLine: lines[0] ?? null,
  }
}
