import { categoryInputSchema, contentIdSchema } from '@iorder/contracts'
import type { CmsDatabase } from '@iorder/database'
import type { FastifyInstance } from 'fastify'

import { createAuthGuard, requireCmsUser } from '../../auth/auth-guard.js'
import { sendError } from '../../shared/errors/index.js'
import { CategoriesRepository } from './categories.repository.js'
import { CategoriesService } from './categories.service.js'

export function registerCategoryRoutes(app: FastifyInstance, options: { db: CmsDatabase }) {
  const adminGuard = createAuthGuard(options.db, ['admin', 'editor'])
  const repository = new CategoriesRepository(options.db)
  const service = new CategoriesService(repository)

  // ── Admin: list (kèm số bài) ───────────────────────────────────────────────
  app.get('/api/admin/categories', { preHandler: adminGuard }, async () => service.list())

  // ── Admin: create ──────────────────────────────────────────────────────────
  app.post('/api/admin/categories', { preHandler: adminGuard }, async (request, reply) => {
    const input = categoryInputSchema.safeParse(request.body)
    if (!input.success)
      return reply.code(400).send({ error: 'INVALID_CATEGORY', details: input.error.flatten().fieldErrors })

    const user = requireCmsUser(request)
    const { statusCode, item } = await service.create(input.data, user.id)
    return reply.code(statusCode).send({ item })
  })

  // ── Admin: update ──────────────────────────────────────────────────────────
  app.patch('/api/admin/categories/:id', { preHandler: adminGuard }, async (request, reply) => {
    const id = contentIdSchema.safeParse((request.params as { id?: unknown }).id)
    const input = categoryInputSchema.safeParse(request.body)
    if (!id.success || !input.success) return reply.code(400).send({ error: 'INVALID_CATEGORY' })

    const user = requireCmsUser(request)
    try {
      return await service.update(id.data, input.data, user.id)
    } catch (error) {
      return sendError(reply, error)
    }
  })

  // ── Admin: delete (gỡ liên kết bài nhờ cascade FK) ─────────────────────────
  app.delete('/api/admin/categories/:id', { preHandler: adminGuard }, async (request, reply) => {
    const id = contentIdSchema.safeParse((request.params as { id?: unknown }).id)
    if (!id.success) return reply.code(400).send({ error: 'INVALID_CATEGORY_ID' })

    const user = requireCmsUser(request)
    try {
      await service.delete(id.data, user.id)
      return reply.code(204).send()
    } catch (error) {
      return sendError(reply, error)
    }
  })

  // ── Public: chuyên mục có bài đã đăng ──────────────────────────────────────
  app.get('/api/public/categories', async () => service.listPublic())
}
