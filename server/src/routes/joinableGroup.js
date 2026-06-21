import { prisma } from '../lib/prisma.js'
import {
  authRouter,
  route,
  withBody,
  withParams,
  created,
  sendMemberResult,
} from '../lib/router.js'
import { groupNameSchema, uuidParamSchema } from '../lib/schemas/common.js'

/**
 * Shared CRUD routes for join-code groups (family household, class leaderboard).
 * @param {{ joinSchema: import('zod').ZodTypeAny, viewPath: string, list: Function, create: Function, join: Function, getView: Function, formatCreated: Function, formatJoined: Function }} config
 */
export function createJoinableGroupRouter(config) {
  const router = authRouter()

  router.get(
    '/',
    route(async (req, res) => {
      res.json(await config.list(prisma, req.userId))
    })
  )

  router.post(
    '/',
    ...withBody(groupNameSchema, async (req, res) => {
      const entity = await config.create(prisma, req.userId, req.body.name)
      created(res, config.formatCreated(entity))
    })
  )

  router.post(
    '/join',
    ...withBody(config.joinSchema, async (req, res) => {
      const result = await config.join(prisma, req.userId, req.body)
      if (result.error) return res.status(404).json({ error: result.error })
      res.json(config.formatJoined(result))
    })
  )

  router.get(
    config.viewPath,
    ...withParams(uuidParamSchema, async (req, res) => {
      sendMemberResult(res, await config.getView(prisma, req.params.id, req.userId))
    })
  )

  return router
}
