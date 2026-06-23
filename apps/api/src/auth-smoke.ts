import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createDatabase } from '@iorder/database'
import { auditLogs, roles, userRoles, users } from '@iorder/database'
import { config } from 'dotenv'
import { eq } from 'drizzle-orm'

import { buildApp } from './app.js'
import { hashPassword } from './auth/password.js'
import { readEnv } from './env.js'

const currentDirectory = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(currentDirectory, '../../../.env') })

const env = readEnv()
const database = createDatabase(env.DATABASE_URL)
const username = `auth-smoke-${Date.now()}`
const password = 'auth-smoke-password-123'
let userId: string | null = null
const app = await buildApp(env)

try {
  const [adminRole] = await database.db
    .select({ id: roles.id })
    .from(roles)
    .where(eq(roles.code, 'admin'))
    .limit(1)

  if (!adminRole) {
    throw new Error('Admin role is missing. Run the core database seed first.')
  }

  const [user] = await database.db
    .insert(users)
    .values({
      username,
      fullName: 'Authentication Smoke User',
      passwordHash: await hashPassword(password),
      status: 'active',
    })
    .returning({ id: users.id })

  if (!user) {
    throw new Error('Smoke user could not be created')
  }

  userId = user.id

  await database.db.insert(userRoles).values({
    userId,
    roleId: adminRole.id,
  })

  const loginResponse = await app.inject({
    method: 'POST',
    url: '/api/admin/auth/login',
    payload: { username, password },
  })

  if (loginResponse.statusCode !== 200) {
    throw new Error(`Login returned ${loginResponse.statusCode}: ${loginResponse.body}`)
  }

  const setCookie = loginResponse.headers['set-cookie']
  const rawCookie = Array.isArray(setCookie) ? setCookie[0] : setCookie
  const cookie = rawCookie?.split(';', 1)[0]

  if (!cookie) {
    throw new Error('Login did not return a session cookie')
  }

  const meResponse = await app.inject({
    method: 'GET',
    url: '/api/admin/auth/me',
    headers: { cookie },
  })

  if (meResponse.statusCode !== 200) {
    throw new Error(`Session lookup returned ${meResponse.statusCode}: ${meResponse.body}`)
  }

  const adminResponse = await app.inject({
    method: 'GET',
    url: '/api/admin/system/status',
    headers: { cookie },
  })

  if (adminResponse.statusCode !== 200) {
    throw new Error(`Admin guard returned ${adminResponse.statusCode}: ${adminResponse.body}`)
  }

  const logoutResponse = await app.inject({
    method: 'POST',
    url: '/api/admin/auth/logout',
    headers: { cookie },
  })

  if (logoutResponse.statusCode !== 204) {
    throw new Error(`Logout returned ${logoutResponse.statusCode}: ${logoutResponse.body}`)
  }

  const revokedResponse = await app.inject({
    method: 'GET',
    url: '/api/admin/auth/me',
    headers: { cookie },
  })

  if (revokedResponse.statusCode !== 401) {
    throw new Error(`Revoked session returned ${revokedResponse.statusCode} instead of 401`)
  }

  let rateLimitObserved = false

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const response = await app.inject({
      method: 'POST',
      url: '/api/admin/auth/login',
      payload: { username, password: 'wrong-password' },
    })

    if (response.statusCode === 429) {
      rateLimitObserved = true
      break
    }
  }

  if (!rateLimitObserved) {
    throw new Error('Login rate limit did not activate')
  }

  process.stdout.write('Authentication smoke test passed.\n')
} finally {
  await app.close()

  if (userId) {
    await database.db.delete(auditLogs).where(eq(auditLogs.userId, userId))
    await database.db.delete(users).where(eq(users.id, userId))
  }

  await database.close()
}
