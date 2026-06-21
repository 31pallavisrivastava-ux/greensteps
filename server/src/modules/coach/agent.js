import { COACH_TOOL_DEFINITIONS } from './tools.js'

const SYSTEM_PROMPT = `You are GreenSteps Coach — an agentic sustainability assistant for urban India.

Rules:
- ALWAYS call tools to fetch real user data before answering questions about footprint, trends, or recommendations.
- Use kg CO2 numbers from tools; never invent emissions data.
- Be concise (2–4 short paragraphs max), practical, and friendly.
- Prefer one clear next action the user can take today.
- Reference Indian context: metro/bus, Blinkit/Zepto deliveries, electricity bills, CEA grid factors.
- If data is empty, encourage logging trips, energy, or orders first.`

function ollamaHost() {
  const base = process.env.LLM_BASE_URL?.trim() || 'http://127.0.0.1:11434'
  return base.replace(/\/v1\/?$/, '')
}

export function getLlmModel() {
  return process.env.LLM_MODEL?.trim() || 'llama3.1:8b'
}

export function getLlmProvider() {
  return process.env.LLM_PROVIDER?.trim() || 'ollama'
}

export function isAgentConfigured() {
  return process.env.LLM_AGENT_ENABLED !== 'false'
}

/** Ping Ollama (or compatible) — open-source local inference */
export async function checkLlmHealth() {
  if (!isAgentConfigured()) {
    return { reachable: false, reason: 'LLM_AGENT_ENABLED=false' }
  }
  try {
    const res = await fetch(`${ollamaHost()}/api/tags`, {
      signal: AbortSignal.timeout(2500),
    })
    if (!res.ok) return { reachable: false, reason: `HTTP ${res.status}` }
    const data = await res.json()
    const models = (data.models ?? []).map((m) => m.name)
    const model = getLlmModel()
    const hasModel =
      models.some((n) => n === model || n.startsWith(`${model}:`)) ||
      models.some((n) => n.includes(model.split(':')[0]))
    return {
      reachable: true,
      hasModel,
      models: models.slice(0, 8),
      reason: hasModel ? null : `Model "${model}" not pulled — run: ollama pull ${model}`,
    }
  } catch (e) {
    return {
      reachable: false,
      reason: e.name === 'TimeoutError' ? 'Ollama not running' : e.message,
    }
  }
}

export async function isAgentEnabled() {
  const health = await checkLlmHealth()
  return health.reachable && health.hasModel !== false
}

async function callOpenAiCompatible(messages) {
  const baseUrl = `${ollamaHost()}/v1`
  const model = getLlmModel()
  const apiKey = process.env.LLM_API_KEY?.trim() || 'ollama'

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      tools: COACH_TOOL_DEFINITIONS,
      tool_choice: 'auto',
      temperature: 0.4,
      max_tokens: 768,
    }),
    signal: AbortSignal.timeout(120_000),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`LLM error (${res.status}): ${err.slice(0, 300)}`)
  }

  return res.json()
}

export async function runAgenticCoach({ message, history, executeTool }) {
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history.slice(-8).map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    })),
    { role: 'user', content: message },
  ]

  const toolsUsed = []
  const maxSteps = 5

  for (let step = 0; step < maxSteps; step++) {
    const data = await callOpenAiCompatible(messages)
    const choice = data.choices?.[0]
    if (!choice?.message) {
      throw new Error('Empty model response')
    }

    const assistantMsg = choice.message
    messages.push(assistantMsg)

    const toolCalls = assistantMsg.tool_calls ?? []
    if (toolCalls.length === 0) {
      return {
        reply:
          assistantMsg.content?.trim() ||
          'I could not generate a response. Try asking about your footprint or what to do today.',
        mode: 'agent',
        toolsUsed,
        model: getLlmModel(),
        provider: getLlmProvider(),
      }
    }

    for (const tc of toolCalls) {
      const fn = tc.function
      let args = {}
      try {
        args = fn.arguments ? JSON.parse(fn.arguments) : {}
      } catch {
        args = {}
      }
      toolsUsed.push(fn.name)
      const result = await executeTool(fn.name, args)
      messages.push({
        role: 'tool',
        tool_call_id: tc.id,
        content: JSON.stringify(result),
      })
    }
  }

  return {
    reply:
      'I gathered your data but need a simpler question — try “Why is my footprint high?” or “What should I do today?”',
    mode: 'agent',
    toolsUsed,
    model: getLlmModel(),
    provider: getLlmProvider(),
  }
}
