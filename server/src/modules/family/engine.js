import { randomBytes } from 'crypto'
import {
  aggregateFootprint,
  aggregatePlastic,
} from '../emissions/engine.js'
import { computeWeeklyRewards } from '../rewards/engine.js'
import { WEEKLY_FAIR_SHARE_KG } from '../engage/engine.js'

function generateJoinCode() {
  return randomBytes(3).toString('hex').toUpperCase()
}

async function memberWeeklyFootprint(prisma, userId, nickname) {
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)

  const [footprint, plastic, trips, orders, energy, user] = await Promise.all([
    aggregateFootprint(prisma, userId, 'week'),
    aggregatePlastic(prisma, userId, 'week'),
    prisma.trip.findMany({
      where: { userId, startedAt: { gte: weekAgo }, confirmedMode: { not: null } },
    }),
    prisma.deliveryOrder.findMany({
      where: { userId, orderedAt: { gte: weekAgo } },
    }),
    prisma.energyReading.findMany({
      where: { userId, periodEnd: { gte: weekAgo } },
    }),
    prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true } }),
  ])

  const rewards = computeWeeklyRewards({ trips, energy, plastic, orders })
  const displayName =
    nickname ?? user?.name ?? user?.email?.split('@')[0] ?? 'Member'

  return {
    userId,
    name: displayName,
    co2TotalKg: Math.round(footprint.total * 10) / 10,
    scope1: Math.round(footprint.scope1 * 10) / 10,
    scope2: Math.round(footprint.scope2 * 10) / 10,
    scope3: Math.round(footprint.scope3 * 10) / 10,
    co2SavedKg: rewards.co2SavedKg,
    plasticGrams: Math.round(plastic.purchaseG + plastic.disposalG),
    tripCount: trips.length,
    orderCount: orders.length,
    byCategory: {
      fuel: Math.round(footprint.scope1 * 10) / 10,
      energy: Math.round(footprint.scope2 * 10) / 10,
      travel: Math.round(footprint.scope3 * 10) / 10,
    },
  }
}

export async function createFamilyGroup(prisma, userId, name) {
  let joinCode = generateJoinCode()
  for (let i = 0; i < 5; i++) {
    const existing = await prisma.familyGroup.findUnique({ where: { joinCode } })
    if (!existing) break
    joinCode = generateJoinCode()
  }

  const family = await prisma.familyGroup.create({
    data: {
      name,
      joinCode,
      createdById: userId,
      members: { create: { userId, role: 'OWNER' } },
    },
    include: { members: true },
  })
  return family
}

export async function joinFamilyGroup(prisma, userId, joinCode, role = 'ADULT') {
  const family = await prisma.familyGroup.findUnique({
    where: { joinCode: joinCode.toUpperCase().trim() },
  })
  if (!family) return { error: 'Invalid family code' }

  await prisma.familyMember.upsert({
    where: { userId_familyId: { userId, familyId: family.id } },
    create: { userId, familyId: family.id, role },
    update: {},
  })

  return { family }
}

export async function listUserFamilies(prisma, userId) {
  const memberships = await prisma.familyMember.findMany({
    where: { userId },
    include: {
      family: { include: { _count: { select: { members: true } } } },
    },
    orderBy: { joinedAt: 'desc' },
  })

  return memberships.map((m) => ({
    id: m.family.id,
    name: m.family.name,
    joinCode: m.family.joinCode,
    memberCount: m.family._count.members,
    role: m.role,
    joinedAt: m.joinedAt.toISOString(),
  }))
}

export async function getPersonalFootprint(prisma, userId) {
  const footprint = await aggregateFootprint(prisma, userId, 'week')
  const plastic = await aggregatePlastic(prisma, userId, 'week')
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)

  const [trips, orders, energy] = await Promise.all([
    prisma.trip.count({
      where: { userId, startedAt: { gte: weekAgo }, confirmedMode: { not: null } },
    }),
    prisma.deliveryOrder.count({
      where: { userId, orderedAt: { gte: weekAgo } },
    }),
    prisma.energyReading.count({
      where: { userId, periodEnd: { gte: weekAgo } },
    }),
  ])

  const total = Math.round(footprint.total * 10) / 10
  const fairShare = WEEKLY_FAIR_SHARE_KG
  const vsFairSharePct = Math.round((total / fairShare) * 100)

  return {
    period: 'week',
    totalKg: total,
    scope1: Math.round(footprint.scope1 * 10) / 10,
    scope2: Math.round(footprint.scope2 * 10) / 10,
    scope3: Math.round(footprint.scope3 * 10) / 10,
    byCategory: footprint.byCategory,
    plasticGrams: Math.round(plastic.purchaseG + plastic.disposalG),
    activity: { trips, orders, energyReadings: energy },
    fairShareKg: fairShare,
    vsFairSharePct,
    status:
      total <= fairShare * 0.85
        ? 'under'
        : total <= fairShare * 1.05
          ? 'on_track'
          : 'over',
    statusLabel:
      total <= fairShare * 0.85
        ? 'Under your fair share'
        : total <= fairShare * 1.05
          ? 'On track'
          : `${Math.round(total - fairShare)} kg over fair share`,
  }
}

export async function getFamilyDashboard(prisma, familyId, userId) {
  const membership = await prisma.familyMember.findUnique({
    where: { userId_familyId: { userId, familyId } },
  })
  if (!membership) return { error: 'Not a member of this family' }

  const family = await prisma.familyGroup.findUnique({
    where: { id: familyId },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  })
  if (!family) return { error: 'Family not found' }

  const memberStats = await Promise.all(
    family.members.map((m) =>
      memberWeeklyFootprint(prisma, m.userId, m.nickname).then((s) => ({
        ...s,
        role: m.role,
        isYou: m.userId === userId,
      }))
    )
  )

  memberStats.sort((a, b) => b.co2TotalKg - a.co2TotalKg)

  const householdTotal = Math.round(memberStats.reduce((s, m) => s + m.co2TotalKg, 0) * 10) / 10
  const householdScope1 = Math.round(memberStats.reduce((s, m) => s + m.scope1, 0) * 10) / 10
  const householdScope2 = Math.round(memberStats.reduce((s, m) => s + m.scope2, 0) * 10) / 10
  const householdScope3 = Math.round(memberStats.reduce((s, m) => s + m.scope3, 0) * 10) / 10
  const memberCount = memberStats.length
  const householdFairShare = Math.round(WEEKLY_FAIR_SHARE_KG * memberCount * 10) / 10
  const perPersonAvg = memberCount ? Math.round((householdTotal / memberCount) * 10) / 10 : 0

  const topDriver = [
    { key: 'fuel', label: 'Fuel', kg: householdScope1 },
    { key: 'energy', label: 'Power', kg: householdScope2 },
    { key: 'travel', label: 'Travel', kg: householdScope3 },
  ].reduce((a, b) => (b.kg > a.kg ? b : a))

  return {
    family: {
      id: family.id,
      name: family.name,
      joinCode: family.joinCode,
      memberCount,
    },
    household: {
      totalKg: householdTotal,
      scope1: householdScope1,
      scope2: householdScope2,
      scope3: householdScope3,
      fairShareKg: householdFairShare,
      perPersonAvgKg: perPersonAvg,
      vsFairSharePct: Math.round((householdTotal / householdFairShare) * 100),
      topDriver: topDriver.label,
      status:
        householdTotal <= householdFairShare * 0.9
          ? 'under'
          : householdTotal <= householdFairShare * 1.05
            ? 'on_track'
            : 'over',
    },
    members: memberStats,
    yourSharePct:
      memberStats.find((m) => m.isYou) && householdTotal > 0
        ? Math.round(
            ((memberStats.find((m) => m.isYou)?.co2TotalKg ?? 0) / householdTotal) * 100
          )
        : null,
  }
}
