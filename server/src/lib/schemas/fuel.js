import { z } from 'zod'
import { fuelTypeSchema, isoDateString } from './primitives.js'

export const fuelPurchaseSchema = z.object({
  vehicleId: z.string().optional(),
  purchasedAt: isoDateString,
  liters: z.number().positive(),
  amountInr: z.number().optional(),
  fuelType: fuelTypeSchema.optional(),
})
