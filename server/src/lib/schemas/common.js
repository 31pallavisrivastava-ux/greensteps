import { z } from 'zod'

export const uuidParamSchema = z.object({
  id: z.string().uuid('Invalid resource id'),
})

export const groupNameSchema = z.object({
  name: z.string().trim().min(2).max(80),
})

export const joinCodeSchema = z.object({
  joinCode: z
    .string()
    .trim()
    .min(4)
    .max(8)
    .transform((code) => code.toUpperCase()),
})

export const familyJoinSchema = joinCodeSchema.extend({
  role: z.enum(['ADULT', 'CHILD']).optional(),
})
