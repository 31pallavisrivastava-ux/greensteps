import { z } from 'zod'

export const offlineQueueSchema = z.object({
  type: z.string().min(1),
  payload: z.union([z.string(), z.record(z.unknown())]),
})
