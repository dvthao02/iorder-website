import { basename } from 'node:path'
import { contentIdSchema, mediaListQuerySchema, mediaMetadataInputSchema } from '@iorder/contracts'
import type { CmsDatabase } from '@iorder/database'
import type { FastifyInstance } from 'fastify'

import { createAuthGuard, requireCmsUser } from '../../auth/auth-guard.js'
import type { MediaStorage } from '../../media/media-storage.js'
import { sendError } from '../../shared/errors/index.js'
import { HookManager } from '../../shared/hooks/index.js'
import { FileTooLargeError } from './media.errors.js'
import { registerMediaHooks } from './media.hooks.js'
import { MediaRepository } from './media.repository.js'
import { MediaService, type RawUpload } from './media.service.js'

interface MediaRouteOptions {
  db: CmsDatabase
  storage: MediaStorage
  maxFileSizeBytes: number
  hooks?: HookManager
}

export function registerMediaRoutes(app: FastifyInstance, options: MediaRouteOptions) {
  const adminGuard = createAuthGuard(options.db, ['admin', 'editor'])
  const hooks = options.hooks ?? new HookManager()
  registerMediaHooks(hooks)
  const repository = new MediaRepository(options.db)
  const service = new MediaService(repository, options.storage, hooks)

  app.get('/api/admin/media', { preHandler: adminGuard }, async (request, reply) => {
    const parsed = mediaListQuerySchema.safeParse(request.query)
    if (!parsed.success) return reply.code(400).send({ error: 'INVALID_QUERY' })
    return service.list(parsed.data)
  })

  app.post('/api/admin/media', { preHandler: adminGuard }, async (request, reply) => {
    const user = requireCmsUser(request)
    let upload: RawUpload | null = null
    const fields: Record<string, string | null> = { altText: null, caption: null }

    try {
      for await (const part of request.parts({
        limits: { files: 1, fields: 2, parts: 3, fileSize: options.maxFileSizeBytes },
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
        return sendError(reply, new FileTooLargeError())
      }
      throw error
    }

    const metadata = mediaMetadataInputSchema.safeParse({
      altText: fields.altText?.trim() || null,
      caption: fields.caption?.trim() || null,
    })
    if (!metadata.success) return reply.code(400).send({ error: 'INVALID_MEDIA_METADATA' })

    try {
      const { statusCode, item } = await service.upload(upload, metadata.data, user.id)
      return reply.code(statusCode).send({ item })
    } catch (error) {
      return sendError(reply, error)
    }
  })

  app.patch('/api/admin/media/:id', { preHandler: adminGuard }, async (request, reply) => {
    const id = contentIdSchema.safeParse((request.params as { id?: unknown }).id)
    const input = mediaMetadataInputSchema.safeParse(request.body)
    if (!id.success || !input.success) return reply.code(400).send({ error: 'INVALID_MEDIA_UPDATE' })

    const user = requireCmsUser(request)
    try {
      return await service.update(id.data, input.data, user.id)
    } catch (error) {
      return sendError(reply, error)
    }
  })

  app.get('/api/admin/media/:id/usage', { preHandler: adminGuard }, async (request, reply) => {
    const id = contentIdSchema.safeParse((request.params as { id?: unknown }).id)
    if (!id.success) return reply.code(400).send({ error: 'INVALID_MEDIA_ID' })
    try {
      return await service.getUsage(id.data)
    } catch (error) {
      return sendError(reply, error)
    }
  })

  app.delete('/api/admin/media/:id', { preHandler: adminGuard }, async (request, reply) => {
    const id = contentIdSchema.safeParse((request.params as { id?: unknown }).id)
    if (!id.success) return reply.code(400).send({ error: 'INVALID_MEDIA_ID' })

    const user = requireCmsUser(request)
    try {
      await service.delete(id.data, user.id)
      return reply.code(204).send()
    } catch (error) {
      return sendError(reply, error)
    }
  })
}
