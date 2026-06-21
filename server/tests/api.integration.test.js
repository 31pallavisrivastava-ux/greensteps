import { before, after, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'http'
import { execSync } from 'child_process'
import { existsSync, rmSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const serverDir = join(__dirname, '..')
const testDbPath = join(serverDir, 'test-integration.db')

let baseUrl
let server

async function api(path, options = {}) {
  const { headers: optHeaders, ...rest } = options
  const res = await fetch(`${baseUrl}${path}`, {
    ...rest,
    headers: { 'Content-Type': 'application/json', ...optHeaders },
  })
  const body = await res.json().catch(() => ({}))
  return { status: res.status, body }
}

async function registerUser(email, password = 'testpass1') {
  const { status, body } = await api('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, name: 'Test User' }),
  })
  assert.equal(status, 201, `register failed: ${JSON.stringify(body)}`)
  return body
}

before(async () => {
  process.env.DATABASE_URL = 'file:./test-integration.db'
  process.env.JWT_SECRET = 'test-integration-secret'
  process.env.LLM_AGENT_ENABLED = 'false'

  for (const f of [testDbPath, `${testDbPath}-journal`]) {
    if (existsSync(f)) rmSync(f)
  }

  execSync('npx prisma db push --skip-generate', {
    cwd: serverDir,
    env: { ...process.env, DATABASE_URL: 'file:./test-integration.db' },
    stdio: 'pipe',
  })

  const { createApp } = await import('../src/app.js')
  server = createServer(createApp())
  await new Promise((resolve) => server.listen(0, resolve))
  const { port } = server.address()
  baseUrl = `http://127.0.0.1:${port}`
})

after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve))
  }
  const { prisma } = await import('../src/lib/prisma.js')
  await prisma.$disconnect()
  for (const f of [testDbPath, `${testDbPath}-journal`]) {
    if (existsSync(f)) rmSync(f)
  }
})

describe('API integration', () => {
  it('GET /api/health exposes assistant routes and db status', async () => {
    const { status, body } = await api('/api/health')
    assert.equal(status, 200)
    assert.equal(body.status, 'ok')
    assert.equal(body.db, 'connected')
    assert.ok(body.routes.includes('family'))
    assert.ok(body.routes.includes('coach'))
    assert.ok(body.routes.includes('insights/personal'))
  })

  it('POST /api/auth/login rejects invalid email format', async () => {
    const { status, body } = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'not-an-email', password: 'x' }),
    })
    assert.equal(status, 400)
    assert.ok(body.error)
  })

  it('POST /api/auth/register rejects duplicate email', async () => {
    const email = `dup-${Date.now()}@test.local`
    await registerUser(email)
    const { status } = await api('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password: 'testpass1', name: 'Dup' }),
    })
    assert.equal(status, 409)
  })

  it('rejects invalid JWT on protected routes', async () => {
    const { status, body } = await api('/api/insights/personal', {
      headers: { Authorization: 'Bearer invalid.token.here' },
    })
    assert.equal(status, 401)
    assert.equal(body.error, 'Invalid token')
  })

  it('POST /api/auth/login rejects bad credentials', async () => {
    const { status } = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'nobody@test.local', password: 'wrong' }),
    })
    assert.equal(status, 401)
  })

  it('GET /api/insights/personal requires auth', async () => {
    const { status } = await api('/api/insights/personal')
    assert.equal(status, 401)
  })

  it('GET /api/engage/cities returns Indian city list', async () => {
    const { status, body } = await api('/api/engage/cities')
    assert.equal(status, 200)
    assert.ok(Array.isArray(body))
    assert.ok(body.length >= 10)
    assert.ok(body.some((c) => c.name === 'Mumbai'))
  })

  it('GET /api/engage/today-action returns personalized nudge', async () => {
    const { token } = await registerUser(`action-${Date.now()}@test.local`)
    const { status, body } = await api('/api/engage/today-action', {
      headers: { Authorization: `Bearer ${token}` },
    })
    assert.equal(status, 200)
    assert.ok(body.id)
    assert.ok(body.message.length > 5)
    assert.ok(body.link)
  })

  it('GET /api/insights/history returns weekly trend array', async () => {
    const { token } = await registerUser(`history-${Date.now()}@test.local`)
    const { status, body } = await api('/api/insights/history?weeks=4', {
      headers: { Authorization: `Bearer ${token}` },
    })
    assert.equal(status, 200)
    assert.ok(Array.isArray(body.weeks))
    assert.equal(body.weeks.length, 4)
  })

  it('GET /api/insights/weekly returns footprint breakdown', async () => {
    const { token } = await registerUser(`weekly-${Date.now()}@test.local`)
    const { status, body } = await api('/api/insights/weekly', {
      headers: { Authorization: `Bearer ${token}` },
    })
    assert.equal(status, 200)
    assert.equal(typeof body.footprint.total, 'number')
    assert.ok(Array.isArray(body.tips))
  })

  it('GET /api/guide/contexts returns checklist contexts', async () => {
    const { token } = await registerUser(`guide-${Date.now()}@test.local`)
    const { status, body } = await api('/api/guide/contexts', {
      headers: { Authorization: `Bearer ${token}` },
    })
    assert.equal(status, 200)
    assert.ok(Array.isArray(body))
    assert.ok(body.some((c) => c.id === 'BEACH'))
  })

  it('GET /api/insights/personal returns footprint for logged-in user', async () => {
    const { token } = await registerUser(`personal-${Date.now()}@test.local`)
    const { status, body } = await api('/api/insights/personal', {
      headers: { Authorization: `Bearer ${token}` },
    })
    assert.equal(status, 200)
    assert.equal(body.period, 'week')
    assert.equal(typeof body.totalKg, 'number')
    assert.ok(['under', 'on_track', 'over'].includes(body.status))
  })

  it('POST /api/family creates household and join adds member', async () => {
    const owner = await registerUser(`owner-${Date.now()}@test.local`)
    const member = await registerUser(`member-${Date.now()}@test.local`)

    const created = await api('/api/family', {
      method: 'POST',
      headers: { Authorization: `Bearer ${owner.token}` },
      body: JSON.stringify({ name: 'Test Household' }),
    })
    assert.equal(created.status, 201)
    assert.ok(created.body.joinCode)
    assert.equal(created.body.name, 'Test Household')

    const joined = await api('/api/family/join', {
      method: 'POST',
      headers: { Authorization: `Bearer ${member.token}` },
      body: JSON.stringify({ joinCode: created.body.joinCode }),
    })
    assert.equal(joined.status, 200)
    assert.equal(joined.body.name, 'Test Household')

    const dashboard = await api(`/api/family/${created.body.id}/dashboard`, {
      headers: { Authorization: `Bearer ${owner.token}` },
    })
    assert.equal(dashboard.status, 200)
    assert.equal(dashboard.body.family.memberCount, 2)
    assert.equal(dashboard.body.members.length, 2)
  })

  it('POST /api/coach/chat returns rules-based reply without API key', async () => {
    const { token } = await registerUser(`coach-${Date.now()}@test.local`)
    const { status, body } = await api('/api/coach/chat', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ message: 'What should I do today?' }),
    })
    assert.equal(status, 200)
    assert.equal(body.mode, 'rules')
    assert.ok(body.reply.length > 10)
    assert.ok(Array.isArray(body.toolsUsed))
  })

  it('GET /api/health includes security headers from Helmet', async () => {
    const res = await fetch(`${baseUrl}/api/health`)
    assert.equal(res.status, 200)
    assert.ok(res.headers.get('x-content-type-options'))
    assert.ok(res.headers.get('x-frame-options'))
  })

  it('POST /api/trips/manual rejects invalid transport mode', async () => {
    const { token } = await registerUser(`trip-mode-${Date.now()}@test.local`)
    const { status } = await api('/api/trips/manual', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        startedAt: new Date().toISOString(),
        endedAt: new Date().toISOString(),
        distanceKm: 5,
        confirmedMode: 'ROCKET',
      }),
    })
    assert.equal(status, 400)
  })

  it('POST /api/trips/draft rejects empty GPS points', async () => {
    const { token } = await registerUser(`trips-${Date.now()}@test.local`)
    const { status } = await api('/api/trips/draft', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ points: [] }),
    })
    assert.equal(status, 400)
  })

  it('POST /api/auth/login succeeds with valid credentials', async () => {
    const email = `login-ok-${Date.now()}@test.local`
    const password = 'testpass1'
    await registerUser(email, password)
    const { status, body } = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    assert.equal(status, 200)
    assert.ok(body.token)
    assert.equal(body.user.email, email)
  })

  it('GET /api/engage/dashboard returns budget and challenges', async () => {
    const { token } = await registerUser(`dash-${Date.now()}@test.local`)
    const { status, body } = await api('/api/engage/dashboard', {
      headers: { Authorization: `Bearer ${token}` },
    })
    assert.equal(status, 200)
    assert.ok(body.budget)
    assert.ok(Array.isArray(body.challenges))
  })

  it('GET /api/coach/status reports agent availability', async () => {
    const { token } = await registerUser(`coach-status-${Date.now()}@test.local`)
    const { status, body } = await api('/api/coach/status', {
      headers: { Authorization: `Bearer ${token}` },
    })
    assert.equal(status, 200)
    assert.equal(typeof body.agentEnabled, 'boolean')
    assert.equal(body.provider, 'ollama')
    assert.equal(typeof body.llmReachable, 'boolean')
  })
})
