import { basename } from 'node:path'
import {
  contentIdSchema,
  mediaListQuerySchema,
  mediaMetadataInputSchema,
} from '@iorder/contracts'
import type { CmsDatabase } from '@iorder/database'
import { auditLogs, mediaAssets, offerings, pageBlocks, partners, posts, siteProfile, testimonials } from '@iorder/database'
import { and, count, desc, eq, ilike, isNull, not } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'

import { createAuthGuard, requireCmsUser } from '../auth/auth-guard.js'
import type { MediaStorage } from './media-storage.js'
import { validateMediaFile } from './media-validation.js'

interface MediaRouteOptions {
  db: CmsDatabase
  storage: MediaStorage
  maxFileSizeBytes: number
}

function serializeMediaAsset(asset: typeof mediaAssets.$inferSelect) {
  return {
    id: asset.id,
    publicUrl: asset.publicUrl,
    originalName: asset.originalName,
    mimeType: asset.mimeType,
    fileSize: asset.fileSize,
    width: asset.width,
    height: asset.height,
    altText: asset.altText,
    caption: asset.caption,
    createdAt: asset.createdAt.toISOString(),
  }
}

export function registerMediaRoutes(app: FastifyInstance, options: MediaRouteOptions) {
  const adminGuard = createAuthGuard(options.db, ['admin'])

  app.get('/api/admin/media', { preHandler: adminGuard }, async (request, reply) => {
    const parsed = mediaListQuerySchema.safeParse(request.query)

    if (!parsed.success) {
      return reply.code(400).send({ error: 'INVALID_QUERY' })
    }

    const filters = []

    if (parsed.data.kind === 'image') {
      filters.push(ilike(mediaAssets.mimeType, 'image/%'))
    } else if (parsed.data.kind === 'document') {
      filters.push(not(ilike(mediaAssets.mimeType, 'image/%')))
    }

    if (parsed.data.search) {
      filters.push(ilike(mediaAssets.originalName, `%${parsed.data.search}%`))
    }

    const where = filters.length > 0 ? and(...filters) : undefined
    const offset = (parsed.data.page - 1) * parsed.data.limit
    const [items, totals] = await Promise.all([
      options.db
        .select()
        .from(mediaAssets)
        .where(where)
        .orderBy(desc(mediaAssets.createdAt))
        .limit(parsed.data.limit)
        .offset(offset),
      options.db.select({ value: count() }).from(mediaAssets).where(where),
    ])

    return {
      items: items.map(serializeMediaAsset),
      total: totals[0]?.value ?? 0,
      page: parsed.data.page,
      limit: parsed.data.limit,
    }
  })

  app.post('/api/admin/media', { preHandler: adminGuard }, async (request, reply) => {
    const user = requireCmsUser(request)
    let upload: { buffer: Buffer; filename: string; mimeType: string } | null = null
    const fields: Record<string, string | null> = {
      altText: null,
      caption: null,
    }

    try {
      for await (const part of request.parts({
        limits: {
          files: 1,
          fields: 2,
          parts: 3,
          fileSize: options.maxFileSizeBytes,
        },
      })) {
        if (part.type === 'file') {
          upload = {
            buffer: await part.toBuffer(),
            filename: basename(part.filename).slice(0, 255),
            mimeType: part.mimetype.toLowerCase(),
          }
        } else if (part.fieldname === 'altText' || part.fieldname === 'caption') {
          fields[part.fieldname] = String(part.value)
        }
      }
    } catch (error) {
      if (error instanceof app.multipartErrors.RequestFileTooLargeError) {
        return reply.code(413).send({ error: 'FILE_TOO_LARGE' })
      }

      throw error
    }

    if (!upload || !upload.filename || upload.buffer.length === 0) {
      return reply.code(400).send({ error: 'FILE_REQUIRED' })
    }

    const metadata = mediaMetadataInputSchema.safeParse({
      altText: fields.altText?.trim() || null,
      caption: fields.caption?.trim() || null,
    })

    if (!metadata.success) {
      return reply.code(400).send({ error: 'INVALID_MEDIA_METADATA' })
    }

    let validated: ReturnType<typeof validateMediaFile>

    try {
      validated = validateMediaFile(upload.filename, upload.mimeType, upload.buffer)
    } catch (error) {
      const code = error instanceof Error ? error.message : 'INVALID_MEDIA'
      return reply.code(415).send({ error: code })
    }

    const stored = await options.storage.put(upload.buffer, validated.extension)

    try {
      const [asset] = await options.db
        .insert(mediaAssets)
        .values({
          uploadedBy: user.id,
          storageKey: stored.storageKey,
          publicUrl: stored.publicUrl,
          originalName: upload.filename,
          mimeType: upload.mimeType,
          fileSize: upload.buffer.length,
          width: validated.width,
          height: validated.height,
          altText: metadata.data.altText,
          caption: metadata.data.caption,
        })
        .returning()

      if (!asset) {
        throw new Error('Media asset was not created')
      }

      await options.db.insert(auditLogs).values({
        userId: user.id,
        action: 'media.upload',
        entityType: 'media_asset',
        entityId: asset.id,
        afterData: serializeMediaAsset(asset),
      })

      return reply.code(201).send({ item: serializeMediaAsset(asset) })
    } catch (error) {
      await options.storage.delete(stored.storageKey)
      throw error
    }
  })

  app.patch('/api/admin/media/:id', { preHandler: adminGuard }, async (request, reply) => {
    const id = contentIdSchema.safeParse((request.params as { id?: unknown }).id)
    const input = mediaMetadataInputSchema.safeParse(request.body)

    if (!id.success || !input.success) {
      return reply.code(400).send({ error: 'INVALID_MEDIA_UPDATE' })
    }

    const [existing] = await options.db
      .select()
      .from(mediaAssets)
      .where(eq(mediaAssets.id, id.data))
      .limit(1)

    if (!existing) {
      return reply.code(404).send({ error: 'MEDIA_NOT_FOUND' })
    }

    const [updated] = await options.db
      .update(mediaAssets)
      .set({
        altText: input.data.altText,
        caption: input.data.caption,
        updatedAt: new Date(),
      })
      .where(eq(mediaAssets.id, id.data))
      .returning()

    if (!updated) {
      return reply.code(404).send({ error: 'MEDIA_NOT_FOUND' })
    }

    const user = requireCmsUser(request)

    await options.db.insert(auditLogs).values({
      userId: user.id,
      action: 'media.update',
      entityType: 'media_asset',
      entityId: updated.id,
      beforeData: serializeMediaAsset(existing),
      afterData: serializeMediaAsset(updated),
    })

    return { item: serializeMediaAsset(updated) }
  })

  app.get('/api/admin/media/:id/usage', { preHandler: adminGuard }, async (request, reply) => {
    const id = contentIdSchema.safeParse((request.params as { id?: unknown }).id)
    if (!id.success) return reply.code(400).send({ error: 'INVALID_MEDIA_ID' })
    const [asset] = await options.db.select({ id: mediaAssets.id }).from(mediaAssets).where(eq(mediaAssets.id, id.data)).limit(1)
    if (!asset) return reply.code(404).send({ error: 'MEDIA_NOT_FOUND' })

    const [blocks, postRows, offeringRows, partnerRows, testimonialRows, profiles] = await Promise.all([
      options.db.select({ id: pageBlocks.id, type: pageBlocks.type, data: pageBlocks.data, appearance: pageBlocks.appearance }).from(pageBlocks),
      options.db.select({ id: posts.id, title: posts.title, coverMediaId: posts.coverMediaId }).from(posts).where(isNull(posts.deletedAt)),
      options.db.select({ id: offerings.id, title: offerings.title, coverMediaId: offerings.coverMediaId }).from(offerings).where(isNull(offerings.deletedAt)),
      options.db.select({ id: partners.id, name: partners.name, logoMediaId: partners.logoMediaId }).from(partners),
      options.db.select({ id: testimonials.id, authorName: testimonials.authorName, avatarMediaId: testimonials.avatarMediaId }).from(testimonials),
      options.db.select({ id: siteProfile.id, companyName: siteProfile.companyName, logoMediaId: siteProfile.logoMediaId }).from(siteProfile),
    ])

    const items: Array<{ entityType: 'homepage_section' | 'post' | 'offering' | 'partner' | 'testimonial' | 'site_profile'; entityId: string; label: string; location: string }> = []
    for (const block of blocks) {
      if (JSON.stringify({ data: block.data, appearance: block.appearance }).includes(id.data)) items.push({ entityType: 'homepage_section', entityId: block.id, label: block.type, location: 'Trang chủ' })
    }
    for (const row of postRows) if (row.coverMediaId === id.data) items.push({ entityType: 'post', entityId: row.id, label: row.title, location: 'Ảnh bìa bài viết' })
    for (const row of offeringRows) if (row.coverMediaId === id.data) items.push({ entityType: 'offering', entityId: row.id, label: row.title, location: 'Ảnh bìa phần mềm/giải pháp' })
    for (const row of partnerRows) if (row.logoMediaId === id.data) items.push({ entityType: 'partner', entityId: row.id, label: row.name, location: 'Logo đối tác' })
    for (const row of testimonialRows) if (row.avatarMediaId === id.data) items.push({ entityType: 'testimonial', entityId: row.id, label: row.authorName, location: 'Ảnh khách hàng' })
    for (const row of profiles) if (row.logoMediaId === id.data) items.push({ entityType: 'site_profile', entityId: row.id, label: row.companyName, location: 'Logo website' })
    return { items, total: items.length, canDelete: items.length === 0 }
  })
}
