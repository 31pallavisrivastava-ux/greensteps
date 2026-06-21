import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { aggregateFootprint, aggregatePlastic } from '../emissions/engine.js'
import { computeWeeklyRewards } from '../rewards/engine.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

const CHALLENGE_DEFS = JSON.parse(
  readFileSync(join(__dirname, '../../../data/challenges.json'), 'utf-8')
)
const INDIAN_CITIES = JSON.parse(
  readFileSync(join(__dirname, '../../../data/indian-cities.json'), 'utf-8')
)

/** IPCC-aligned ~2.3 t CO₂e/person/year for 1.5°C equity budget (2030 pathway) */
export const ANNUAL_FAIR_SHARE_KG = 2300
export const WEEKLY_FAIR_SHARE_KG = Math.round((ANNUAL_FAIR_SHARE_KG / 52) * 10) / 10

function weekBounds() {
  const now = new Date()
  const from = new Date(now)
  const day = from.getUTCDay()
  from.setUTCDate(from.getUTCDate() - day)
  from.setUTCHours(0, 0, 0, 0)
  const to = new Date(now)
  to.setUTCHours(23, 59, 59, 999)
  return { from, to }
}

function dayKey(d) {
  return d.toISOString().slice(0, 10)
}

function consecutiveDaysFromToday(daySet) {
  let streak = 0
  const cursor = new Date()
  cursor.setUTCHours(0, 0, 0, 0)
  while (daySet.has(dayKey(cursor))) {
    streak += 1
    cursor.setUTCDate(cursor.getUTCDate() - 1)
  }
  return streak
}

export async function computeStreaks(prisma, userId) {
  const { from } = weekBounds()
  const lookback = new Date(from)
  lookback.setUTCDate(lookback.getUTCDate() - 30)

  const [orders, trips] = await Promise.all([
    prisma.deliveryOrder.findMany({
      where: { userId, orderedAt: { gte: lookback } },
      select: { orderedAt: true },
    }),
    prisma.trip.findMany({
      where: {
        userId,
        startedAt: { gte: lookback },
        confirmedMode: { not: null },
      },
      select: { startedAt: true, confirmedMode: true, transportCategory: true },
    }),
  ])

  const orderDays = new Set(orders.map((o) => dayKey(o.orderedAt)))
  const publicDays = new Set(
    trips
      .filter(
        (t) =>
          t.transportCategory === 'PUBLIC' ||
          ['BUS', 'METRO', 'TRAIN'].includes(t.confirmedMode)
      )
      .map((t) => dayKey(t.startedAt))
  )
  const activeDays = new Set(
    trips
      .filter((t) => ['WALK', 'CYCLE'].includes(t.confirmedMode))
      .map((t) => dayKey(t.startedAt))
  )

  const allDays = new Set()
  const cursor = new Date()
  cursor.setUTCHours(0, 0, 0, 0)
  for (let i = 0; i < 30; i++) {
    const k = dayKey(cursor)
    if (!orderDays.has(k)) allDays.add(k)
    cursor.setUTCDate(cursor.getUTCDate() - 1)
  }

  const deliveryFreeStreak = consecutiveDaysFromToday(allDays)
  const publicTransportStreak = consecutiveDaysFromToday(publicDays)
  const activeCommuteStreak = consecutiveDaysFromToday(activeDays)

  return [
    {
      id: 'delivery-free',
      label: 'Delivery-free streak',
      emoji: '📦',
      days: deliveryFreeStreak,
      best: deliveryFreeStreak,
      hint: 'Days without quick-commerce orders',
    },
    {
      id: 'public-transport',
      label: 'Public transport streak',
      emoji: '🚌',
      days: publicTransportStreak,
      best: publicTransportStreak,
      hint: 'Consecutive days with bus/metro/train',
    },
    {
      id: 'active-commute',
      label: 'Walk/cycle streak',
      emoji: '🚶',
      days: activeCommuteStreak,
      best: activeCommuteStreak,
      hint: 'Consecutive days walking or cycling',
    },
  ]
}

async function challengeProgress(prisma, userId, def, { from, to }) {
  switch (def.type) {
    case 'delivery_free_days': {
      const orders = await prisma.deliveryOrder.findMany({
        where: { userId, orderedAt: { gte: from, lte: to } },
        select: { orderedAt: true },
      })
      const orderDaySet = new Set(orders.map((o) => dayKey(o.orderedAt)))
      let freeDays = 0
      const cursor = new Date(from)
      while (cursor <= to) {
        if (!orderDaySet.has(dayKey(cursor))) freeDays += 1
        cursor.setUTCDate(cursor.getUTCDate() + 1)
      }
      return freeDays
    }
    case 'public_trips':
    case 'active_trips': {
      const modes = def.modes ?? []
      const trips = await prisma.trip.findMany({
        where: {
          userId,
          startedAt: { gte: from, lte: to },
          confirmedMode: { in: modes },
        },
      })
      return trips.length
    }
    case 'checklist': {
      const sessions = await prisma.contextChecklistSession.findMany({
        where: {
          userId,
          contextId: def.contextId,
          completedAt: { gte: from, lte: to },
        },
      })
      return sessions.length
    }
    case 'plastic_recycled': {
      const plastic = await aggregatePlastic(prisma, userId, 'week')
      return plastic.recycledG
    }
    default:
      return 0
  }
}

export async function computeWeeklyChallenges(prisma, userId) {
  const bounds = weekBounds()
  const results = []

  for (const def of CHALLENGE_DEFS) {
    const current = await challengeProgress(prisma, userId, def, bounds)
    const target = def.target
    const completed = current >= target
    results.push({
      id: def.id,
      title: def.title,
      description: def.description,
      emoji: def.emoji,
      target,
      current: Math.min(current, target),
      progressPct: Math.min(100, Math.round((current / target) * 100)),
      completed,
    })
  }

  return results
}

export function computeCarbonBudget(footprintTotalKg) {
  const usedKg = Math.round(footprintTotalKg * 10) / 10
  const fairShareKg = WEEKLY_FAIR_SHARE_KG
  const remainingKg = Math.round((fairShareKg - usedKg) * 10) / 10
  const usedPct = Math.min(100, Math.round((usedKg / fairShareKg) * 100))
  const overBudget = usedKg > fairShareKg

  let status = 'on_track'
  let statusLabel = 'On track'
  if (usedPct >= 100) {
    status = 'over'
    statusLabel = 'Over fair share'
  } else if (usedPct >= 80) {
    status = 'warning'
    statusLabel = 'Almost at limit'
  }

  return {
    usedKg,
    fairShareKg,
    remainingKg,
    usedPct,
    overBudget,
    status,
    statusLabel,
    annualFairShareKg: ANNUAL_FAIR_SHARE_KG,
    source: 'IPCC 1.5°C equity budget (~2.3 t/person/year)',
  }
}

function aqiCategory(usAqi) {
  if (usAqi <= 50) return { level: 'good', label: 'Good', color: '#22c55e' }
  if (usAqi <= 100) return { level: 'moderate', label: 'Moderate', color: '#eab308' }
  if (usAqi <= 150) return { level: 'unhealthy_sensitive', label: 'Unhealthy for sensitive groups', color: '#f97316' }
  if (usAqi <= 200) return { level: 'unhealthy', label: 'Unhealthy', color: '#ef4444' }
  if (usAqi <= 300) return { level: 'very_unhealthy', label: 'Very unhealthy', color: '#a855f7' }
  return { level: 'hazardous', label: 'Hazardous', color: '#7f1d1d' }
}

export function resolveCityCoords(user) {
  if (user.homeLat != null && user.homeLng != null) {
    return { lat: user.homeLat, lng: user.homeLng, city: user.city ?? 'Your area' }
  }
  const city = user.city ?? 'Delhi'
  const entry = INDIAN_CITIES[city]
  if (entry) return { lat: entry.lat, lng: entry.lng, city }
  return { lat: INDIAN_CITIES.Delhi.lat, lng: INDIAN_CITIES.Delhi.lng, city: 'Delhi' }
}

export async function fetchAqi(lat, lng, city) {
  try {
    const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lng}&current=us_aqi,pm2_5,pm10`
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) throw new Error('AQI fetch failed')
    const data = await res.json()
    const usAqi = Math.round(data.current?.us_aqi ?? 0)
    const cat = aqiCategory(usAqi)
    return {
      city,
      usAqi,
      pm25: data.current?.pm2_5 ?? null,
      pm10: data.current?.pm10 ?? null,
      level: cat.level,
      label: cat.label,
      color: cat.color,
      updatedAt: data.current?.time ?? new Date().toISOString(),
    }
  } catch {
    return {
      city,
      usAqi: null,
      pm25: null,
      pm10: null,
      level: 'unknown',
      label: 'Unavailable',
      color: '#94a3b8',
      updatedAt: null,
    }
  }
}

export function buildAqiNudge(aqi) {
  if (aqi.usAqi == null) {
    return {
      show: false,
      severity: 'info',
      title: 'Air quality',
      message: 'Set your city in profile for local AQI nudges.',
      action: 'Take metro or bus when you can',
    }
  }

  if (aqi.usAqi > 200) {
    return {
      show: true,
      severity: 'danger',
      title: 'Very poor air today',
      message: `${aqi.city} AQI is ${aqi.usAqi} (${aqi.label}). Avoid outdoor exertion and skip the car — take metro or bus with a mask.`,
      action: 'Prefer public transport',
    }
  }
  if (aqi.usAqi > 100) {
    return {
      show: true,
      severity: 'warning',
      title: 'High AQI today',
      message: `${aqi.city} AQI is ${aqi.usAqi}. Skip the car if you can — one less vehicle helps you and everyone breathe easier.`,
      action: 'Take bus or metro instead',
    }
  }
  if (aqi.usAqi > 50) {
    return {
      show: true,
      severity: 'info',
      title: 'Moderate air quality',
      message: `${aqi.city} AQI is ${aqi.usAqi}. Walking or cycling is fine; combine errands to avoid extra trips.`,
      action: 'Bundle trips together',
    }
  }
  return {
    show: true,
    severity: 'good',
    title: 'Good air today',
    message: `${aqi.city} AQI is ${aqi.usAqi} — great day for a walk or cycle commute!`,
    action: 'Walk or cycle if you can',
  }
}

export async function getEngageDashboard(prisma, userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  const footprint = await aggregateFootprint(prisma, userId, 'week')
  const { from } = weekBounds()
  const [trips, orders] = await Promise.all([
    prisma.trip.findMany({
      where: { userId, startedAt: { gte: from }, confirmedMode: { not: null } },
    }),
    prisma.deliveryOrder.findMany({
      where: { userId, orderedAt: { gte: from } },
    }),
  ])
  const plastic = await aggregatePlastic(prisma, userId, 'week')
  const rewards = computeWeeklyRewards({ trips, energy: [], plastic, orders })

  const [challenges, streaks] = await Promise.all([
    computeWeeklyChallenges(prisma, userId),
    computeStreaks(prisma, userId),
  ])

  const budget = computeCarbonBudget(footprint.total)
  const coords = resolveCityCoords(user ?? {})
  const aqi = await fetchAqi(coords.lat, coords.lng, coords.city)
  const aqiNudge = buildAqiNudge(aqi)

  return {
    challenges,
    streaks,
    budget,
    aqi,
    aqiNudge,
    rewardsSummary: {
      co2SavedKg: rewards.co2SavedKg,
      headline: rewards.headline,
    },
  }
}

export { INDIAN_CITIES, CHALLENGE_DEFS }
