import { z } from 'zod'

export const emailSchema = z.preprocess(
  (value) => (typeof value === 'string' ? value.trim().toLowerCase() : value),
  z.string().email()
)

/** Min 8 / max 128 — limits bcrypt DoS from oversized passwords. */
export const passwordSchema = z.string().min(8, 'Password must be at least 8 characters').max(128)

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().trim().min(1).max(80).optional(),
  state: z.string().trim().max(40).optional(),
})

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
})
