/** Rules-based coach when OPENAI_API_KEY is not set — still uses real tool data. */

export async function runFallbackCoach({ message, executeTool }) {
  const lower = message.toLowerCase()
  const toolsUsed = []

  let toolName = 'get_today_action'
  if (/why|explain|breakdown|number|high|footprint|co2|carbon/.test(lower)) {
    toolName = 'explain_footprint'
  } else if (/trend|history|week|chart|improv/.test(lower)) {
    toolName = 'get_weekly_trend'
  } else if (/budget|challenge|streak|aqi|air/.test(lower)) {
    toolName = 'get_engagement_summary'
  } else if (/today|should i|what do|recommend|action|tip/.test(lower)) {
    toolName = 'get_today_action'
  } else if (/personal|my total|how much|status/.test(lower)) {
    toolName = 'get_personal_footprint'
  }

  toolsUsed.push(toolName)
  const data = await executeTool(toolName, toolName === 'get_weekly_trend' ? { weeks: 12 } : {})

  if (toolName === 'explain_footprint') {
    const top = data.topLine
    const reply = top
      ? `Your footprint this week is ${data.totalKg} kg CO₂ (fuel ${data.scope1}, power ${data.scope2}, travel ${data.scope3} kg).\n\nBiggest contributor: ${top.label} at ${top.co2eKg} kg — ${top.formula}.\n\n${data.lines.length > 1 ? `You have ${data.lines.length} logged items.` : 'Log more trips or bills to improve accuracy.'}`
      : `Your footprint is ${data.totalKg} kg CO₂ this week but there are no detailed line items yet. Start by logging a trip, electricity bill, or delivery order.`
    return { reply, mode: 'rules', toolsUsed, suggestedLink: '/insights' }
  }

  if (toolName === 'get_weekly_trend') {
    return {
      reply: `Trend: ${data.trend.message} (current week ${data.weeks.at(-1)?.total ?? 0} kg).\n\n${data.trend.direction === 'up' ? 'Focus on one swap: a bus ride, one fewer delivery, or logging your power bill.' : 'Keep the momentum — check Impact for your 12-week chart.'}`,
      mode: 'rules',
      toolsUsed,
      suggestedLink: '/insights',
    }
  }

  if (toolName === 'get_today_action') {
    return {
      reply: `${data.emoji} ${data.title}\n\n${data.message}\n\n${data.impactHint}`,
      mode: 'rules',
      toolsUsed,
      suggestedLink: data.link,
    }
  }

  if (toolName === 'get_personal_footprint') {
    return {
      reply: `You are at ${data.totalKg} kg CO₂ this week — ${data.statusLabel.toLowerCase()} (${data.vsFairSharePct}% of your ${data.fairShareKg} kg fair share).\n\nSplit: fuel ${data.scope1}, power ${data.scope2}, travel ${data.scope3} kg. You logged ${data.activity.trips} trips and ${data.activity.orders} orders.`,
      mode: 'rules',
      toolsUsed,
      suggestedLink: '/family',
    }
  }

  if (toolName === 'get_engagement_summary') {
    const b = data.budget
    return {
      reply: `Budget: ${b.usedKg}/${b.fairShareKg} kg this week (${b.status.replace('_', ' ')}).\n\n${data.openChallenges.length ? `Active challenge: ${data.openChallenges[0].title} (${data.openChallenges[0].current}/${data.openChallenges[0].target}).` : 'No open challenges — check Impact for more.'}${data.aqi ? `\n\nAQI in your city: ${data.aqi.aqi} (${data.aqi.category}) — ${data.aqi.hint}` : ''}`,
      mode: 'rules',
      toolsUsed,
      suggestedLink: '/insights',
    }
  }

  return {
    reply: 'Ask me about your footprint, weekly trend, budget, or what to do today.',
    mode: 'rules',
    toolsUsed,
    suggestedLink: '/',
  }
}
