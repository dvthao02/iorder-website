import { contentIdSchema, postInputSchema, postListQuerySchema } from '@iorder/contracts'
import type { CmsDatabase } from '@iorder/database'
import { auditLogs, mediaAssets, postRevisions, posts } from '@iorder/database'
import { and, count, desc, eq, ilike, isNull, lte, max, ne, or } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'

import { createAuthGuard, requireCmsUser } from '../auth/auth-guard.js'

type PostRecord = typeof posts.$inferSelect

function postBody(post: PostRecord) {
  const body = (post.contentJson as { body?: unknown }).body
  return typeof body === 'string' ? body : ''
}

function postMetadata(post: PostRecord) {
  const content = post.contentJson as { category?: unknown; checklist?: unknown }
  return {
    category: typeof content.category === 'string' ? content.category : null,
    checklist: Array.isArray(content.checklist) ? content.checklist.filter((item): item is string => typeof item === 'string') : [],
  }
}

function serializePost(post: PostRecord, coverUrl: string | null = null) {
  return {
    id: post.id,
    type: post.type,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    body: postBody(post),
    ...postMetadata(post),
    status: post.status,
    coverMediaId: post.coverMediaId,
    coverUrl,
    seoTitle: post.seoTitle,
    seoDescription: post.seoDescription,
    canonicalUrl: post.canonicalUrl,
    promotionStartAt: post.promotionStartAt?.toISOString() ?? null,
    promotionEndAt: post.promotionEndAt?.toISOString() ?? null,
    ctaLabel: post.ctaLabel,
    ctaUrl: post.ctaUrl,
    badgeText: post.badgeText,
    publishedAt: post.publishedAt?.toISOString() ?? null,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
  }
}

async function coverExists(db: CmsDatabase, id: string | null) {
  if (!id) return true
  const [asset] = await db.select({ id: mediaAssets.id }).from(mediaAssets).where(eq(mediaAssets.id, id)).limit(1)
  return Boolean(asset)
}

async function slugExists(db: CmsDatabase, slug: string, excludedId?: string) {
  const filters = [eq(posts.slug, slug), isNull(posts.deletedAt)]
  if (excludedId) filters.push(ne(posts.id, excludedId))
  const [post] = await db.select({ id: posts.id }).from(posts).where(and(...filters)).limit(1)
  return Boolean(post)
}

async function createRevision(db: CmsDatabase, post: PostRecord, editorId: string, changeNote: string) {
  const [current] = await db
    .select({ version: max(postRevisions.versionNumber) })
    .from(postRevisions)
    .where(eq(postRevisions.postId, post.id))

  await db.insert(postRevisions).values({
    postId: post.id,
    editorId,
    versionNumber: (current?.version ?? 0) + 1,
    title: post.title,
    contentSnapshot: serializePost(post),
    changeNote,
  })
}

async function findPost(db: CmsDatabase, id: string) {
  const [row] = await db
    .select({ post: posts, coverUrl: mediaAssets.publicUrl })
    .from(posts)
    .leftJoin(mediaAssets, eq(posts.coverMediaId, mediaAssets.id))
    .where(and(eq(posts.id, id), isNull(posts.deletedAt)))
    .limit(1)
  return row
}

export function registerPostRoutes(app: FastifyInstance, options: { db: CmsDatabase }) {
  const adminGuard = createAuthGuard(options.db, ['admin'])

  app.get('/api/admin/posts', { preHandler: adminGuard }, async (request, reply) => {
    const parsed = postListQuerySchema.safeParse(request.query)
    if (!parsed.success) return reply.code(400).send({ error: 'INVALID_QUERY' })

    const filters = [isNull(posts.deletedAt)]
    if (parsed.data.type) filters.push(eq(posts.type, parsed.data.type))
    if (parsed.data.status) filters.push(eq(posts.status, parsed.data.status))
    if (parsed.data.search) filters.push(ilike(posts.title, `%${parsed.data.search}%`))
    const where = and(...filters)
    const offset = (parsed.data.page - 1) * parsed.data.limit
    const [rows, totals] = await Promise.all([
      options.db
        .select({ post: posts, coverUrl: mediaAssets.publicUrl })
        .from(posts)
        .leftJoin(mediaAssets, eq(posts.coverMediaId, mediaAssets.id))
        .where(where)
        .orderBy(desc(posts.updatedAt))
        .limit(parsed.data.limit)
        .offset(offset),
      options.db.select({ value: count() }).from(posts).where(where),
    ])

    return {
      items: rows.map((row) => serializePost(row.post, row.coverUrl)),
      total: totals[0]?.value ?? 0,
      page: parsed.data.page,
      limit: parsed.data.limit,
    }
  })

  app.get('/api/admin/posts/:id', { preHandler: adminGuard }, async (request, reply) => {
    const id = contentIdSchema.safeParse((request.params as { id?: unknown }).id)
    if (!id.success) return reply.code(400).send({ error: 'INVALID_POST_ID' })
    const row = await findPost(options.db, id.data)
    if (!row) return reply.code(404).send({ error: 'POST_NOT_FOUND' })
    return { item: serializePost(row.post, row.coverUrl) }
  })

  app.post('/api/admin/posts', { preHandler: adminGuard }, async (request, reply) => {
    const input = postInputSchema.safeParse(request.body)
    if (!input.success) return reply.code(400).send({ error: 'INVALID_POST', details: input.error.flatten().fieldErrors })
    if (await slugExists(options.db, input.data.slug)) return reply.code(409).send({ error: 'SLUG_EXISTS' })
    if (!(await coverExists(options.db, input.data.coverMediaId))) return reply.code(400).send({ error: 'COVER_MEDIA_NOT_FOUND' })

    const user = requireCmsUser(request)
    const [created] = await options.db.insert(posts).values({
      authorId: user.id,
      coverMediaId: input.data.coverMediaId,
      type: input.data.type,
      title: input.data.title,
      slug: input.data.slug,
      excerpt: input.data.excerpt,
      contentJson: { body: input.data.body, category: input.data.category, checklist: input.data.checklist },
      status: 'draft',
      seoTitle: input.data.seoTitle,
      seoDescription: input.data.seoDescription,
      canonicalUrl: input.data.canonicalUrl,
      promotionStartAt: input.data.promotionStartAt,
      promotionEndAt: input.data.promotionEndAt,
      ctaLabel: input.data.ctaLabel,
      ctaUrl: input.data.ctaUrl,
      badgeText: input.data.badgeText,
    }).returning()

    if (!created) throw new Error('Post was not created')
    await createRevision(options.db, created, user.id, 'Created draft')
    await options.db.insert(auditLogs).values({ userId: user.id, action: 'post.create', entityType: 'post', entityId: created.id, afterData: serializePost(created) })
    const createdWithCover = await findPost(options.db, created.id)
    return reply.code(201).send({ item: serializePost(created, createdWithCover?.coverUrl ?? null) })
  })

  app.patch('/api/admin/posts/:id', { preHandler: adminGuard }, async (request, reply) => {
    const id = contentIdSchema.safeParse((request.params as { id?: unknown }).id)
    const input = postInputSchema.safeParse(request.body)
    if (!id.success || !input.success) return reply.code(400).send({ error: 'INVALID_POST' })
    const existing = await findPost(options.db, id.data)
    if (!existing) return reply.code(404).send({ error: 'POST_NOT_FOUND' })
    if (await slugExists(options.db, input.data.slug, id.data)) return reply.code(409).send({ error: 'SLUG_EXISTS' })
    if (!(await coverExists(options.db, input.data.coverMediaId))) return reply.code(400).send({ error: 'COVER_MEDIA_NOT_FOUND' })

    const [updated] = await options.db.update(posts).set({
      coverMediaId: input.data.coverMediaId,
      type: input.data.type,
      title: input.data.title,
      slug: input.data.slug,
      excerpt: input.data.excerpt,
      contentJson: { body: input.data.body, category: input.data.category, checklist: input.data.checklist },
      seoTitle: input.data.seoTitle,
      seoDescription: input.data.seoDescription,
      canonicalUrl: input.data.canonicalUrl,
      promotionStartAt: input.data.promotionStartAt,
      promotionEndAt: input.data.promotionEndAt,
      ctaLabel: input.data.ctaLabel,
      ctaUrl: input.data.ctaUrl,
      badgeText: input.data.badgeText,
      updatedAt: new Date(),
    }).where(eq(posts.id, id.data)).returning()

    if (!updated) return reply.code(404).send({ error: 'POST_NOT_FOUND' })
    const user = requireCmsUser(request)
    await createRevision(options.db, updated, user.id, 'Updated content')
    await options.db.insert(auditLogs).values({ userId: user.id, action: 'post.update', entityType: 'post', entityId: updated.id, beforeData: serializePost(existing.post), afterData: serializePost(updated) })
    const updatedWithCover = await findPost(options.db, updated.id)
    return { item: serializePost(updated, updatedWithCover?.coverUrl ?? null) }
  })

  app.post('/api/admin/posts/:id/publish', { preHandler: adminGuard }, async (request, reply) => {
    const id = contentIdSchema.safeParse((request.params as { id?: unknown }).id)
    if (!id.success) return reply.code(400).send({ error: 'INVALID_POST_ID' })
    const existing = await findPost(options.db, id.data)
    if (!existing) return reply.code(404).send({ error: 'POST_NOT_FOUND' })
    const [updated] = await options.db.update(posts).set({ status: 'published', publishedAt: new Date(), updatedAt: new Date() }).where(eq(posts.id, id.data)).returning()
    if (!updated) return reply.code(404).send({ error: 'POST_NOT_FOUND' })
    const user = requireCmsUser(request)
    await createRevision(options.db, updated, user.id, 'Published')
    await options.db.insert(auditLogs).values({ userId: user.id, action: 'post.publish', entityType: 'post', entityId: updated.id })
    return { item: serializePost(updated, existing.coverUrl) }
  })

  app.post('/api/admin/posts/:id/archive', { preHandler: adminGuard }, async (request, reply) => {
    const id = contentIdSchema.safeParse((request.params as { id?: unknown }).id)
    if (!id.success) return reply.code(400).send({ error: 'INVALID_POST_ID' })
    const existing = await findPost(options.db, id.data)
    if (!existing) return reply.code(404).send({ error: 'POST_NOT_FOUND' })
    const [updated] = await options.db.update(posts).set({ status: 'archived', updatedAt: new Date() }).where(eq(posts.id, id.data)).returning()
    if (!updated) return reply.code(404).send({ error: 'POST_NOT_FOUND' })
    const user = requireCmsUser(request)
    await createRevision(options.db, updated, user.id, 'Archived')
    await options.db.insert(auditLogs).values({ userId: user.id, action: 'post.archive', entityType: 'post', entityId: updated.id })
    return { item: serializePost(updated, existing.coverUrl) }
  })

  app.get('/api/public/posts', async (request, reply) => {
    const parsed = postListQuerySchema.omit({ status: true, search: true }).safeParse(request.query)
    if (!parsed.success) return reply.code(400).send({ error: 'INVALID_QUERY' })
    const filters = [eq(posts.status, 'published'), isNull(posts.deletedAt), lte(posts.publishedAt, new Date())]
    if (parsed.data.type) filters.push(eq(posts.type, parsed.data.type))
    const offset = (parsed.data.page - 1) * parsed.data.limit
    const rows = await options.db
      .select({ post: posts, coverUrl: mediaAssets.publicUrl })
      .from(posts)
      .leftJoin(mediaAssets, eq(posts.coverMediaId, mediaAssets.id))
      .where(and(...filters))
      .orderBy(desc(posts.publishedAt))
      .limit(parsed.data.limit)
      .offset(offset)
    return { items: rows.map((row) => serializePost(row.post, row.coverUrl)), page: parsed.data.page, limit: parsed.data.limit }
  })

  app.get('/api/public/posts/:slug', async (request, reply) => {
    const slug = String((request.params as { slug?: unknown }).slug ?? '')
    const [row] = await options.db
      .select({ post: posts, coverUrl: mediaAssets.publicUrl })
      .from(posts)
      .leftJoin(mediaAssets, eq(posts.coverMediaId, mediaAssets.id))
      .where(and(eq(posts.slug, slug), eq(posts.status, 'published'), isNull(posts.deletedAt), or(isNull(posts.publishedAt), lte(posts.publishedAt, new Date()))))
      .limit(1)
    if (!row) return reply.code(404).send({ error: 'POST_NOT_FOUND' })
    return { item: serializePost(row.post, row.coverUrl) }
  })
}
