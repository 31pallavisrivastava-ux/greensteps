import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { aggregateFootprint, aggregatePlastic } from '../emissions/engine.js'
import { computeWeeklyRewards } from '../rewards/engine.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

const checklists = JSON.parse(
  readFileSync(join(__dirname, '../../../data/context-checklists.json'), 'utf-8')
)
const benchmarks = JSON.parse(
  readFileSync(join(__dirname, '../../../data/community-benchmarks.json'), 'utf-8')
)
const tips = JSON.parse(
  readFileSync(join(__dirname, '../../../data/sustainability-tips.json'), 'utf-8')
)

export function listContexts() {
  return Object.values(checklists).map((c) => ({
    id: c.id,
    label: c.label,
    emoji: c.emoji,
    intro: c.intro,
    itemCount: c.items.length,
  }))
}

export function getContextChecklist(contextId) {
  const ctx = checklists[contextId]
  if (!ctx) return null
  return ctx
}

export function getSustainabilityTips() {
  return tips
}

export function estimateChecklistCo2(itemsDone, contextId) {
  const ctx = checklists[contextId]
  if (!ctx) return 0
  const perItem = 0.08
  return Math.round(itemsDone.length * perItem * 100) / 100
}

export async function computeComparison(prisma, userId) {
  const footprint = await aggregateFootprint(prisma, userId, 'week')
  const plastic = await aggregatePlastic(prisma, userId, 'week')

  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const trips = await prisma.trip.findMany({
    where: { userId, startedAt: { gte: weekAgo }, confirmedMode: { not: null } },
  })
  const orders = await prisma.deliveryOrder.findMany({
    where: { userId, orderedAt: { gte: weekAgo } },
  })

  const rewards = computeWeeklyRewards({ trips, energy: [], plastic, orders })
  const userSaved = rewards.co2SavedKg
  const avgSaved = benchmarks.weeklyCo2SavedAvg

  const savedDiff = userSaved - avgSaved
  const savedPct = avgSaved > 0 ? Math.round((savedDiff / avgSaved) * 100) : 0

  const totalDiff = benchmarks.weeklyCo2TotalAvg - footprint.total
  const totalPct = benchmarks.weeklyCo2TotalAvg > 0
    ? Math.round((totalDiff / benchmarks.weeklyCo2TotalAvg) * 100)
    : 0

  const plasticDiff = benchmarks.weeklyPlasticGramsAvg - (plastic.purchaseG + plastic.disposalG)
  const deliveryDiff = benchmarks.weeklyDeliveryOrdersAvg - orders.length

  const percentile = Math.min(
    99,
    Math.max(
      5,
      Math.round(
        50 +
          savedDiff * 12 +
          totalDiff * 0.4 +
          plasticDiff * 0.05 +
          (plastic.recycledG - benchmarks.weeklyRecycledPlasticAvg) * 0.3
      )
    )
  )

  let rankLabel = 'Getting started'
  if (percentile >= 85) rankLabel = 'Planet champion'
  else if (percentile >= 70) rankLabel = 'Eco leader'
  else if (percentile >= 50) rankLabel = 'Above average'
  else if (percentile >= 30) rankLabel = 'On your way'

  const wins = []
  if (savedDiff > 0) {
    wins.push(`You saved ${savedDiff.toFixed(1)} kg more CO₂ than the average user this week!`)
  }
  if (totalDiff > 5) {
    wins.push(`Your total footprint is ${totalDiff.toFixed(0)} kg lower than typical users.`)
  }
  if (plastic.recycledG > benchmarks.weeklyRecycledPlasticAvg) {
    wins.push(
      `You recycled ${(plastic.recycledG - benchmarks.weeklyRecycledPlasticAvg).toFixed(0)}g more plastic than average.`
    )
  }
  if (orders.length < benchmarks.weeklyDeliveryOrdersAvg) {
    wins.push(
      `${(benchmarks.weeklyDeliveryOrdersAvg - orders.length).toFixed(1)} fewer delivery orders than average — nice!`
    )
  }
  if (wins.length === 0) {
    wins.push('Complete a beach or school checklist today to jump ahead of others!')
  }

  return {
    percentile,
    rankLabel,
    user: {
      co2SavedKg: userSaved,
      co2TotalKg: footprint.total,
      plasticGrams: plastic.purchaseG + plastic.disposalG,
      recycledGrams: plastic.recycledG,
      deliveryOrders: orders.length,
    },
    community: benchmarks,
    vsAverage: {
      co2SavedDiffKg: Math.round(savedDiff * 10) / 10,
      co2SavedPct: savedPct,
      co2TotalDiffKg: Math.round(totalDiff * 10) / 10,
      co2TotalPct: totalPct,
      plasticDiffG: Math.round(plasticDiff),
      deliveryOrdersDiff: Math.round((deliveryDiff) * 10) / 10,
    },
    wins,
  }
}

export function buildMilestoneShare({ userName, rewards, comparison }) {
  const name = userName?.split(' ')[0] ?? 'I'
  const lines = [
    `🌿 ${name}'s GreenSteps milestone!`,
    '',
    `✅ Saved ${rewards.co2SavedKg} kg CO₂ this week`,
    rewards.energySavedKwh > 0 ? `☀️ ${rewards.energySavedKwh} kWh clean energy` : null,
    rewards.plasticRecycledG > 0 ? `♻️ ${rewards.plasticRecycledG.toFixed(0)}g plastic recycled` : null,
    comparison ? `🏆 Beating ${comparison.percentile}% of users — ${comparison.rankLabel}!` : null,
    rewards.badges.length > 0 ? `🎖️ Badges: ${rewards.badges.map((b) => b.emoji + ' ' + b.label).join(', ')}` : null,
    '',
    'Join me on GreenSteps — track travel, energy & plastic!',
  ].filter(Boolean)

  return {
    title: `${name} saved ${rewards.co2SavedKg} kg CO₂ this week!`,
    text: lines.join('\n'),
    url: process.env.PUBLIC_URL ?? '',
  }
}

export { checklists, benchmarks, tips }
