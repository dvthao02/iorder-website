import { contentIdSchema, partnerInputSchema } from '@iorder/contracts'
import type { CmsDatabase } from '@iorder/database'
import { auditLogs, mediaAssets, partners } from '@iorder/database'
import { asc, eq } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'

import { createAuthGuard, requireCmsUser } from '../auth/auth-guard.js'

type PartnerRecord = typeof partners.$inferSelect

function serializePartner(partner: PartnerRecord, logoUrl: string | null = null) {
  return {
    id: partner.id,
    name: partner.name,
    description: partner.description,
    websiteUrl: partner.websiteUrl,
    logoMediaId: partner.logoMediaId,
    logoUrl,
    sortOrder: partner.sortOrder,
    isEnabled: partner.isEnabled,
    createdAt: partner.createdAt.toISOString(),
    updatedAt: partner.updatedAt.toISOString(),
  }
}

async function logoExists(db: CmsDatabase, id: string | null) {
  if (!id) return true
  const [asset] = await db.select({ id: mediaAssets.id }).from(mediaAssets).where(eq(mediaAssets.id, id)).limit(1)
  return Boolean(asset)
}

async function findPartner(db: CmsDatabase, id: string) {
  const [row] = await db
    .select({ partner: partners, logoUrl: mediaAssets.publicUrl })
    .from(partners)
    .leftJoin(mediaAssets, eq(partners.logoMediaId, mediaAssets.id))
    .where(eq(partners.id, id))
    .limit(1)
  return row
}

export function registerPartnerRoutes(app: FastifyInstance, options: { db: CmsDatabase }) {
  const adminGuard = createAuthGuard(options.db, ['admin'])

  // ── Admin: list all ──────────────────────────────────────────────────────
  app.get('/api/admin/partners', { preHandler: adminGuard }, async () => {
    const rows = await options.db
      .select({ partner: partners, logoUrl: mediaAssets.publicUrl })
      .from(partners)
      .leftJoin(mediaAssets, eq(partners.logoMediaId, mediaAssets.id))
      .orderBy(asc(partners.sortOrder), asc(partners.name))
    return { items: rows.map((row) => serializePartner(row.partner, row.logoUrl)), total: rows.length }
  })

  // ── Admin: create ────────────────────────────────────────────────────────
  app.post('/api/admin/partners', { preHandler: adminGuard }, async (request, reply) => {
    const input = partnerInputSchema.safeParse(request.body)
    if (!input.success) return reply.code(400).send({ error: 'INVALID_PARTNER', details: input.error.flatten().fieldErrors })
    if (!(await logoExists(options.db, input.data.logoMediaId))) return reply.code(400).send({ error: 'LOGO_MEDIA_NOT_FOUND' })

    const user = requireCmsUser(request)
    try {
      const [created] = await options.db.insert(partners).values({
        name: input.data.name,
        description: input.data.description,
        websiteUrl: input.data.websiteUrl,
        logoMediaId: input.data.logoMediaId,
        sortOrder: input.data.sortOrder,
        isEnabled: input.data.isEnabled,
      }).returning()
      if (!created) throw new Error('Partner was not created')
      await options.db.insert(auditLogs).values({ userId: user.id, action: 'partner.create', entityType: 'partner', entityId: created.id, afterData: serializePartner(created) })
      const withLogo = await findPartner(options.db, created.id)
      return reply.code(201).send({ item: serializePartner(created, withLogo?.logoUrl ?? null) })
    } catch (error) {
      if (error instanceof Error && error.message.includes('partners_name_unique')) return reply.code(409).send({ error: 'NAME_EXISTS' })
      throw error
    }
  })

  // ── Admin: update ────────────────────────────────────────────────────────
  app.patch('/api/admin/partners/:id', { preHandler: adminGuard }, async (request, reply) => {
    const id = contentIdSchema.safeParse((request.params as { id?: unknown }).id)
    const input = partnerInputSchema.safeParse(request.body)
    if (!id.success || !input.success) return reply.code(400).send({ error: 'INVALID_PARTNER' })
    const existing = await findPartner(options.db, id.data)
    if (!existing) return reply.code(404).send({ error: 'PARTNER_NOT_FOUND' })
    if (!(await logoExists(options.db, input.data.logoMediaId))) return reply.code(400).send({ error: 'LOGO_MEDIA_NOT_FOUND' })

    try {
      const [updated] = await options.db.update(partners).set({
        name: input.data.name,
        description: input.data.description,
        websiteUrl: input.data.websiteUrl,
        logoMediaId: input.data.logoMediaId,
        sortOrder: input.data.sortOrder,
        isEnabled: input.data.isEnabled,
        updatedAt: new Date(),
      }).where(eq(partners.id, id.data)).returning()
      if (!updated) return reply.code(404).send({ error: 'PARTNER_NOT_FOUND' })
      const user = requireCmsUser(request)
      await options.db.insert(auditLogs).values({ userId: user.id, action: 'partner.update', entityType: 'partner', entityId: updated.id, beforeData: serializePartner(existing.partner), afterData: serializePartner(updated) })
      const withLogo = await findPartner(options.db, updated.id)
      return { item: serializePartner(updated, withLogo?.logoUrl ?? null) }
    } catch (error) {
      if (error instanceof Error && error.message.includes('partners_name_unique')) return reply.code(409).send({ error: 'NAME_EXISTS' })
      throw error
    }
  })

  // ── Admin: delete ────────────────────────────────────────────────────────
  app.delete('/api/admin/partners/:id', { preHandler: adminGuard }, async (request, reply) => {
    const id = contentIdSchema.safeParse((request.params as { id?: unknown }).id)
    if (!id.success) return reply.code(400).send({ error: 'INVALID_PARTNER_ID' })
    const existing = await findPartner(options.db, id.data)
    if (!existing) return reply.code(404).send({ error: 'PARTNER_NOT_FOUND' })
    await options.db.delete(partners).where(eq(partners.id, id.data))
    const user = requireCmsUser(request)
    await options.db.insert(auditLogs).values({ userId: user.id, action: 'partner.delete', entityType: 'partner', entityId: id.data, beforeData: serializePartner(existing.partner) })
    return reply.code(204).send()
  })

  // ── Public: enabled partners only ────────────────────────────────────────
  app.get('/api/public/partners', async () => {
    const rows = await options.db
      .select({ partner: partners, logoUrl: mediaAssets.publicUrl })
      .from(partners)
      .leftJoin(mediaAssets, eq(partners.logoMediaId, mediaAssets.id))
      .where(eq(partners.isEnabled, true))
      .orderBy(asc(partners.sortOrder), asc(partners.name))
    return { items: rows.map((row) => serializePartner(row.partner, row.logoUrl)) }
  })
}
