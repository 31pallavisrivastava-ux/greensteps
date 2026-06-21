import { z } from 'zod'
import { fuelTypeSchema, topConcernSchema, transportPreferenceSchema } from './primitives.js'

export const updateProfileSchema = z.object({
  name: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  homeLat: z.number().optional(),
  homeLng: z.number().optional(),
  workLat: z.number().optional(),
  workLng: z.number().optional(),
  onboardingCompleted: z.boolean().optional(),
  transportPreference: transportPreferenceSchema.optional(),
  topConcern: topConcernSchema.optional(),
})

export const createVehicleSchema = z.object({
  label: z.string().min(1),
  fuelType: fuelTypeSchema,
  mileageKmpl: z.number().positive().optional(),
})
