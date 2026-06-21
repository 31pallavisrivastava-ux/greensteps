import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { authMiddleware } from '../middleware/auth.js'
import {
  createFamilyGroup,
  joinFamilyGroup,
  listUserFamilies,
  getFamilyDashboard,
} from '../modules/family/engine.js'

export const familyRouter = Router()
familyRouter.use(authMiddleware)

familyRouter.get('/', async (req, res) => {
  const families = await listUserFamilies(prisma, req.userId)
  res.json(families)
})

familyRouter.post('/', async (req, res) => {
  try {
    const { name } = z.object({ name: z.string().min(2).max(80) }).parse(req.body)
    const family = await createFamilyGroup(prisma, req.userId, name)
    res.status(201).json({
      id: family.id,
      name: family.name,
      joinCode: family.joinCode,
      memberCount: family.members.length,
      role: 'OWNER',
    })
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors })
    res.status(500).json({ error: 'Failed to create family' })
  }
})

familyRouter.post('/join', async (req, res) => {
  try {
    const body = z
      .object({
        joinCode: z.string().min(4).max(8),
        role: z.enum(['ADULT', 'CHILD']).optional(),
      })
      .parse(req.body)
    const result = await joinFamilyGroup(
      prisma,
      req.userId,
      body.joinCode,
      body.role ?? 'ADULT'
    )
    if (result.error) return res.status(404).json({ error: result.error })
    res.json({
      id: result.family.id,
      name: result.family.name,
      joinCode: result.family.joinCode,
    })
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors })
    res.status(500).json({ error: 'Failed to join family' })
  }
})

familyRouter.get('/:id/dashboard', async (req, res) => {
  const result = await getFamilyDashboard(prisma, req.params.id, req.userId)
  if (result.error) {
    return res.status(result.error.includes('Not a member') ? 403 : 404, { error: result.error })
  }
  res.json(result)
})
