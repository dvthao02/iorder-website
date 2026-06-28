import { contentIdSchema, postInputSchema, postListQuerySchema } from '@iorder/contracts'
import type { CmsDatabase } from '@iorder/database'
import { auditLogs, categories, mediaAssets, postCategories, postRevisions, postTags, posts, tags } from '@iorder/database'
import { and, count, desc, eq, ilike, inArray, isNull, lte, max, ne, or, sql } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'

import { createAuthGuard, requireCmsUser } from '../auth/auth-guard.js'
import { slugify } from './category-routes.js'

type TaxRef = { id: string; name: string; slug: string }
type PostTaxonomy = { categories: TaxRef[]; tags: TaxRef[] }
const EMPTY_TAXONOMY: PostTaxonomy = { categories: [], tags: [] }

type PostRecord = typeof posts.$inferSelect

// Đếm lượt xem có chống trùng: cùng một người xem (IP + trình duyệt) trong 30 phút
// chỉ tính 1 lượt. Lưu tạm trong bộ nhớ tiến trình — đủ cho mục đích thống kê.
const VIEW_DEDUP_WINDOW_MS = 30 * 60 * 1000
const recentViews = new Map<string, number>()

function shouldCountView(key: string) {
  const now = Date.now()
  const last = recentViews.get(key)
  if (last && now - last < VIEW_DEDUP_WINDOW_MS) return false
  recentViews.set(key, now)
  if (recentViews.size > 5000) {
    for (const [entryKey, timestamp] of recentViews) {
      if (now - timestamp > VIEW_DEDUP_WINDOW_MS) recentViews.delete(entryKey)
    }
  }
  return true
}

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

function serializePost(post: PostRecord, coverUrl: string | null = null, taxonomy: PostTaxonomy = EMPTY_TAXONOMY) {
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
    viewCount: post.viewCount,
    categories: taxonomy.categories,
    tags: taxonomy.tags,
    publishedAt: post.publishedAt?.toISOString() ?? null,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
  }
}

// Lấy chuyên mục + thẻ cho nhiều bài (tránh N+1).
async function loadTaxonomy(db: CmsDatabase, postIds: string[]) {
  const map = new Map<string, PostTaxonomy>()
  if (postIds.length === 0) return map
  for (const id of postIds) map.set(id, { categories: [], tags: [] })
  const [catRows, tagRows] = await Promise.all([
    db.select({ postId: postCategories.postId, id: categories.id, name: categories.name, slug: categories.slug })
      .from(postCategories).innerJoin(categories, eq(categories.id, postCategories.categoryId))
      .where(inArray(postCategories.postId, postIds)),
    db.select({ postId: postTags.postId, id: tags.id, name: tags.name, slug: tags.slug })
      .from(postTags).innerJoin(tags, eq(tags.id, postTags.tagId))
      .where(inArray(postTags.postId, postIds)),
  ])
  for (const row of catRows) map.get(row.postId)?.categories.push({ id: row.id, name: row.name, slug: row.slug })
  for (const row of tagRows) map.get(row.postId)?.tags.push({ id: row.id, name: row.name, slug: row.slug })
  return map
}

async function taxonomyFor(db: CmsDatabase, postId: string): Promise<PostTaxonomy> {
  return (await loadTaxonomy(db, [postId])).get(postId) ?? { categories: [], tags: [] }
}

async function syncPostCategories(db: CmsDatabase, postId: string, categoryIds: string[]) {
  await db.delete(postCategories).where(eq(postCategories.postId, postId))
  if (categoryIds.length === 0) return
  const valid = await db.select({ id: categories.id }).from(categories).where(inArray(categories.id, categoryIds))
  if (valid.length) await db.insert(postCategories).values(valid.map((row) => ({ postId, categoryId: row.id })))
}

async function syncPostTags(db: CmsDatabase, postId: string, tagNames: string[]) {
  await db.delete(postTags).where(eq(postTags.postId, postId))
  const names = [...new Set(tagNames.map((name) => name.trim()).filter(Boolean))]
  if (names.length === 0) return
  const ids: string[] = []
  for (const name of names) {
    const slug = slugify(name) || name.toLowerCase()
    const [existing] = await db.select({ id: tags.id }).from(tags).where(eq(tags.slug, slug)).limit(1)
    if (existing) { ids.push(existing.id); continue }
    const [created] = await db.insert(tags).values({ name, slug }).returning({ id: tags.id })
    if (created) ids.push(created.id)
  }
  if (ids.length) await db.insert(postTags).values(ids.map((tagId) => ({ postId, tagId })))
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

    const tax = await loadTaxonomy(options.db, rows.map((row) => row.post.id))
    return {
      items: rows.map((row) => serializePost(row.post, row.coverUrl, tax.get(row.post.id))),
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
    return { item: serializePost(row.post, row.coverUrl, await taxonomyFor(options.db, row.post.id)) }
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
    await syncPostCategories(options.db, created.id, input.data.categoryIds)
    await syncPostTags(options.db, created.id, input.data.tags)
    await createRevision(options.db, created, user.id, 'Created draft')
    await options.db.insert(auditLogs).values({ userId: user.id, action: 'post.create', entityType: 'post', entityId: created.id, afterData: serializePost(created) })
    const createdWithCover = await findPost(options.db, created.id)
    return reply.code(201).send({ item: serializePost(created, createdWithCover?.coverUrl ?? null, await taxonomyFor(options.db, created.id)) })
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
    await syncPostCategories(options.db, updated.id, input.data.categoryIds)
    await syncPostTags(options.db, updated.id, input.data.tags)
    await createRevision(options.db, updated, user.id, 'Updated content')
    await options.db.insert(auditLogs).values({ userId: user.id, action: 'post.update', entityType: 'post', entityId: updated.id, beforeData: serializePost(existing.post), afterData: serializePost(updated) })
    const updatedWithCover = await findPost(options.db, updated.id)
    return { item: serializePost(updated, updatedWithCover?.coverUrl ?? null, await taxonomyFor(options.db, updated.id)) }
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
    return { item: serializePost(updated, existing.coverUrl, await taxonomyFor(options.db, updated.id)) }
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
    return { item: serializePost(updated, existing.coverUrl, await taxonomyFor(options.db, updated.id)) }
  })

  app.get('/api/public/posts', async (request, reply) => {
    const parsed = postListQuerySchema.omit({ status: true, search: true }).safeParse(request.query)
    if (!parsed.success) return reply.code(400).send({ error: 'INVALID_QUERY' })
    const filters = [eq(posts.status, 'published'), isNull(posts.deletedAt), lte(posts.publishedAt, new Date())]
    if (parsed.data.type) filters.push(eq(posts.type, parsed.data.type))
    if (parsed.data.category) {
      filters.push(inArray(
        posts.id,
        options.db.select({ id: postCategories.postId }).from(postCategories)
          .innerJoin(categories, eq(categories.id, postCategories.categoryId))
          .where(eq(categories.slug, parsed.data.category)),
      ))
    }
    const offset = (parsed.data.page - 1) * parsed.data.limit
    const rows = await options.db
      .select({ post: posts, coverUrl: mediaAssets.publicUrl })
      .from(posts)
      .leftJoin(mediaAssets, eq(posts.coverMediaId, mediaAssets.id))
      .where(and(...filters))
      .orderBy(desc(posts.publishedAt))
      .limit(parsed.data.limit)
      .offset(offset)
    const tax = await loadTaxonomy(options.db, rows.map((row) => row.post.id))
    return { items: rows.map((row) => serializePost(row.post, row.coverUrl, tax.get(row.post.id))), page: parsed.data.page, limit: parsed.data.limit }
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

    let viewCount = row.post.viewCount
    const viewerKey = `${row.post.id}|${request.ip}|${request.headers['user-agent'] ?? ''}`
    if (shouldCountView(viewerKey)) {
      viewCount += 1
      // Tăng ngầm, không chặn phản hồi; lỗi (nếu có) bỏ qua.
      void options.db.update(posts).set({ viewCount: sql`${posts.viewCount} + 1` }).where(eq(posts.id, row.post.id)).then(undefined, () => {})
    }
    return { item: serializePost({ ...row.post, viewCount }, row.coverUrl, await taxonomyFor(options.db, row.post.id)) }
  })
}
