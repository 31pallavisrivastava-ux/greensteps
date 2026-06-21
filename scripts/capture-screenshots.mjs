#!/usr/bin/env node
/**
 * Capture README screenshots at mobile viewport (390×844).
 * Usage: node scripts/capture-screenshots.mjs
 * Requires: dev server on :5173, API on :3001
 */
import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.join(__dirname, '../docs/screenshots')
const BASE = 'http://localhost:5173'
const VIEWPORT = { width: 390, height: 844 }

async function login(page) {
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' })
  await page.locator('#email').fill('demo@carbon.local')
  await page.locator('#password').fill('demo1234')
  await page.getByRole('button', { name: /sign in/i }).click()
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 20000 })
  await page.waitForLoadState('networkidle').catch(() => {})
  await page.waitForTimeout(1000)
}

async function shot(page, name, url, action) {
  await page.goto(url, { waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('networkidle').catch(() => {})
  if (action) await action(page)
  await page.waitForTimeout(800)
  const file = path.join(OUT, `${name}.png`)
  await page.screenshot({ path: file, fullPage: false })
  console.log('✓', name)
}

await mkdir(OUT, { recursive: true })

const browser = await chromium.launch({ channel: 'chrome' })
const page = await browser.newPage({ viewport: VIEWPORT })

await shot(page, 'login', `${BASE}/login`)

await login(page)

await shot(page, 'home', `${BASE}/`)
await shot(page, 'log', `${BASE}/log`)
await shot(page, 'guide', `${BASE}/guide?context=beach`)
await shot(page, 'impact', `${BASE}/insights`)
await shot(page, 'impact-family', `${BASE}/insights`, async (p) => {
  await p.getByRole('radio', { name: /family/i }).click()
  await p.waitForTimeout(500)
})
await shot(page, 'family-personal', `${BASE}/family`, async (p) => {
  await p.getByRole('radio', { name: /personal/i }).click()
  await p.waitForTimeout(500)
})
await shot(page, 'family', `${BASE}/family`, async (p) => {
  const familyTab = p.getByRole('radio', { name: /family/i })
  if (await familyTab.isVisible()) await familyTab.click()
  await p.waitForTimeout(500)
})
await shot(page, 'settings', `${BASE}/settings`)
await shot(page, 'coach', `${BASE}/coach`, async (p) => {
  await p.waitForTimeout(1200)
})

await browser.close()
console.log('Done →', OUT)
