export function weekAgoDate(days = 7) {
  const since = new Date()
  since.setDate(since.getDate() - days)
  return since
}

/** Fetch trips, orders, and energy logged in the last N days. */
export async function fetchWeeklyActivity(prisma, userId, options = {}) {
  const days = options.days ?? 7
  const since = weekAgoDate(days)
  const includeEnergy = options.includeEnergy !== false
  const includeUnconfirmed = options.includeUnconfirmed === true

  const [trips, orders, energy, unconfirmedTrips] = await Promise.all([
    prisma.trip.findMany({
      where: { userId, startedAt: { gte: since }, confirmedMode: { not: null } },
    }),
    prisma.deliveryOrder.findMany({
      where: { userId, orderedAt: { gte: since } },
    }),
    includeEnergy
      ? prisma.energyReading.findMany({
          where: { userId, periodEnd: { gte: since } },
        })
      : Promise.resolve([]),
    includeUnconfirmed
      ? prisma.trip.count({
          where: { userId, confirmedMode: null, startedAt: { gte: since } },
        })
      : Promise.resolve(undefined),
  ])

  return { trips, orders, energy, since, unconfirmedTrips }
}
