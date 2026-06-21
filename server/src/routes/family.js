import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { authMiddleware } from '../middleware/auth.js'
import { asyncHandler } from '../lib/http.js'
import { validateBody, validateParams } from '../middleware/validate.js'
import { familyJoinSchema, groupNameSchema, uuidParamSchema } from '../lib/schemas/common.js'
import {
  createFamilyGroup,
  joinFamilyGroup,
  listUserFamilies,
  getFamilyDashboard,
} from '../modules/family/engine.js'

export const familyRouter = Router()
familyRouter.use(authMiddleware)

familyRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const families = await listUserFamilies(prisma, req.userId)
    res.json(families)
  })
)

familyRouter.post(
  '/',
  validateBody(groupNameSchema),
  asyncHandler(async (req, res) => {
    const { name } = req.body
    const family = await createFamilyGroup(prisma, req.userId, name)
    res.status(201).json({
      id: family.id,
      name: family.name,
      joinCode: family.joinCode,
      memberCount: family.members.length,
      role: 'OWNER',
    })
  })
)

familyRouter.post(
  '/join',
  validateBody(familyJoinSchema),
  asyncHandler(async (req, res) => {
    const body = req.body
    const result = await joinFamilyGroup(prisma, req.userId, body.joinCode, body.role ?? 'ADULT')
    if (result.error) return res.status(404).json({ error: result.error })
    res.json({
      id: result.family.id,
      name: result.family.name,
      joinCode: result.family.joinCode,
    })
  })
)

familyRouter.get(
  '/:id/dashboard',
  validateParams(uuidParamSchema),
  asyncHandler(async (req, res) => {
    const result = await getFamilyDashboard(prisma, req.params.id, req.userId)
    if (result.error) {
      const code = result.error.includes('Not a member') ? 403 : 404
      return res.status(code).json({ error: result.error })
    }
    res.json(result)
  })
)
