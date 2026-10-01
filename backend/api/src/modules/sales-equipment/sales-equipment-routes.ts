import {
  contentIdSchema,
  salesEquipmentCategorySchema,
  salesEquipmentInputSchema,
  salesEquipmentListQuerySchema,
} from '@iorder/contracts'
import type { CmsDatabase } from '@iorder/database'
import type { FastifyInstance } from 'fastify'

import { createAuthGuard, requireCmsUser } from '../../auth/auth-guard.js'
import { sendError } from '../../shared/errors/index.js'
import { HookManager } from '../../shared/hooks/index.js'
import { registerSalesEquipmentHooks } from './sales-equipment.hooks.js'
import { SalesEquipmentRepository } from './sales-equipment.repository.js'
import { SalesEquipmentService } from './sales-equipment.service.js'

export function registerSalesEquipmentRoutes(
  app: FastifyInstance,
  { db, hooks: injectedHooks }: { db: CmsDatabase; hooks?: HookManager },
) {
  const authGuard = createAuthGuard(db, ['admin', 'editor'])
  const hooks = injectedHooks ?? new HookManager()
  registerSalesEquipmentHooks(hooks)
  const service = new SalesEquipmentService(new SalesEquipmentRepository(db), hooks)

  app.get('/api/admin/sales-equipment', { preHandler: [authGuard] }, async (request) => {
    requireCmsUser(request)
    return service.list(salesEquipmentListQuerySchema.parse(request.query))
  })

  app.get('/api/admin/sales-equipment/:id', { preHandler: [authGuard] }, async (request, reply) => {
    requireCmsUser(request)
    const id = contentIdSchema.safeParse((request.params as { id?: unknown }).id)
    if (!id.success) return reply.code(400).send({ error: 'BAD_ID' })
    try {
      return await service.getById(id.data)
    } catch (error) {
      return sendError(reply, error)
    }
  })

  app.post('/api/admin/sales-equipment', { preHandler: [authGuard] }, async (request, reply) => {
    const input = salesEquipmentInputSchema.safeParse(request.body)
    if (!input.success) return reply.code(400).send({ error: 'VALIDATION_ERROR', details: input.error.flatten() })
    try {
      const user = requireCmsUser(request)
      const result = await service.create(input.data, user.id)
      return reply.code(result.statusCode).send({ item: result.item })
    } catch (error) {
      return sendError(reply, error)
    }
  })

  app.patch('/api/admin/sales-equipment/:id', { preHandler: [authGuard] }, async (request, reply) => {
    const id = contentIdSchema.safeParse((request.params as { id?: unknown }).id)
    const input = salesEquipmentInputSchema.safeParse(request.body)
    if (!id.success || !input.success) return reply.code(400).send({ error: 'VALIDATION_ERROR' })
    try {
      return await service.update(id.data, input.data, requireCmsUser(request).id)
    } catch (error) {
      return sendError(reply, error)
    }
  })

  for (const action of ['publish', 'archive', 'unpublish'] as const) {
    app.post(`/api/admin/sales-equipment/:id/${action}`, { preHandler: [authGuard] }, async (request, reply) => {
      const id = contentIdSchema.safeParse((request.params as { id?: unknown }).id)
      if (!id.success) return reply.code(400).send({ error: 'BAD_ID' })
      try {
        return await service[action](id.data, requireCmsUser(request).id)
      } catch (error) {
        return sendError(reply, error)
      }
    })
  }

  app.delete('/api/admin/sales-equipment/:id', { preHandler: [authGuard] }, async (request, reply) => {
    const id = contentIdSchema.safeParse((request.params as { id?: unknown }).id)
    if (!id.success) return reply.code(400).send({ error: 'BAD_ID' })
    try {
      await service.delete(id.data, requireCmsUser(request).id)
      return reply.code(204).send()
    } catch (error) {
      return sendError(reply, error)
    }
  })

  app.get('/api/admin/sales-equipment/:id/revisions', { preHandler: [authGuard] }, async (request, reply) => {
    requireCmsUser(request)
    const id = contentIdSchema.safeParse((request.params as { id?: unknown }).id)
    if (!id.success) return reply.code(400).send({ error: 'BAD_ID' })
    try {
      return await service.listRevisions(id.data)
    } catch (error) {
      return sendError(reply, error)
    }
  })

  app.post(
    '/api/admin/sales-equipment/:id/revisions/:version/restore',
    { preHandler: [authGuard] },
    async (request, reply) => {
      const id = contentIdSchema.safeParse((request.params as { id?: unknown }).id)
      const version = Number((request.params as { version?: unknown }).version)
      if (!id.success || !Number.isInteger(version) || version < 1)
        return reply.code(400).send({ error: 'BAD_REVISION' })
      try {
        return await service.restore(id.data, version, requireCmsUser(request).id)
      } catch (error) {
        return sendError(reply, error)
      }
    },
  )

  app.get('/api/public/sales-equipment', async (request, reply) => {
    const category = salesEquipmentCategorySchema
      .optional()
      .safeParse((request.query as { category?: unknown }).category)
    if (!category.success) return reply.code(400).send({ error: 'BAD_CATEGORY' })
    return service.listPublic(category.data)
  })
}
