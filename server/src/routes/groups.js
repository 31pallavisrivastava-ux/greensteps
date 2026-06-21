import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { authMiddleware } from '../middleware/auth.js'
import { asyncHandler } from '../lib/http.js'
import { validateBody, validateParams } from '../middleware/validate.js'
import { groupNameSchema, joinCodeSchema, uuidParamSchema } from '../lib/schemas/common.js'
import {
  createClassGroup,
  joinClassGroup,
  listUserGroups,
  getGroupLeaderboard,
} from '../modules/groups/engine.js'

export const groupsRouter = Router()
groupsRouter.use(authMiddleware)

groupsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const groups = await listUserGroups(prisma, req.userId)
    res.json(groups)
  })
)

groupsRouter.post(
  '/',
  validateBody(groupNameSchema),
  asyncHandler(async (req, res) => {
    const { name } = req.body
    const group = await createClassGroup(prisma, req.userId, name)
    res.status(201).json({
      id: group.id,
      name: group.name,
      joinCode: group.joinCode,
      memberCount: group.members.length,
    })
  })
)

groupsRouter.post(
  '/join',
  validateBody(joinCodeSchema),
  asyncHandler(async (req, res) => {
    const { joinCode } = req.body
    const result = await joinClassGroup(prisma, req.userId, joinCode)
    if (result.error) return res.status(404).json({ error: result.error })
    res.json({
      id: result.group.id,
      name: result.group.name,
      joinCode: result.group.joinCode,
    })
  })
)

groupsRouter.get(
  '/:id/leaderboard',
  validateParams(uuidParamSchema),
  asyncHandler(async (req, res) => {
    const result = await getGroupLeaderboard(prisma, req.params.id, req.userId)
    if (result.error) {
      const code = result.error.includes('Not a member') ? 403 : 404
      return res.status(code).json({ error: result.error })
    }
    res.json(result)
  })
)
