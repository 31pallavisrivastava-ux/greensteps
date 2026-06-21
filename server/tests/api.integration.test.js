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
  it('GET /api/health exposes assistant routes', async () => {
    const { status, body } = await api('/api/health')
    assert.equal(status, 200)
    assert.equal(body.status, 'ok')
    assert.ok(body.routes.includes('family'))
    assert.ok(body.routes.includes('insights/personal'))
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
