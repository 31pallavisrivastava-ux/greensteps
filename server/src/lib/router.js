import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { asyncHandler } from './http.js'
import { validateBody, validateParams, validateQuery } from '../middleware/validate.js'

/** Express router with JWT auth middleware applied. */
export function authRouter() {
  const router = Router()
  router.use(authMiddleware)
  return router
}

/** Shorthand for asyncHandler — keeps route files readable. */
export function route(handler) {
  return asyncHandler(handler)
}

/** `[validateBody(schema), asyncHandler(handler)]` for spread into router.METHOD(...). */
export function withBody(schema, handler) {
  return [validateBody(schema), asyncHandler(handler)]
}

/** `[validateParams(schema), asyncHandler(handler)]`. */
export function withParams(schema, handler) {
  return [validateParams(schema), asyncHandler(handler)]
}

/** Params + body validation for PATCH/POST on `:id` routes. */
export function withParamsAndBody(paramsSchema, bodySchema, handler) {
  return [validateParams(paramsSchema), validateBody(bodySchema), asyncHandler(handler)]
}

export function created(res, data) {
  res.status(201).json(data)
}

/** Family/class dashboards — 403 when not a member, 404 otherwise. */
export function sendMemberResult(res, result) {
  if (result.error) {
    const code = result.error.includes('Not a member') ? 403 : 404
    return res.status(code).json({ error: result.error })
  }
  return res.json(result)
}

/** Standard 501 stub for phase-2 endpoints. */
export function notImplemented(message, extra = {}) {
  return (_req, res) => {
    res.status(501).json({
      error: 'Not implemented yet',
      message,
      stub: true,
      ...extra,
    })
  }
}

/** `[validateQuery(schema), asyncHandler(handler)]`. */
export function withQuery(schema, handler) {
  return [validateQuery(schema), asyncHandler(handler)]
}

export { validateBody, validateParams, validateQuery, asyncHandler }
