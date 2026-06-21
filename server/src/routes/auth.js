import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma.js'
import { signToken } from '../middleware/auth.js'
import { serializeUser } from '../lib/userProfile.js'
import { asyncHandler } from '../lib/http.js'
import { validateBody } from '../middleware/validate.js'
import { loginSchema, registerSchema } from '../lib/schemas/auth.js'

export const authRouter = Router()

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
    const token = signToken(user.id)
    res.status(201).json({ token, user: serializeUser(user) })
  })
)

authRouter.post(
  '/login',
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }
    const token = signToken(user.id)
    res.json({ token, user: serializeUser(user) })
  })
)
