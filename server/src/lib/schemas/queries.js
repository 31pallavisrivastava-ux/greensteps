import { z } from 'zod'
import { merchantSchema } from './primitives.js'

export const orderTypeQuerySchema = z.object({
  orderType: z.enum(['QUICK_COMMERCE', 'FOOD_DELIVERY']).optional(),
})

export const periodQuerySchema = z.object({
  period: z.enum(['week', 'month']).optional().default('week'),
})

export const weeksQuerySchema = z.object({
  weeks: z.coerce.number().int().min(4).max(24).optional().default(12),
})

export const merchantQuerySchema = z.object({
  merchant: merchantSchema.optional(),
})

export const dateRangeQuerySchema = z.object({
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
})
