import {
  contentIdSchema,
  offeringInputSchema,
  offeringListQuerySchema,
  offeringTypeSchema,
  slugSchema,
} from '@iorder/contracts'
import type { CmsDatabase } from '@iorder/database'
import { auditLogs, mediaAssets, offeringRevisions, offerings } from '@iorder/database'
import { and, asc, count, desc, eq, ilike, isNull, max, ne, or } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'

import { createAuthGuard, requireCmsUser } from '../auth/auth-guard.js'

type OfferingRecord = typeof offerings.$inferSelect

function serializeOffering(offering: OfferingRecord, coverUrl: string | null = null) {
  return {
    id: offering.id,
    type: offering.type,
    title: offering.title,
    slug: offering.slug,
    summary: offering.summary,
    icon: offering.icon,
    coverMediaId: offering.coverMediaId,
    coverUrl,
    sortOrder: offering.sortOrder,
    isFeatured: offering.isFeatured,
    status: offering.status,
    seoTitle: offering.seoTitle,
    seoDescription: offering.seoDescription,
    canonicalUrl: offering.canonicalUrl,
    publishedAt: offering.publishedAt?.toISOString() ?? null,
    createdAt: offering.createdAt.toISOString(),
    updatedAt: offering.updatedAt.toISOString(),
    contentJson: offering.contentJson as Record<string, unknown>,
  }
}

async function resolveMediaUrl(db: CmsDatabase, id: string | null): Promise<string | null> {
  if (!id) return null
  const [asset] = await db.select({ publicUrl: mediaAssets.publicUrl }).from(mediaAssets).where(eq(mediaAssets.id, id)).limit(1)
  return asset?.publicUrl ?? null
}

async function coverExists(db: CmsDatabase, id: string | null) {
  if (!id) return true
  const [asset] = await db.select({ id: mediaAssets.id }).from(mediaAssets).where(eq(mediaAssets.id, id)).limit(1)
  return Boolean(asset)
}

async function slugExistsForType(db: CmsDatabase, type: string, slug: string, excludedId?: string) {
  const filters = [eq(offerings.type, type as typeof offerings.type._.data), eq(offerings.slug, slug), isNull(offerings.deletedAt)]
  if (excludedId) filters.push(ne(offerings.id, excludedId))
  const [row] = await db.select({ id: offerings.id }).from(offerings).where(and(...filters)).limit(1)
  return Boolean(row)
}

async function createRevision(db: CmsDatabase, offering: OfferingRecord, editorId: string, changeNote: string) {
  const [current] = await db
    .select({ version: max(offeringRevisions.versionNumber) })
    .from(offeringRevisions)
    .where(eq(offeringRevisions.offeringId, offering.id))

  await db.insert(offeringRevisions).values({
    offeringId: offering.id,
    editorId,
    versionNumber: (current?.version ?? 0) + 1,
    contentSnapshot: serializeOffering(offering),
    changeNote,
  })
}

async function findOffering(db: CmsDatabase, id: string) {
  const [row] = await db.select().from(offerings).where(and(eq(offerings.id, id), isNull(offerings.deletedAt))).limit(1)
  return row ?? null
}

export function registerOfferingRoutes(app: FastifyInstance, { db }: { db: CmsDatabase }) {
  const authGuard = createAuthGuard(db)

  // ── Admin: list offerings ─────────────────────────────────────────────────
  app.get('/api/admin/offerings', { preHandler: [authGuard] }, async (request) => {
    requireCmsUser(request)
    const query = offeringListQuerySchema.parse(request.query)
    const filters = [isNull(offerings.deletedAt)]
    if (query.type) filters.push(eq(offerings.type, query.type))
    if (query.status) filters.push(eq(offerings.status, query.status))
    if (query.search) filters.push(or(ilike(offerings.title, `%${query.search}%`), ilike(offerings.slug, `%${query.search}%`))!)

    const offset = (query.page - 1) * query.limit
    const [rows, countRows] = await Promise.all([
      db.select().from(offerings).where(and(...filters)).orderBy(asc(offerings.type), asc(offerings.sortOrder), desc(offerings.updatedAt)).limit(query.limit).offset(offset),
      db.select({ total: count() }).from(offerings).where(and(...filters)),
    ])
    const total = countRows[0]?.total ?? 0

    const withUrls = await Promise.all(rows.map(async (o) => serializeOffering(o, await resolveMediaUrl(db, o.coverMediaId))))
    return { items: withUrls, total, page: query.page, limit: query.limit }
  })

  // ── Admin: get single ─────────────────────────────────────────────────────
  app.get('/api/admin/offerings/:id', { preHandler: [authGuard] }, async (request, reply) => {
    requireCmsUser(request)
    const { id } = request.params as { id: string }
    const parsed = contentIdSchema.safeParse(id)
    if (!parsed.success) return reply.code(400).send({ error: 'BAD_ID' })
    const offering = await findOffering(db, parsed.data)
    if (!offering) return reply.code(404).send({ error: 'NOT_FOUND' })
    return { item: serializeOffering(offering, await resolveMediaUrl(db, offering.coverMediaId)) }
  })

  // ── Admin: create ─────────────────────────────────────────────────────────
  app.post('/api/admin/offerings', { preHandler: [authGuard] }, async (request, reply) => {
    const user = requireCmsUser(request)
    const body = offeringInputSchema.safeParse(request.body)
    if (!body.success) return reply.code(400).send({ error: 'VALIDATION_ERROR', issues: body.error.issues })

    const input = body.data
    if (!await coverExists(db, input.coverMediaId)) return reply.code(422).send({ error: 'COVER_NOT_FOUND' })
    if (await slugExistsForType(db, input.type, input.slug)) return reply.code(409).send({ error: 'SLUG_EXISTS' })

    const insertedRows = await db.insert(offerings).values({
      type: input.type,
      title: input.title,
      slug: input.slug,
      summary: input.summary,
      icon: input.icon,
      coverMediaId: input.coverMediaId,
      sortOrder: input.sortOrder,
      isFeatured: input.isFeatured,
      seoTitle: input.seoTitle,
      seoDescription: input.seoDescription,
      canonicalUrl: input.canonicalUrl,
      contentJson: input.contentJson,
      status: 'draft',
    }).returning()
    const offering = insertedRows[0]!

    await createRevision(db, offering, user.id, 'Created')
    await db.insert(auditLogs).values({ userId: user.id, action: 'offering.create', entityType: 'offering', entityId: offering.id, afterData: serializeOffering(offering) })

    return reply.code(201).send({ item: serializeOffering(offering, await resolveMediaUrl(db, offering.coverMediaId)) })
  })

  // ── Admin: update ─────────────────────────────────────────────────────────
  app.patch('/api/admin/offerings/:id', { preHandler: [authGuard] }, async (request, reply) => {
    const user = requireCmsUser(request)
    const { id } = request.params as { id: string }
    const offering = await findOffering(db, id)
    if (!offering) return reply.code(404).send({ error: 'NOT_FOUND' })

    const body = offeringInputSchema.safeParse(request.body)
    if (!body.success) return reply.code(400).send({ error: 'VALIDATION_ERROR', issues: body.error.issues })

    const input = body.data
    if (!await coverExists(db, input.coverMediaId)) return reply.code(422).send({ error: 'COVER_NOT_FOUND' })
    if (input.slug !== offering.slug && await slugExistsForType(db, input.type, input.slug, id)) return reply.code(409).send({ error: 'SLUG_EXISTS' })

    const rows = await db.update(offerings).set({
      title: input.title,
      slug: input.slug,
      summary: input.summary,
      icon: input.icon,
      coverMediaId: input.coverMediaId,
      sortOrder: input.sortOrder,
      isFeatured: input.isFeatured,
      seoTitle: input.seoTitle,
      seoDescription: input.seoDescription,
      canonicalUrl: input.canonicalUrl,
      contentJson: input.contentJson,
      updatedAt: new Date(),
    }).where(eq(offerings.id, id)).returning()
    const updated = rows[0]!

    await createRevision(db, updated, user.id, 'Updated')
    await db.insert(auditLogs).values({ userId: user.id, action: 'offering.update', entityType: 'offering', entityId: id, beforeData: serializeOffering(offering), afterData: serializeOffering(updated) })

    return { item: serializeOffering(updated, await resolveMediaUrl(db, updated.coverMediaId)) }
  })

  // ── Admin: publish ────────────────────────────────────────────────────────
  app.post('/api/admin/offerings/:id/publish', { preHandler: [authGuard] }, async (request, reply) => {
    const user = requireCmsUser(request)
    const { id } = request.params as { id: string }
    const offering = await findOffering(db, id)
    if (!offering) return reply.code(404).send({ error: 'NOT_FOUND' })

    const now = new Date()
    const pubRows = await db.update(offerings).set({ status: 'published', publishedAt: offering.publishedAt ?? now, updatedAt: now }).where(eq(offerings.id, id)).returning()
    const updated = pubRows[0]!
    await createRevision(db, updated, user.id, 'Published')
    await db.insert(auditLogs).values({ userId: user.id, action: 'offering.publish', entityType: 'offering', entityId: id })

    return { item: serializeOffering(updated, await resolveMediaUrl(db, updated.coverMediaId)) }
  })

  // ── Admin: archive ────────────────────────────────────────────────────────
  app.post('/api/admin/offerings/:id/archive', { preHandler: [authGuard] }, async (request, reply) => {
    const user = requireCmsUser(request)
    const { id } = request.params as { id: string }
    const offering = await findOffering(db, id)
    if (!offering) return reply.code(404).send({ error: 'NOT_FOUND' })

    const archRows = await db.update(offerings).set({ status: 'archived', updatedAt: new Date() }).where(eq(offerings.id, id)).returning()
    const updated = archRows[0]!
    await db.insert(auditLogs).values({ userId: user.id, action: 'offering.archive', entityType: 'offering', entityId: id })

    return { item: serializeOffering(updated, await resolveMediaUrl(db, updated.coverMediaId)) }
  })

  // ── Admin: delete ─────────────────────────────────────────────────────────
  app.delete('/api/admin/offerings/:id', { preHandler: [authGuard] }, async (request, reply) => {
    const user = requireCmsUser(request)
    const { id } = request.params as { id: string }
    const offering = await findOffering(db, id)
    if (!offering) return reply.code(404).send({ error: 'NOT_FOUND' })

    await db.update(offerings).set({ deletedAt: new Date(), updatedAt: new Date() }).where(eq(offerings.id, id))
    await db.insert(auditLogs).values({ userId: user.id, action: 'offering.delete', entityType: 'offering', entityId: id })

    return reply.code(204).send()
  })

  // ── Public: list by type ──────────────────────────────────────────────────
  app.get('/api/public/offerings', async (request) => {
    const query = offeringTypeSchema.optional().safeParse((request.query as { type?: string }).type)
    const typeFilter = query.success && query.data ? [eq(offerings.type, query.data)] : []
    const rows = await db.select().from(offerings).where(and(eq(offerings.status, 'published'), isNull(offerings.deletedAt), ...typeFilter)).orderBy(asc(offerings.sortOrder), asc(offerings.title))
    const withUrls = await Promise.all(rows.map(async (o) => serializeOffering(o, await resolveMediaUrl(db, o.coverMediaId))))
    return { items: withUrls }
  })

  // ── Public: get by type + slug ────────────────────────────────────────────
  app.get('/api/public/offerings/:type/:slug', async (request, reply) => {
    const { type, slug } = request.params as { type: string; slug: string }
    const typeResult = offeringTypeSchema.safeParse(type)
    const slugResult = slugSchema.safeParse(slug)
    if (!typeResult.success || !slugResult.success) return reply.code(400).send({ error: 'BAD_PARAMS' })

    const [row] = await db.select().from(offerings).where(and(eq(offerings.type, typeResult.data), eq(offerings.slug, slugResult.data), eq(offerings.status, 'published'), isNull(offerings.deletedAt))).limit(1)
    if (!row) return reply.code(404).send({ error: 'NOT_FOUND' })

    return { item: serializeOffering(row, await resolveMediaUrl(db, row.coverMediaId)) }
  })
}
