import { contentIdSchema, downloadInputSchema } from '@iorder/contracts'
import type { CmsDatabase } from '@iorder/database'
import type { FastifyInstance } from 'fastify'

import { createAuthGuard, requireCmsUser } from '../../auth/auth-guard.js'
import { sendError } from '../../shared/errors/index.js'
import { DownloadsRepository } from './downloads.repository.js'
import { DownloadsService } from './downloads.service.js'

export function registerDownloadRoutes(app: FastifyInstance, options: { db: CmsDatabase }) {
  const adminGuard = createAuthGuard(options.db, ['admin', 'editor'])
  const repository = new DownloadsRepository(options.db)
  const service = new DownloadsService(repository)

  // ── Admin: list all ──────────────────────────────────────────────────────
  app.get('/api/admin/downloads', { preHandler: adminGuard }, async () => service.list())

  // ── Admin: create ────────────────────────────────────────────────────────
  app.post('/api/admin/downloads', { preHandler: adminGuard }, async (request, reply) => {
    const input = downloadInputSchema.safeParse(request.body)
    if (!input.success)
      return reply.code(400).send({ error: 'INVALID_DOWNLOAD', details: input.error.flatten().fieldErrors })

    const user = requireCmsUser(request)
    try {
      const { statusCode, item } = await service.create(input.data, user.id)
      return reply.code(statusCode).send({ item })
    } catch (error) {
      return sendError(reply, error)
    }
  })

  // ── Admin: update ────────────────────────────────────────────────────────
  app.patch('/api/admin/downloads/:id', { preHandler: adminGuard }, async (request, reply) => {
    const id = contentIdSchema.safeParse((request.params as { id?: unknown }).id)
    const input = downloadInputSchema.safeParse(request.body)
    if (!id.success || !input.success) return reply.code(400).send({ error: 'INVALID_DOWNLOAD' })

    const user = requireCmsUser(request)
    try {
      return await service.update(id.data, input.data, user.id)
    } catch (error) {
      return sendError(reply, error)
    }
  })

  // ── Admin: delete ────────────────────────────────────────────────────────
  app.delete('/api/admin/downloads/:id', { preHandler: adminGuard }, async (request, reply) => {
    const id = contentIdSchema.safeParse((request.params as { id?: unknown }).id)
    if (!id.success) return reply.code(400).send({ error: 'INVALID_DOWNLOAD_ID' })

    const user = requireCmsUser(request)
    try {
      await service.delete(id.data, user.id)
      return reply.code(204).send()
    } catch (error) {
      return sendError(reply, error)
    }
  })

  // ── Public: enabled downloads only ───────────────────────────────────────
  app.get('/api/public/downloads', async () => service.listPublic())
}
