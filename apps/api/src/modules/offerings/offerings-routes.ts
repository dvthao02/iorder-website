import {
  contentIdSchema,
  offeringInputSchema,
  offeringListQuerySchema,
  offeringTypeSchema,
  slugSchema,
} from '@iorder/contracts'
import type { CmsDatabase } from '@iorder/database'
import type { FastifyInstance } from 'fastify'

import { createAuthGuard, requireCmsUser } from '../../auth/auth-guard.js'
import { sendError } from '../../shared/errors/index.js'
import { HookManager } from '../../shared/hooks/index.js'
import { registerOfferingHooks } from './offerings.hooks.js'
import { OfferingsRepository } from './offerings.repository.js'
import { OfferingsService } from './offerings.service.js'

export function registerOfferingRoutes(
  app: FastifyInstance,
  { db, hooks: injectedHooks }: { db: CmsDatabase; hooks?: HookManager },
) {
  const authGuard = createAuthGuard(db, ['admin', 'editor'])
  const hooks = injectedHooks ?? new HookManager()
  registerOfferingHooks(hooks)
  const repository = new OfferingsRepository(db)
  const service = new OfferingsService(repository, hooks)

  // ── Admin: list offerings ─────────────────────────────────────────────────
  app.get('/api/admin/offerings', { preHandler: [authGuard] }, async (request) => {
    requireCmsUser(request)
    const query = offeringListQuerySchema.parse(request.query)
    return service.list(query)
  })

  // ── Admin: get single ─────────────────────────────────────────────────────
  app.get('/api/admin/offerings/:id', { preHandler: [authGuard] }, async (request, reply) => {
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
  app.post('/api/admin/offerings', { preHandler: [authGuard] }, async (request, reply) => {
    const user = requireCmsUser(request)
    const body = offeringInputSchema.safeParse(request.body)
    if (!body.success) return reply.code(400).send({ error: 'VALIDATION_ERROR', issues: body.error.issues })

    try {
      const { statusCode, item } = await service.create(body.data, user.id)
      return reply.code(statusCode).send({ item })
    } catch (error) {
      return sendError(reply, error)
    }
  })

  // ── Admin: update ─────────────────────────────────────────────────────────
  app.patch('/api/admin/offerings/:id', { preHandler: [authGuard] }, async (request, reply) => {
    const user = requireCmsUser(request)
    const { id } = request.params as { id: string }
    const body = offeringInputSchema.safeParse(request.body)
    if (!body.success) return reply.code(400).send({ error: 'VALIDATION_ERROR', issues: body.error.issues })

    try {
      return await service.update(id, body.data, user.id)
    } catch (error) {
      return sendError(reply, error)
    }
  })

  // ── Admin: publish ────────────────────────────────────────────────────────
  app.post('/api/admin/offerings/:id/publish', { preHandler: [authGuard] }, async (request, reply) => {
    const user = requireCmsUser(request)
    const { id } = request.params as { id: string }
    try {
      return await service.publish(id, user.id)
    } catch (error) {
      return sendError(reply, error)
    }
  })

  // ── Admin: archive ────────────────────────────────────────────────────────
  app.post('/api/admin/offerings/:id/archive', { preHandler: [authGuard] }, async (request, reply) => {
    const user = requireCmsUser(request)
    const { id } = request.params as { id: string }
    try {
      return await service.archive(id, user.id)
    } catch (error) {
      return sendError(reply, error)
    }
  })

  // ── Admin: unpublish ──────────────────────────────────────────────────────
  app.post('/api/admin/offerings/:id/unpublish', { preHandler: [authGuard] }, async (request, reply) => {
    const user = requireCmsUser(request)
    const { id } = request.params as { id: string }
    try {
      return await service.unpublish(id, user.id)
    } catch (error) {
      return sendError(reply, error)
    }
  })

  // ── Admin: delete ─────────────────────────────────────────────────────────
  app.delete('/api/admin/offerings/:id', { preHandler: [authGuard] }, async (request, reply) => {
    const user = requireCmsUser(request)
    const { id } = request.params as { id: string }
    try {
      await service.delete(id, user.id)
      return reply.code(204).send()
    } catch (error) {
      return sendError(reply, error)
    }
  })

  // ── Public: list by type ──────────────────────────────────────────────────
  app.get('/api/public/offerings', async (request) => {
    const query = offeringTypeSchema.optional().safeParse((request.query as { type?: string }).type)
    return service.listPublic(query.success ? query.data : undefined)
  })

  // ── Public: get by type + slug ────────────────────────────────────────────
  app.get('/api/public/offerings/:type/:slug', async (request, reply) => {
    const { type, slug } = request.params as { type: string; slug: string }
    const typeResult = offeringTypeSchema.safeParse(type)
    const slugResult = slugSchema.safeParse(slug)
    if (!typeResult.success || !slugResult.success) return reply.code(400).send({ error: 'BAD_PARAMS' })

    try {
      return await service.getPublicByTypeAndSlug(typeResult.data, slugResult.data)
    } catch (error) {
      return sendError(reply, error)
    }
  })
}
