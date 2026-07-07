import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createDatabase } from '@iorder/database'
import { auditLogs, offeringRevisions, offerings, roles, userRoles, users } from '@iorder/database'
import { config } from 'dotenv'
import { count, eq } from 'drizzle-orm'

import { buildApp } from './app.js'
import { hashPassword } from './auth/password.js'
import { readEnv } from './env.js'

const currentDirectory = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(currentDirectory, '../../../.env') })

const env = readEnv({ ...process.env, NODE_ENV: 'test' })
const database = createDatabase(env.DATABASE_URL)
const app = await buildApp(env)
const username = `offerings-smoke-${Date.now()}`
const password = 'offerings-smoke-password-123'
const slug = `offerings-smoke-${Date.now()}`
let userId: string | null = null
let offeringId: string | null = null

const draftInput = {
  type: 'software',
  title: 'Offerings smoke draft',
  slug,
  summary: 'Temporary offering used by the integration smoke test.',
  icon: null,
  coverMediaId: null,
  sortOrder: 0,
  isFeatured: false,
  seoTitle: 'Offerings smoke draft',
  seoDescription: 'Temporary SEO description for the offerings smoke test.',
  canonicalUrl: null,
  contentJson: {
    description: 'Smoke test description',
    tags: [],
    bestFor: null,
    keyValue: null,
    metrics: [],
    features: [],
    benefits: [],
    faq: [],
    items: [],
    category: null,
  },
}

try {
  const [adminRole] = await database.db.select({ id: roles.id }).from(roles).where(eq(roles.code, 'admin')).limit(1)
  if (!adminRole) throw new Error('Admin role is missing. Run the core database seed first.')

  const [user] = await database.db
    .insert(users)
    .values({
      username,
      fullName: 'Offerings Smoke User',
      passwordHash: await hashPassword(password),
      status: 'active',
    })
    .returning({ id: users.id })
  if (!user) throw new Error('Smoke user could not be created')
  userId = user.id
  await database.db.insert(userRoles).values({ userId, roleId: adminRole.id })

  const unauthenticated = await app.inject({ method: 'GET', url: '/api/admin/offerings' })
  if (unauthenticated.statusCode !== 401) throw new Error('Admin offerings list did not require authentication')

  const login = await app.inject({ method: 'POST', url: '/api/admin/auth/login', payload: { username, password } })
  const setCookie = login.headers['set-cookie']
  const rawCookie = Array.isArray(setCookie) ? setCookie[0] : setCookie
  const cookie = rawCookie?.split(';', 1)[0]
  if (login.statusCode !== 200 || !cookie) throw new Error('Offerings smoke login failed')

  const created = await app.inject({
    method: 'POST',
    url: '/api/admin/offerings',
    headers: { cookie },
    payload: draftInput,
  })
  if (created.statusCode !== 201) throw new Error(`Offering create failed: ${created.statusCode} ${created.body}`)
  offeringId = created.json<{ item: { id: string; status: string } }>().item.id

  const hiddenDraft = await app.inject({ method: 'GET', url: `/api/public/offerings/software/${slug}` })
  if (hiddenDraft.statusCode !== 404) throw new Error('Draft offering was exposed by public API')

  const duplicate = await app.inject({
    method: 'POST',
    url: '/api/admin/offerings',
    headers: { cookie },
    payload: draftInput,
  })
  if (duplicate.statusCode !== 409) throw new Error('Duplicate offering slug was not rejected')

  const updated = await app.inject({
    method: 'PATCH',
    url: `/api/admin/offerings/${offeringId}`,
    headers: { cookie },
    payload: { ...draftInput, title: 'Updated offerings smoke draft' },
  })
  if (updated.statusCode !== 200 || !updated.body.includes('Updated offerings smoke draft'))
    throw new Error('Offering update failed')

  const published = await app.inject({
    method: 'POST',
    url: `/api/admin/offerings/${offeringId}/publish`,
    headers: { cookie },
  })
  if (published.statusCode !== 200 || !published.body.includes('published')) throw new Error('Offering publish failed')

  const publicOffering = await app.inject({ method: 'GET', url: `/api/public/offerings/software/${slug}` })
  if (publicOffering.statusCode !== 200 || !publicOffering.body.includes('Updated offerings smoke draft'))
    throw new Error('Published offering was not returned by public API')

  const publicList = await app.inject({ method: 'GET', url: '/api/public/offerings?type=software' })
  if (publicList.statusCode !== 200 || !publicList.body.includes(offeringId))
    throw new Error('Published offering was not returned by public list')

  const archived = await app.inject({
    method: 'POST',
    url: `/api/admin/offerings/${offeringId}/archive`,
    headers: { cookie },
  })
  if (archived.statusCode !== 200 || !archived.body.includes('archived')) throw new Error('Offering archive failed')

  const hiddenArchived = await app.inject({ method: 'GET', url: `/api/public/offerings/software/${slug}` })
  if (hiddenArchived.statusCode !== 404) throw new Error('Archived offering was exposed by public API')

  const deleted = await app.inject({ method: 'DELETE', url: `/api/admin/offerings/${offeringId}`, headers: { cookie } })
  if (deleted.statusCode !== 204) throw new Error('Offering delete failed')

  const [revisionTotal] = await database.db
    .select({ value: count() })
    .from(offeringRevisions)
    .where(eq(offeringRevisions.offeringId, offeringId))
  if ((revisionTotal?.value ?? 0) < 3)
    throw new Error('Offering revisions were not recorded for create, update, and publish')

  process.stdout.write('Offerings smoke test passed.\n')
} finally {
  await app.close()

  if (offeringId) {
    await database.db.delete(auditLogs).where(eq(auditLogs.entityId, offeringId))
    await database.db.delete(offerings).where(eq(offerings.id, offeringId))
  }

  if (userId) {
    await database.db.delete(auditLogs).where(eq(auditLogs.userId, userId))
    await database.db.delete(users).where(eq(users.id, userId))
  }

  await database.close()
}
