import { buildApp } from './app.js'
import { hashPassword, verifyPassword } from './auth/password.js'

const app = await buildApp({
  NODE_ENV: 'test',
  API_HOST: '127.0.0.1',
  API_PORT: 4000,
  ADMIN_ORIGIN: 'http://127.0.0.1:5174',
  PUBLIC_ORIGIN: 'http://127.0.0.1:5173',
  DATABASE_URL: 'postgresql://unused:unused@127.0.0.1:5432/unused',
  SESSION_SECRET: 'test-only-session-secret-at-least-32-characters',
  SESSION_TTL_DAYS: 7,
  MEDIA_STORAGE_PATH: '../../storage/media',
  MEDIA_PUBLIC_BASE_URL: 'http://127.0.0.1:4000/media',
  MEDIA_MAX_FILE_SIZE_MB: 20,
  HOMEPAGE_SLUG: 'home',
})

const passwordHash = await hashPassword('correct-horse-battery-staple')

if (!(await verifyPassword('correct-horse-battery-staple', passwordHash))) {
  throw new Error('Password verification rejected the correct password')
}

if (await verifyPassword('incorrect-password', passwordHash)) {
  throw new Error('Password verification accepted an incorrect password')
}

const response = await app.inject({ method: 'GET', url: '/health' })

if (response.statusCode !== 200) {
  throw new Error(`Expected GET /health to return 200, received ${response.statusCode}`)
}

const payload = response.json<{ service: string; status: string }>()

if (payload.service !== 'iorder-cms-api' || payload.status !== 'ok') {
  throw new Error('GET /health returned an unexpected payload')
}

await app.close()
