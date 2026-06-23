import { chromium } from '@playwright/test'
import path from 'path'
import fs from 'fs'

const ADMIN_URL = 'http://127.0.0.1:5174'
const SESSION_FILE = path.resolve('test-results', 'admin-session.json')

export default async function globalSetup() {
  fs.mkdirSync(path.dirname(SESSION_FILE), { recursive: true })
  const browser = await chromium.launch()
  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  await page.goto(ADMIN_URL)
  await page.waitForSelector('input[type="text"]', { timeout: 10000 })
  await page.fill('input[type="text"]', 'admin')
  await page.fill('input[type="password"]', process.env.CMS_ADMIN_PASSWORD ?? '123')
  await page.click('button[type="submit"]')
  await page.waitForSelector('nav button', { timeout: 10000 })
  await ctx.storageState({ path: SESSION_FILE })
  await browser.close()
  console.log('[setup] Admin session saved →', SESSION_FILE)
}
