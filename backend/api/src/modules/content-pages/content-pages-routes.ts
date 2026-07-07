import { contentIdSchema, contentPageInputSchema, contentPageListQuerySchema } from '@iorder/contracts'
import type { CmsDatabase } from '@iorder/database'
import type { FastifyInstance } from 'fastify'

import { createAuthGuard, requireCmsUser } from '../../auth/auth-guard.js'
import { sendError } from '../../shared/errors/index.js'
import { HookManager } from '../../shared/hooks/index.js'
import { registerContentPageHooks } from './content-pages.hooks.js'
import { ContentPagesRepository } from './content-pages.repository.js'
import { ContentPagesService } from './content-pages.service.js'

export function registerContentPageRoutes(
  app: FastifyInstance,
  { db, hooks: injectedHooks }: { db: CmsDatabase; hooks?: HookManager },
) {
  const authGuard = createAuthGuard(db, ['admin', 'editor'])
  const hooks = injectedHooks ?? new HookManager()
  registerContentPageHooks(hooks)
  const repository = new ContentPagesRepository(db)
  const service = new ContentPagesService(repository, hooks)

  // ── Admin: list content pages ─────────────────────────────────────────────
  app.get('/api/admin/content-pages', { preHandler: [authGuard] }, async (request) => {
    requireCmsUser(request)
    const query = contentPageListQuerySchema.parse(request.query)
    return service.list(query)
  })

  // ── Admin: get single ─────────────────────────────────────────────────────
  app.get('/api/admin/content-pages/:id', { preHandler: [authGuard] }, async (request, reply) => {
    requireCmsUser(request)
    const { id } = request.params as { id: string }
    const parsed = contentIdSchema.safeParse(id)
    if (!parsed.success) return reply.code(400).send({ error: 'BAD_ID' })
    try {
      return await service.getById(parsed.data)
    } catch (error) {
      return sendError(reply, error)
    }
  })

  // ── Admin: create ─────────────────────────────────────────────────────────
  app.post('/api/admin/content-pages', { preHandler: [authGuard] }, async (request, reply) => {
    const user = requireCmsUser(request)
    const body = contentPageInputSchema.safeParse(request.body)
    if (!body.success) return reply.code(400).send({ error: 'VALIDATION_ERROR', issues: body.error.issues })

    try {
      const { statusCode, item } = await service.create(body.data, user.id)
      return reply.code(statusCode).send({ item })
    } catch (error) {
      return sendError(reply, error)
    }
  })

  // ── Admin: update ─────────────────────────────────────────────────────────
  app.patch('/api/admin/content-pages/:id', { preHandler: [authGuard] }, async (request, reply) => {
    const user = requireCmsUser(request)
    const { id } = request.params as { id: string }
    const body = contentPageInputSchema.safeParse(request.body)
    if (!body.success) return reply.code(400).send({ error: 'VALIDATION_ERROR', issues: body.error.issues })

    try {
      return await service.update(id, body.data, user.id)
    } catch (error) {
      return sendError(reply, error)
    }
  })

  // ── Admin: publish ────────────────────────────────────────────────────────
  app.post('/api/admin/content-pages/:id/publish', { preHandler: [authGuard] }, async (request, reply) => {
    const user = requireCmsUser(request)
    const { id } = request.params as { id: string }
    try {
      return await service.publish(id, user.id)
    } catch (error) {
      return sendError(reply, error)
    }
  })

  // ── Admin: unpublish ──────────────────────────────────────────────────────
  app.post('/api/admin/content-pages/:id/unpublish', { preHandler: [authGuard] }, async (request, reply) => {
    const user = requireCmsUser(request)
    const { id } = request.params as { id: string }
    try {
      return await service.unpublish(id, user.id)
    } catch (error) {
      return sendError(reply, error)
    }
  })

  // ── Admin: delete (hard delete, full audit log with beforeData) ──────────
  app.delete('/api/admin/content-pages/:id', { preHandler: [authGuard] }, async (request, reply) => {
    const user = requireCmsUser(request)
    const { id } = request.params as { id: string }
    try {
      await service.delete(id, user.id)
      return reply.code(204).send()
    } catch (error) {
      return sendError(reply, error)
    }
  })

  // ── Public: get by slug (slug may contain '/', e.g. 'ho-tro/faq') ────────
  // Wildcard param captures the remainder of the path after /api/public/content-pages/
  app.get('/api/public/content-pages/*', async (request, reply) => {
    const slug = (request.params as { '*': string })['*']
    if (!slug) return reply.code(400).send({ error: 'INVALID_SLUG' })
    try {
      return await service.getPublicBySlug(slug)
    } catch (error) {
      return sendError(reply, error)
    }
  })
}
