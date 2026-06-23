import { contentIdSchema, testimonialInputSchema } from '@iorder/contracts'
import type { CmsDatabase } from '@iorder/database'
import { auditLogs, mediaAssets, testimonials } from '@iorder/database'
import { asc, eq } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'

import { createAuthGuard, requireCmsUser } from '../auth/auth-guard.js'

type TestimonialRecord = typeof testimonials.$inferSelect

function serializeTestimonial(item: TestimonialRecord, avatarUrl: string | null = null) {
  return {
    id: item.id,
    authorName: item.authorName,
    authorRole: item.authorRole,
    company: item.company,
    quote: item.quote,
    rating: item.rating,
    avatarMediaId: item.avatarMediaId,
    avatarUrl,
    sortOrder: item.sortOrder,
    isEnabled: item.isEnabled,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }
}

async function avatarExists(db: CmsDatabase, id: string | null) {
  if (!id) return true
  const [asset] = await db.select({ id: mediaAssets.id }).from(mediaAssets).where(eq(mediaAssets.id, id)).limit(1)
  return Boolean(asset)
}

async function findTestimonial(db: CmsDatabase, id: string) {
  const [row] = await db
    .select({ item: testimonials, avatarUrl: mediaAssets.publicUrl })
    .from(testimonials)
    .leftJoin(mediaAssets, eq(testimonials.avatarMediaId, mediaAssets.id))
    .where(eq(testimonials.id, id))
    .limit(1)
  return row
}

export function registerTestimonialRoutes(app: FastifyInstance, options: { db: CmsDatabase }) {
  const adminGuard = createAuthGuard(options.db, ['admin'])

  app.get('/api/admin/testimonials', { preHandler: adminGuard }, async () => {
    const rows = await options.db
      .select({ item: testimonials, avatarUrl: mediaAssets.publicUrl })
      .from(testimonials)
      .leftJoin(mediaAssets, eq(testimonials.avatarMediaId, mediaAssets.id))
      .orderBy(asc(testimonials.sortOrder), asc(testimonials.authorName))
    return { items: rows.map((row) => serializeTestimonial(row.item, row.avatarUrl)), total: rows.length }
  })

  app.post('/api/admin/testimonials', { preHandler: adminGuard }, async (request, reply) => {
    const input = testimonialInputSchema.safeParse(request.body)
    if (!input.success) return reply.code(400).send({ error: 'INVALID_TESTIMONIAL', details: input.error.flatten().fieldErrors })
    if (!(await avatarExists(options.db, input.data.avatarMediaId))) return reply.code(400).send({ error: 'AVATAR_MEDIA_NOT_FOUND' })

    const user = requireCmsUser(request)
    const [created] = await options.db.insert(testimonials).values({
      authorName: input.data.authorName,
      authorRole: input.data.authorRole,
      company: input.data.company,
      quote: input.data.quote,
      rating: input.data.rating,
      avatarMediaId: input.data.avatarMediaId,
      sortOrder: input.data.sortOrder,
      isEnabled: input.data.isEnabled,
    }).returning()
    if (!created) throw new Error('Testimonial was not created')
    await options.db.insert(auditLogs).values({ userId: user.id, action: 'testimonial.create', entityType: 'testimonial', entityId: created.id, afterData: serializeTestimonial(created) })
    const withAvatar = await findTestimonial(options.db, created.id)
    return reply.code(201).send({ item: serializeTestimonial(created, withAvatar?.avatarUrl ?? null) })
  })

  app.patch('/api/admin/testimonials/:id', { preHandler: adminGuard }, async (request, reply) => {
    const id = contentIdSchema.safeParse((request.params as { id?: unknown }).id)
    const input = testimonialInputSchema.safeParse(request.body)
    if (!id.success || !input.success) return reply.code(400).send({ error: 'INVALID_TESTIMONIAL' })
    const existing = await findTestimonial(options.db, id.data)
    if (!existing) return reply.code(404).send({ error: 'TESTIMONIAL_NOT_FOUND' })
    if (!(await avatarExists(options.db, input.data.avatarMediaId))) return reply.code(400).send({ error: 'AVATAR_MEDIA_NOT_FOUND' })

    const [updated] = await options.db.update(testimonials).set({
      authorName: input.data.authorName,
      authorRole: input.data.authorRole,
      company: input.data.company,
      quote: input.data.quote,
      rating: input.data.rating,
      avatarMediaId: input.data.avatarMediaId,
      sortOrder: input.data.sortOrder,
      isEnabled: input.data.isEnabled,
      updatedAt: new Date(),
    }).where(eq(testimonials.id, id.data)).returning()
    if (!updated) return reply.code(404).send({ error: 'TESTIMONIAL_NOT_FOUND' })
    const user = requireCmsUser(request)
    await options.db.insert(auditLogs).values({ userId: user.id, action: 'testimonial.update', entityType: 'testimonial', entityId: updated.id, beforeData: serializeTestimonial(existing.item), afterData: serializeTestimonial(updated) })
    const withAvatar = await findTestimonial(options.db, updated.id)
    return { item: serializeTestimonial(updated, withAvatar?.avatarUrl ?? null) }
  })

  app.delete('/api/admin/testimonials/:id', { preHandler: adminGuard }, async (request, reply) => {
    const id = contentIdSchema.safeParse((request.params as { id?: unknown }).id)
    if (!id.success) return reply.code(400).send({ error: 'INVALID_TESTIMONIAL_ID' })
    const existing = await findTestimonial(options.db, id.data)
    if (!existing) return reply.code(404).send({ error: 'TESTIMONIAL_NOT_FOUND' })
    await options.db.delete(testimonials).where(eq(testimonials.id, id.data))
    const user = requireCmsUser(request)
    await options.db.insert(auditLogs).values({ userId: user.id, action: 'testimonial.delete', entityType: 'testimonial', entityId: id.data, beforeData: serializeTestimonial(existing.item) })
    return reply.code(204).send()
  })

  app.get('/api/public/testimonials', async () => {
    const rows = await options.db
      .select({ item: testimonials, avatarUrl: mediaAssets.publicUrl })
      .from(testimonials)
      .leftJoin(mediaAssets, eq(testimonials.avatarMediaId, mediaAssets.id))
      .where(eq(testimonials.isEnabled, true))
      .orderBy(asc(testimonials.sortOrder), asc(testimonials.authorName))
    return { items: rows.map((row) => serializeTestimonial(row.item, row.avatarUrl)) }
  })
}
