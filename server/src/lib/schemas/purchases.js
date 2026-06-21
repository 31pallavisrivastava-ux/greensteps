import { z } from 'zod'
import { lineItemSchema, merchantSchema, isoDateString } from './primitives.js'

export const deliveryOrderSchema = z.object({
  merchant: merchantSchema,
  orderedAt: isoDateString,
  amountInr: z.number().optional(),
  lineItems: z.array(lineItemSchema).min(1),
})
