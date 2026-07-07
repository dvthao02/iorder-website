import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createDatabase } from '@iorder/database'
import { auditLogs, pageRevisions, pages, roles, userRoles, users } from '@iorder/database'
import { config } from 'dotenv'
import { count, eq } from 'drizzle-orm'

import { buildApp } from './app.js'
import { hashPassword } from './auth/password.js'
import { readEnv } from './env.js'

config({ path: resolve(dirname(fileURLToPath(import.meta.url)), '../../../.env') })

const smokeSlug = `homepage-smoke-${Date.now()}`
const env = readEnv({ ...process.env, NODE_ENV: 'test', HOMEPAGE_SLUG: smokeSlug })
const database = createDatabase(env.DATABASE_URL)
const app = await buildApp(env)
const username = `homepage-smoke-${Date.now()}`
const password = 'homepage-smoke-password-123'
let userId: string | null = null
let pageId: string | null = null

const input = {
  title: 'Homepage',
  seoTitle: 'iOrder smoke homepage',
  seoDescription: 'Homepage smoke test',
  canonicalUrl: null,
  blocks: [
    {
      type: 'home_hero',
      isEnabled: true,
      data: {
        eyebrow: 'iOrder',
        title: 'Published hero title',
        description: 'Homepage smoke description',
        imageMediaId: null,
        primaryLabel: 'Contact',
        primaryUrl: '/lien-he',
        secondaryLabel: null,
        secondaryUrl: null,
        points: [],
        slides: [],
      },
    },
    {
      type: 'home_featured_posts',
      isEnabled: true,
      data: {
        eyebrow: 'News',
        heading: 'Latest posts',
        intro: null,
        postType: 'all',
        limit: 3,
        allLabel: 'View all',
        allUrl: '/tin-tuc',
      },
    },
  ],
}

try {
  const [role] = await database.db.select({ id: roles.id }).from(roles).where(eq(roles.code, 'admin')).limit(1)
  if (!role) throw new Error('Admin role missing')

  const [user] = await database.db
    .insert(users)
    .values({
      username,
      fullName: 'Homepage Smoke User',
      passwordHash: await hashPassword(password),
      status: 'active',
    })
    .returning({ id: users.id })
  if (!user) throw new Error('Smoke user missing')
  userId = user.id
  await database.db.insert(userRoles).values({ userId, roleId: role.id })

  const login = await app.inject({ method: 'POST', url: '/api/admin/auth/login', payload: { username, password } })
  const header = login.headers['set-cookie']
  const raw = Array.isArray(header) ? header[0] : header
  const cookie = raw?.split(';', 1)[0]
  if (!cookie) throw new Error('Login failed')

  const saved = await app.inject({ method: 'PUT', url: '/api/admin/homepage', headers: { cookie }, payload: input })
  if (saved.statusCode !== 200) throw new Error(`Homepage save failed: ${saved.body}`)
  pageId = saved.json<{ item: { id: string } }>().item.id

  const beforePublish = await app.inject({ method: 'GET', url: '/api/public/homepage' })
  if (beforePublish.statusCode !== 404) throw new Error('Draft homepage was public')

  const published = await app.inject({ method: 'POST', url: '/api/admin/homepage/publish', headers: { cookie } })
  if (published.statusCode !== 200) throw new Error('Homepage publish failed')

  const publicPage = await app.inject({ method: 'GET', url: '/api/public/homepage' })
  if (publicPage.statusCode !== 200 || !publicPage.body.includes('Published hero title'))
    throw new Error('Published homepage missing')

  const draftChanged = structuredClone(input)
  draftChanged.blocks[0]!.data.title = 'Unpublished changed title'
  const resaved = await app.inject({
    method: 'PUT',
    url: '/api/admin/homepage',
    headers: { cookie },
    payload: draftChanged,
  })
  if (resaved.statusCode !== 200) throw new Error('Homepage resave failed')

  const stablePublic = await app.inject({ method: 'GET', url: '/api/public/homepage' })
  if (stablePublic.body.includes('Unpublished changed title')) throw new Error('Draft leaked over published snapshot')

  const [revisions] = await database.db
    .select({ value: count() })
    .from(pageRevisions)
    .where(eq(pageRevisions.pageId, pageId))
  if ((revisions?.value ?? 0) < 3) throw new Error('Homepage revisions missing')

  process.stdout.write('Homepage smoke test passed.\n')
} finally {
  await app.close()
  if (pageId) {
    await database.db.delete(auditLogs).where(eq(auditLogs.entityId, pageId))
    await database.db.delete(pages).where(eq(pages.id, pageId))
  }
  if (userId) {
    await database.db.delete(auditLogs).where(eq(auditLogs.userId, userId))
    await database.db.delete(users).where(eq(users.id, userId))
  }
  await database.close()
}
