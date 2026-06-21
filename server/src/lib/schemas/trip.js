import { z } from 'zod'
import { TransportMode } from '@carbon/shared'

/** Shared Zod schema for trip mode confirmation. */
export const transportModeSchema = z.nativeEnum(TransportMode)

export const tripDraftSchema = z.object({
  points: z
    .array(
      z.object({
        lat: z.number(),
        lng: z.number(),
        timestamp: z.number(),
        speedKmh: z.number().optional(),
      })
    )
    .min(2, 'At least two GPS points required'),
  startedAt: z.string(),
  endedAt: z.string(),
  distanceKm: z.number().positive(),
  isCommute: z.boolean().optional(),
})

export const manualTripSchema = z.object({
  startedAt: z.string(),
  endedAt: z.string(),
  distanceKm: z.number().positive(),
  confirmedMode: transportModeSchema,
  isCommute: z.boolean().optional(),
  vehicleId: z.string().optional(),
})

export const confirmTripSchema = z.object({
  confirmedMode: transportModeSchema,
  vehicleId: z.string().optional(),
  isCommute: z.boolean().optional(),
})
