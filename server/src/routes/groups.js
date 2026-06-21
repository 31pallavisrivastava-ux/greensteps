import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { authMiddleware } from '../middleware/auth.js'
import {
  createClassGroup,
  joinClassGroup,
  listUserGroups,
  getGroupLeaderboard,
} from '../modules/groups/engine.js'

export const groupsRouter = Router()
groupsRouter.use(authMiddleware)

groupsRouter.get('/', async (req, res) => {
  const groups = await listUserGroups(prisma, req.userId)
  res.json(groups)
})

groupsRouter.post('/', async (req, res) => {
  try {
    const { name } = z.object({ name: z.string().min(2).max(80) }).parse(req.body)
    const group = await createClassGroup(prisma, req.userId, name)
    res.status(201).json({
      id: group.id,
      name: group.name,
      joinCode: group.joinCode,
      memberCount: group.members.length,
    })
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors })
    res.status(500).json({ error: 'Failed to create group' })
  }
})

groupsRouter.post('/join', async (req, res) => {
  try {
    const { joinCode } = z.object({ joinCode: z.string().min(4).max(8) }).parse(req.body)
    const result = await joinClassGroup(prisma, req.userId, joinCode)
    if (result.error) return res.status(404).json({ error: result.error })
    res.json({
      id: result.group.id,
      name: result.group.name,
      joinCode: result.group.joinCode,
    })
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors })
    res.status(500).json({ error: 'Failed to join group' })
  }
})

groupsRouter.get('/:id/leaderboard', async (req, res) => {
  const result = await getGroupLeaderboard(prisma, req.params.id, req.userId)
  if (result.error) return res.status(result.error.includes('Not a member') ? 403 : 404, { error: result.error })
  res.json(result)
})
