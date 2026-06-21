import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { authMiddleware } from '../middleware/auth.js'
import { executeCoachTool } from '../modules/coach/tools.js'
import {
  checkLlmHealth,
  getLlmModel,
  getLlmProvider,
  isAgentConfigured,
  runAgenticCoach,
} from '../modules/coach/agent.js'
import { runFallbackCoach } from '../modules/coach/fallbackCoach.js'

export const coachRouter = Router()

coachRouter.get('/status', authMiddleware, async (_req, res) => {
  const health = await checkLlmHealth()
  res.json({
    agentEnabled: health.reachable && health.hasModel !== false,
    provider: getLlmProvider(),
    model: getLlmModel(),
    llmReachable: health.reachable,
    modelReady: health.hasModel !== false,
    hint: health.reason,
    modelsAvailable: health.models ?? [],
    tools: [
      'get_personal_footprint',
      'explain_footprint',
      'get_weekly_trend',
      'get_today_action',
      'get_engagement_summary',
    ],
    description:
      'Agentic coach uses an open-source local model via Ollama + tools; rules fallback when Ollama is offline.',
  })
})

coachRouter.post('/chat', authMiddleware, async (req, res) => {
  try {
    const body = z
      .object({
        message: z.string().min(1).max(2000),
        history: z
          .array(
            z.object({
              role: z.enum(['user', 'assistant']),
              content: z.string().max(4000),
            })
          )
          .max(12)
          .optional(),
      })
      .parse(req.body)

    const user = await prisma.user.findUnique({ where: { id: req.userId } })
    const history = body.history ?? []
    const executeTool = (name, args) => executeCoachTool(prisma, req.userId, user, name, args)

    let result
    const health = await checkLlmHealth()
    const canRunAgent =
      isAgentConfigured() && health.reachable && health.hasModel !== false

    if (canRunAgent) {
      try {
        result = await runAgenticCoach({
          message: body.message,
          history,
          executeTool,
        })
      } catch (e) {
        console.error('Agent coach failed, falling back to rules:', e.message)
        result = await runFallbackCoach({ message: body.message, executeTool })
        result.mode = 'rules'
        result.agentError = `Local LLM unavailable — using rules coach (${e.message.slice(0, 80)})`
      }
    } else {
      result = await runFallbackCoach({ message: body.message, executeTool })
      if (isAgentConfigured() && !health.reachable) {
        result.agentError = 'Start Ollama: ollama serve && ollama pull llama3.1:8b'
      } else if (isAgentConfigured() && health.reason) {
        result.agentError = health.reason
      }
    }

    res.json({
      reply: result.reply,
      mode: result.mode,
      toolsUsed: result.toolsUsed ?? [],
      suggestedLink: result.suggestedLink ?? null,
      agentError: result.agentError ?? null,
      model: result.model ?? getLlmModel(),
      provider: result.provider ?? getLlmProvider(),
    })
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors })
    console.error(e)
    res.status(500).json({ error: 'Coach request failed' })
  }
})
