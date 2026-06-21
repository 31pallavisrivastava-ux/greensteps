import { z } from 'zod'

export const fuelTypeSchema = z.enum(['PETROL', 'DIESEL', 'CNG', 'EV'])

export const merchantSchema = z.enum([
  'BLINKIT',
  'ZEPTO',
  'SWIGGY_INSTAMART',
  'SWIGGY_FOOD',
  'ZOMATO',
])

export const plasticTypeSchema = z.enum(['PET', 'HDPE', 'LDPE', 'PP', 'MULTILAYER', 'MIXED'])

export const disposalMethodSchema = z.enum(['RECYCLED', 'LANDFILL', 'REUSED'])

export const transportPreferenceSchema = z.enum(['CAR', 'BUS_METRO', 'WALK_CYCLE', 'MIXED'])

export const topConcernSchema = z.enum(['POWER', 'TRAVEL', 'DELIVERY', 'PLASTIC'])

export const isoDateString = z.string().datetime({ offset: true })

export const orderTypeSchema = z.enum(['QUICK_COMMERCE', 'FOOD_DELIVERY'])

export const lineItemSchema = z.object({
  catalogId: z.string().optional(),
  label: z.string(),
  quantity: z.number().int().positive(),
})
