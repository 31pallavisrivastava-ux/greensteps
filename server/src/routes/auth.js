import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma.js'
import { authMiddleware } from '../middleware/auth.js'
import { serializeUser } from '../lib/userProfile.js'
import { asyncHandler } from '../lib/http.js'
import { validateBody } from '../middleware/validate.js'
import { loginSchema, registerSchema } from '../lib/schemas/auth.js'
import { getTokenFromHeader, signToken, verifyTokenForRefresh } from '../lib/jwt.js'

export const authRouter = Router()

function tokenResponse(user) {
  return { token: signToken(user.id), user: serializeUser(user) }
}

authRouter.post(
  '/register',
  validateBody(registerSchema),
  asyncHandler(async (req, res) => {
    const body = req.body
    const existing = await prisma.user.findUnique({ where: { email: body.email } })
    if (existing) return res.status(409).json({ error: 'Email already registered' })

    const passwordHash = await bcrypt.hash(body.password, 10)
    const user = await prisma.user.create({
      data: {
        email: body.email,
        passwordHash,
        name: body.name,
        state: body.state,
      },
    })
    res.status(201).json(tokenResponse(user))
  })
)

authRouter.post(
  '/login',
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Invalid credentials', code: 'INVALID_CREDENTIALS' })
    }
    res.json(tokenResponse(user))
  })
)

/** Issue a new JWT when the current one is valid or recently expired. */
authRouter.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const token = getTokenFromHeader(req.headers.authorization)
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized', code: 'NO_TOKEN' })
    }
    try {
      const payload = verifyTokenForRefresh(token)
      const user = await prisma.user.findUnique({ where: { id: payload.sub } })
      if (!user) {
        return res.status(401).json({ error: 'User not found', code: 'USER_NOT_FOUND' })
      }
      res.json({ token: signToken(user.id) })
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Refresh window expired', code: 'REFRESH_EXPIRED' })
      }
      return res.status(401).json({ error: 'Invalid token', code: 'INVALID_TOKEN' })
    }
  })
)

/** Client-side logout — stateless JWT; discard token locally after calling. */
authRouter.post(
  '/logout',
  authMiddleware,
  asyncHandler(async (_req, res) => {
    res.json({ ok: true })
  })
)
