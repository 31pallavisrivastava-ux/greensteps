/**
 * Production boot: resolve SQLite path, migrate, seed, then start API.
 * Run from repo root: node server/scripts/render-start.js
 */
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const serverRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')

function resolveDatabaseUrl() {
  let url = process.env.DATABASE_URL || 'file:./prisma/data.db'
  if (!url.startsWith('file:')) return

  const rel = url.slice(5)
  if (path.isAbsolute(rel)) return

  const abs = path.join(serverRoot, rel)
  fs.mkdirSync(path.dirname(abs), { recursive: true })
  process.env.DATABASE_URL = `file:${abs}`
  console.log('[boot] database:', process.env.DATABASE_URL)
}

function run(cmd) {
  console.log(`[boot] ${cmd}`)
  execSync(cmd, { cwd: serverRoot, stdio: 'inherit', env: process.env })
}

resolveDatabaseUrl()
run('npx prisma generate')
run('npx prisma db push --accept-data-loss')
run('node prisma/seed.js')
console.log('[boot] demo login: demo@carbon.local / demo1234')
console.log('[boot] starting API…')

await import('../src/server.js')
