import { z } from 'zod'
import { disposalMethodSchema, plasticTypeSchema, isoDateString } from './primitives.js'

export const plasticDisposalSchema = z.object({
  occurredAt: isoDateString,
  plasticType: plasticTypeSchema,
  grams: z.number().positive(),
  disposalMethod: disposalMethodSchema,
  notes: z.string().optional(),
})
