import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createDatabase } from '@iorder/database'
import { auditLogs, postRevisions, posts, roles, userRoles, users } from '@iorder/database'
import { config } from 'dotenv'
import { count, eq } from 'drizzle-orm'

import { PostsRepository } from './modules/posts/posts.repository.js'
import { PostsService } from './modules/posts/posts.service.js'
import { HookManager } from './shared/hooks/index.js'

import { buildApp } from './app.js'
import { hashPassword } from './auth/password.js'
import { readEnv } from './env.js'

const currentDirectory = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(currentDirectory, '../../../.env') })

const env = readEnv({ ...process.env, NODE_ENV: 'test' })
const database = createDatabase(env.DATABASE_URL)
const app = await buildApp(env)
const username = `posts-smoke-${Date.now()}`
const password = 'posts-smoke-password-123'
const slug = `posts-smoke-${Date.now()}`
const scheduledSlug = `posts-smoke-scheduled-${Date.now()}`
let userId: string | null = null
let postId: string | null = null
let scheduledPostId: string | null = null

const draftInput = {
  type: 'news',
  title: 'Posts smoke draft',
  slug,
  excerpt: 'Temporary post used by the integration smoke test.',
  body: 'First paragraph\n\nSecond paragraph',
  category: 'Smoke category',
  checklist: ['Smoke checklist'],
  coverMediaId: null,
  seoTitle: 'Posts smoke draft',
  seoDescription: 'Temporary SEO description for the posts smoke test.',
  canonicalUrl: null,
  promotionStartAt: null,
  promotionEndAt: null,
  ctaLabel: null,
  ctaUrl: null,
  badgeText: null,
}

try {
  const [adminRole] = await database.db.select({ id: roles.id }).from(roles).where(eq(roles.code, 'admin')).limit(1)
  if (!adminRole) throw new Error('Admin role is missing. Run the core database seed first.')

  const [user] = await database.db
    .insert(users)
    .values({
      username,
      fullName: 'Posts Smoke User',
      passwordHash: await hashPassword(password),
      status: 'active',
    })
    .returning({ id: users.id })
  if (!user) throw new Error('Smoke user could not be created')
  userId = user.id
  await database.db.insert(userRoles).values({ userId, roleId: adminRole.id })

  const unauthenticated = await app.inject({ method: 'GET', url: '/api/admin/posts' })
  if (unauthenticated.statusCode !== 401) throw new Error('Admin posts list did not require authentication')

  const login = await app.inject({ method: 'POST', url: '/api/admin/auth/login', payload: { username, password } })
  const setCookie = login.headers['set-cookie']
  const rawCookie = Array.isArray(setCookie) ? setCookie[0] : setCookie
  const cookie = rawCookie?.split(';', 1)[0]
  if (login.statusCode !== 200 || !cookie) throw new Error('Posts smoke login failed')

  const created = await app.inject({
    method: 'POST',
    url: '/api/admin/posts',
    headers: { cookie },
    payload: draftInput,
  })
  if (created.statusCode !== 201) throw new Error(`Post create failed: ${created.statusCode} ${created.body}`)
  postId = created.json<{ item: { id: string; status: string } }>().item.id

  const hiddenDraft = await app.inject({ method: 'GET', url: `/api/public/posts/${slug}` })
  if (hiddenDraft.statusCode !== 404) throw new Error('Draft post was exposed by public API')

  const duplicate = await app.inject({
    method: 'POST',
    url: '/api/admin/posts',
    headers: { cookie },
    payload: draftInput,
  })
  if (duplicate.statusCode !== 409) throw new Error('Duplicate post slug was not rejected')

  const updated = await app.inject({
    method: 'PATCH',
    url: `/api/admin/posts/${postId}`,
    headers: { cookie },
    payload: { ...draftInput, title: 'Updated posts smoke draft' },
  })
  if (updated.statusCode !== 200 || !updated.body.includes('Updated posts smoke draft'))
    throw new Error('Post update failed')

  const published = await app.inject({ method: 'POST', url: `/api/admin/posts/${postId}/publish`, headers: { cookie } })
  if (published.statusCode !== 200 || !published.body.includes('published')) throw new Error('Post publish failed')

  const publicPost = await app.inject({ method: 'GET', url: `/api/public/posts/${slug}` })
  if (publicPost.statusCode !== 200 || !publicPost.body.includes('Updated posts smoke draft'))
    throw new Error('Published post was not returned by public API')

  const publicList = await app.inject({ method: 'GET', url: '/api/public/posts?type=news' })
  if (publicList.statusCode !== 200 || !publicList.body.includes(postId))
    throw new Error('Published post was not returned by public list')

  const archived = await app.inject({ method: 'POST', url: `/api/admin/posts/${postId}/archive`, headers: { cookie } })
  if (archived.statusCode !== 200 || !archived.body.includes('archived')) throw new Error('Post archive failed')

  const hiddenArchived = await app.inject({ method: 'GET', url: `/api/public/posts/${slug}` })
  if (hiddenArchived.statusCode !== 404) throw new Error('Archived post was exposed by public API')

  const [revisionTotal] = await database.db
    .select({ value: count() })
    .from(postRevisions)
    .where(eq(postRevisions.postId, postId))
  if ((revisionTotal?.value ?? 0) < 4)
    throw new Error('Post revisions were not recorded for create, update, publish, and archive')

  // Scheduler: tạo bài với scheduledAt ở quá khứ, gọi trực tiếp service.publishDueScheduled()
  // và xác nhận bài xuất hiện trong danh sách public sau khi được tự động publish.
  const scheduledCreate = await app.inject({
    method: 'POST',
    url: '/api/admin/posts',
    headers: { cookie },
    payload: { ...draftInput, slug: scheduledSlug, title: 'Posts smoke scheduled draft' },
  })
  if (scheduledCreate.statusCode !== 201)
    throw new Error(`Scheduled post create failed: ${scheduledCreate.statusCode} ${scheduledCreate.body}`)
  scheduledPostId = scheduledCreate.json<{ item: { id: string } }>().item.id

  const pastDate = new Date(Date.now() - 60_000)
  await database.db.update(posts).set({ scheduledAt: pastDate }).where(eq(posts.id, scheduledPostId))

  const repository = new PostsRepository(database.db)
  const postsService = new PostsService(repository, new HookManager())
  const schedulerResult = await postsService.publishDueScheduled()
  if (!schedulerResult.published.some((item) => item.id === scheduledPostId))
    throw new Error('publishDueScheduled did not publish the due scheduled post')

  const scheduledPublicPost = await app.inject({ method: 'GET', url: `/api/public/posts/${scheduledSlug}` })
  if (scheduledPublicPost.statusCode !== 200)
    throw new Error('Auto-published scheduled post was not returned by public API')

  process.stdout.write('Posts smoke test passed.\n')
} finally {
  await app.close()

  if (postId) {
    await database.db.delete(auditLogs).where(eq(auditLogs.entityId, postId))
    await database.db.delete(posts).where(eq(posts.id, postId))
  }

  if (scheduledPostId) {
    await database.db.delete(auditLogs).where(eq(auditLogs.entityId, scheduledPostId))
    await database.db.delete(posts).where(eq(posts.id, scheduledPostId))
  }

  if (userId) {
    await database.db.delete(auditLogs).where(eq(auditLogs.userId, userId))
    await database.db.delete(users).where(eq(users.id, userId))
  }

  await database.close()
}
