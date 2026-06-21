import { aggregateFootprint, aggregatePlastic } from '../emissions/engine.js'
import { computeWeeklyRewards } from '../rewards/engine.js'
import { generateUniqueJoinCode } from '../../lib/joinCode.js'

export async function createClassGroup(prisma, userId, name) {
  const joinCode = await generateUniqueJoinCode((code) =>
    prisma.classGroup.findUnique({ where: { joinCode: code } })
  )

  const group = await prisma.classGroup.create({
    data: {
      name,
      joinCode,
      createdById: userId,
      members: { create: { userId } },
    },
    include: { members: true },
  })
  return group
}

export async function joinClassGroup(prisma, userId, joinCode) {
  const group = await prisma.classGroup.findUnique({
    where: { joinCode: joinCode.toUpperCase().trim() },
  })
  if (!group) return { error: 'Invalid join code' }

  await prisma.classMember.upsert({
    where: { userId_groupId: { userId, groupId: group.id } },
    create: { userId, groupId: group.id },
    update: {},
  })

  return { group }
}

export async function listUserGroups(prisma, userId) {
  const memberships = await prisma.classMember.findMany({
    where: { userId },
    include: {
      group: {
        include: {
          _count: { select: { members: true } },
        },
      },
    },
    orderBy: { joinedAt: 'desc' },
  })

  return memberships.map((m) => ({
    id: m.group.id,
    name: m.group.name,
    joinCode: m.group.joinCode,
    memberCount: m.group._count.members,
    joinedAt: m.joinedAt.toISOString(),
  }))
}

async function memberWeeklyStats(prisma, userId) {
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)

  const [footprint, plastic, trips, orders, user] = await Promise.all([
    aggregateFootprint(prisma, userId, 'week'),
    aggregatePlastic(prisma, userId, 'week'),
    prisma.trip.findMany({
      where: { userId, startedAt: { gte: weekAgo }, confirmedMode: { not: null } },
    }),
    prisma.deliveryOrder.findMany({
      where: { userId, orderedAt: { gte: weekAgo } },
    }),
    prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true } }),
  ])

  const rewards = computeWeeklyRewards({ trips, energy: [], plastic, orders })

  return {
    userId,
    name: user?.name ?? user?.email?.split('@')[0] ?? 'User',
    co2SavedKg: rewards.co2SavedKg,
    co2TotalKg: Math.round(footprint.total * 10) / 10,
    publicTrips: trips.filter((t) => t.transportCategory === 'PUBLIC').length,
    deliveryOrders: orders.length,
  }
}

export async function getGroupLeaderboard(prisma, groupId, userId) {
  const membership = await prisma.classMember.findUnique({
    where: { userId_groupId: { userId, groupId } },
  })
  if (!membership) return { error: 'Not a member of this group' }

  const group = await prisma.classGroup.findUnique({
    where: { id: groupId },
    include: { members: { include: { user: { select: { id: true, name: true, email: true } } } } },
  })
  if (!group) return { error: 'Group not found' }

  const stats = await Promise.all(group.members.map((m) => memberWeeklyStats(prisma, m.userId)))

  stats.sort((a, b) => {
    if (b.co2SavedKg !== a.co2SavedKg) return b.co2SavedKg - a.co2SavedKg
    return a.co2TotalKg - b.co2TotalKg
  })

  const ranked = stats.map((s, i) => ({
    rank: i + 1,
    userId: s.userId,
    name: s.name,
    co2SavedKg: s.co2SavedKg,
    co2TotalKg: s.co2TotalKg,
    publicTrips: s.publicTrips,
    deliveryOrders: s.deliveryOrders,
    isYou: s.userId === userId,
  }))

  return {
    group: { id: group.id, name: group.name, joinCode: group.joinCode, memberCount: group.members.length },
    leaderboard: ranked,
    yourRank: ranked.find((r) => r.isYou)?.rank ?? null,
  }
}
