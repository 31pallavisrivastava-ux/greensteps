import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { signToken } from '../middleware/auth.js'
import { serializeUser } from '../lib/userProfile.js'

export const authRouter = Router()

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
  state: z.string().optional(),
})

authRouter.post('/register', async (req, res) => {
  try {
    const body = registerSchema.parse(req.body)
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
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors })
    res.status(500).json({ error: 'Registration failed' })
  }
})

authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = z.object({ email: z.string().email(), password: z.string() }).parse(req.body)
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }
    const token = signToken(user.id)
    res.json({ token, user: serializeUser(user) })
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors })
    console.error('Login error:', e)
    res.status(500).json({ error: 'Login failed' })
  }
})
