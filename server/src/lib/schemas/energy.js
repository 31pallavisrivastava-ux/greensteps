import { z } from 'zod'

export const energyReadingSchema = z.object({
  periodStart: z.string(),
  periodEnd: z.string(),
  kwh: z.number().nonnegative(),
  solarOffsetKwh: z.number().nonnegative().optional(),
  lpgKg: z.number().nonnegative().optional(),
  source: z.enum(['MANUAL', 'OCR']).optional(),
})

export const energyOcrSchema = z.object({
  text: z.string().min(10),
  save: z.boolean().optional(),
  solarOffsetKwh: z.number().nonnegative().optional(),
  lpgKg: z.number().nonnegative().optional(),
})
