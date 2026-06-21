import { aggregateFootprint, aggregatePlastic } from '../emissions/engine.js'

export async function getTodayAction(prisma, userId, user) {
  const footprint = await aggregateFootprint(prisma, userId, 'week')
  const plastic = await aggregatePlastic(prisma, userId, 'week')
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)

  const [trips, orders, unconfirmed, energyReadings] = await Promise.all([
    prisma.trip.findMany({
      where: { userId, startedAt: { gte: weekAgo }, confirmedMode: { not: null } },
    }),
    prisma.deliveryOrder.findMany({
      where: { userId, orderedAt: { gte: weekAgo } },
    }),
    prisma.trip.count({
      where: { userId, confirmedMode: null, startedAt: { gte: weekAgo } },
    }),
    prisma.energyReading.count({
      where: { userId, periodEnd: { gte: weekAgo } },
    }),
  ])

  const total = footprint.total || 1
  const powerShare = footprint.scope2 / total
  const deliveryCount = orders.length
  const publicTrips = trips.filter((t) => t.transportCategory === 'PUBLIC').length

  const concern = user?.topConcern ?? null

  if (unconfirmed > 0) {
    return {
      id: 'confirm-trips',
      title: 'Confirm your trips',
      message: `${unconfirmed} trip${unconfirmed > 1 ? 's' : ''} need a travel mode so we count CO₂ correctly.`,
      actionLabel: 'Confirm trips',
      link: '/trips',
      impactHint: 'Accurate data → better insights',
      emoji: '🚌',
      priority: 100,
    }
  }

  if ((concern === 'POWER' || powerShare > 0.5) && energyReadings === 0) {
    return {
      id: 'scan-bill',
      title: 'Scan your electricity bill',
      message: 'Power is your biggest driver this week. Photo-scan kWh from your bill in seconds.',
      actionLabel: 'Scan bill',
      link: '/energy?scan=1',
      impactHint: 'Unlock accurate Scope 2 tracking',
      emoji: '⚡',
      priority: 95,
    }
  }

  if ((concern === 'DELIVERY' || deliveryCount >= 2) && deliveryCount > 0) {
    return {
      id: 'delivery-free',
      title: 'Try a delivery-free day',
      message: `You logged ${deliveryCount} orders this week. Skip apps today — cook or carry snacks.`,
      actionLabel: 'Open guide',
      link: '/guide?context=home',
      impactHint: '~0.08 kg + plastic saved per order skipped',
      emoji: '📦',
      priority: 90,
    }
  }

  if ((concern === 'TRAVEL' || user?.transportPreference === 'CAR') && publicTrips < 2) {
    return {
      id: 'public-transport',
      title: 'Take bus or metro once',
      message: 'One public trip can save up to 2 kg CO₂ vs a solo car ride.',
      actionLabel: 'Log a trip',
      link: '/trips',
      impactHint: 'Challenge: 5 bus/metro trips this week',
      emoji: '🚇',
      priority: 85,
    }
  }

  if (concern === 'PLASTIC' || plastic.landfillG > plastic.recycledG) {
    return {
      id: 'recycle-plastic',
      title: 'Log recycled plastic',
      message: 'Segregate and log what you recycled — it counts toward your streak.',
      actionLabel: 'Log plastic',
      link: '/plastic',
      impactHint: 'Challenge: recycle 100g this week',
      emoji: '♻️',
      priority: 80,
    }
  }

  if (powerShare > 0.4) {
    return {
      id: 'reduce-power',
      title: 'Cut power use today',
      message: `${Math.round(powerShare * 100)}% of your footprint is electricity. Try fan instead of AC at 26°C.`,
      actionLabel: 'Home checklist',
      link: '/guide?context=home',
      impactHint: 'Each 1°C higher on AC ≈ 6% less power',
      emoji: '💡',
      priority: 75,
    }
  }

  return {
    id: 'daily-log',
    title: 'Log something from today',
    message: 'A quick log keeps your weekly picture accurate and unlocks personalized tips.',
    actionLabel: 'Open log',
    link: '/log',
    impactHint: 'Takes under 1 minute',
    emoji: '✅',
    priority: 50,
  }
}
