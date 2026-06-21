import { z } from 'zod'

export const contextIdParamSchema = z.object({
  id: z.string().min(1),
})

export const checklistCompleteSchema = z.object({
  itemsDone: z.array(z.string()).min(1),
})
