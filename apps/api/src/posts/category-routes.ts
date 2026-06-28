import { categoryInputSchema, contentIdSchema } from '@iorder/contracts'
import type { CmsDatabase } from '@iorder/database'
import { auditLogs, categories, postCategories, posts } from '@iorder/database'
import { and, asc, eq, isNull, ne, sql } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'

import { createAuthGuard, requireCmsUser } from '../auth/auth-guard.js'

type CategoryRecord = typeof categories.$inferSelect

export function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

async function uniqueCategorySlug(db: CmsDatabase, base: string, excludedId?: string) {
  const root = base || 'chuyen-muc'
  let slug = root
  let counter = 1
  // Lặp tới khi slug chưa tồn tại (bỏ qua chính bản ghi đang sửa).
  while (true) {
    const filters = excludedId ? and(eq(categories.slug, slug), ne(categories.id, excludedId)) : eq(categories.slug, slug)
    const [existing] = await db.select({ id: categories.id }).from(categories).where(filters).limit(1)
    if (!existing) return slug
    counter += 1
    slug = `${root}-${counter}`
  }
}

function serializeCategory(category: CategoryRecord, postCount = 0) {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    parentId: category.parentId,
    sortOrder: category.sortOrder,
    postCount,
  }
}

export function registerCategoryRoutes(app: FastifyInstance, options: { db: CmsDatabase }) {
  const adminGuard = createAuthGuard(options.db, ['admin'])

  // ── Admin: list (kèm số bài) ───────────────────────────────────────────────
  app.get('/api/admin/categories', { preHandler: adminGuard }, async () => {
    const rows = await options.db
      .select({ category: categories, postCount: sql<number>`count(${postCategories.postId})::int` })
      .from(categories)
      .leftJoin(postCategories, eq(postCategories.categoryId, categories.id))
      .groupBy(categories.id)
      .orderBy(asc(categories.sortOrder), asc(categories.name))
    return { items: rows.map((row) => serializeCategory(row.category, row.postCount)) }
  })

  // ── Admin: create ──────────────────────────────────────────────────────────
  app.post('/api/admin/categories', { preHandler: adminGuard }, async (request, reply) => {
    const input = categoryInputSchema.safeParse(request.body)
    if (!input.success) return reply.code(400).send({ error: 'INVALID_CATEGORY', details: input.error.flatten().fieldErrors })
    const slug = await uniqueCategorySlug(options.db, slugify(input.data.name))
    const [created] = await options.db.insert(categories).values({
      name: input.data.name,
      slug,
      description: input.data.description,
      parentId: input.data.parentId,
      sortOrder: input.data.sortOrder,
    }).returning()
    if (!created) throw new Error('Category was not created')
    const user = requireCmsUser(request)
    await options.db.insert(auditLogs).values({ userId: user.id, action: 'category.create', entityType: 'category', entityId: created.id, afterData: serializeCategory(created) })
    return reply.code(201).send({ item: serializeCategory(created) })
  })

  // ── Admin: update ──────────────────────────────────────────────────────────
  app.patch('/api/admin/categories/:id', { preHandler: adminGuard }, async (request, reply) => {
    const id = contentIdSchema.safeParse((request.params as { id?: unknown }).id)
    const input = categoryInputSchema.safeParse(request.body)
    if (!id.success || !input.success) return reply.code(400).send({ error: 'INVALID_CATEGORY' })
    const [existing] = await options.db.select().from(categories).where(eq(categories.id, id.data)).limit(1)
    if (!existing) return reply.code(404).send({ error: 'CATEGORY_NOT_FOUND' })
    const slug = await uniqueCategorySlug(options.db, slugify(input.data.name), id.data)
    const [updated] = await options.db.update(categories).set({
      name: input.data.name,
      slug,
      description: input.data.description,
      parentId: input.data.parentId,
      sortOrder: input.data.sortOrder,
      updatedAt: new Date(),
    }).where(eq(categories.id, id.data)).returning()
    if (!updated) return reply.code(404).send({ error: 'CATEGORY_NOT_FOUND' })
    const user = requireCmsUser(request)
    await options.db.insert(auditLogs).values({ userId: user.id, action: 'category.update', entityType: 'category', entityId: updated.id, beforeData: serializeCategory(existing), afterData: serializeCategory(updated) })
    return { item: serializeCategory(updated) }
  })

  // ── Admin: delete (gỡ liên kết bài nhờ cascade FK) ─────────────────────────
  app.delete('/api/admin/categories/:id', { preHandler: adminGuard }, async (request, reply) => {
    const id = contentIdSchema.safeParse((request.params as { id?: unknown }).id)
    if (!id.success) return reply.code(400).send({ error: 'INVALID_CATEGORY_ID' })
    const [existing] = await options.db.select().from(categories).where(eq(categories.id, id.data)).limit(1)
    if (!existing) return reply.code(404).send({ error: 'CATEGORY_NOT_FOUND' })
    await options.db.delete(categories).where(eq(categories.id, id.data))
    const user = requireCmsUser(request)
    await options.db.insert(auditLogs).values({ userId: user.id, action: 'category.delete', entityType: 'category', entityId: id.data, beforeData: serializeCategory(existing) })
    return reply.code(204).send()
  })

  // ── Public: chuyên mục có bài đã đăng ──────────────────────────────────────
  app.get('/api/public/categories', async () => {
    const rows = await options.db
      .select({ category: categories, postCount: sql<number>`count(${posts.id})::int` })
      .from(categories)
      .leftJoin(postCategories, eq(postCategories.categoryId, categories.id))
      .leftJoin(posts, and(eq(posts.id, postCategories.postId), eq(posts.status, 'published'), isNull(posts.deletedAt)))
      .groupBy(categories.id)
      .orderBy(asc(categories.sortOrder), asc(categories.name))
    return { items: rows.map((row) => serializeCategory(row.category, row.postCount)) }
  })
}
