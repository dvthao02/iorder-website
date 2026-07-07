import { contentIdSchema, postInputSchema, postListQuerySchema } from '@iorder/contracts'
import type { CmsDatabase } from '@iorder/database'
import type { FastifyInstance } from 'fastify'

import { createAuthGuard, requireCmsUser } from '../../auth/auth-guard.js'
import { sendError } from '../../shared/errors/index.js'
import { HookManager } from '../../shared/hooks/index.js'
import { registerPostHooks } from './posts.hooks.js'
import { PostsRepository } from './posts.repository.js'
import { PostsService } from './posts.service.js'

export function registerPostRoutes(app: FastifyInstance, options: { db: CmsDatabase; hooks?: HookManager }) {
  const adminGuard = createAuthGuard(options.db, ['admin', 'editor'])
  const hooks = options.hooks ?? new HookManager()
  registerPostHooks(hooks)
  const repository = new PostsRepository(options.db)
  const service = new PostsService(repository, hooks)
  // Trả về service để app.ts có thể khởi động scheduler tự động publish bài hẹn giờ.

  app.get('/api/admin/posts', { preHandler: adminGuard }, async (request, reply) => {
    const parsed = postListQuerySchema.safeParse(request.query)
    if (!parsed.success) return reply.code(400).send({ error: 'INVALID_QUERY' })
    return service.list(parsed.data)
  })

  app.get('/api/admin/posts/:id', { preHandler: adminGuard }, async (request, reply) => {
    const id = contentIdSchema.safeParse((request.params as { id?: unknown }).id)
    if (!id.success) return reply.code(400).send({ error: 'INVALID_POST_ID' })
    try {
      return await service.getById(id.data)
    } catch (error) {
      return sendError(reply, error)
    }
  })

  app.post('/api/admin/posts', { preHandler: adminGuard }, async (request, reply) => {
    const input = postInputSchema.safeParse(request.body)
    if (!input.success)
      return reply.code(400).send({ error: 'INVALID_POST', details: input.error.flatten().fieldErrors })
    const user = requireCmsUser(request)
    try {
      const { statusCode, item } = await service.create(input.data, user.id)
      return reply.code(statusCode).send({ item })
    } catch (error) {
      return sendError(reply, error)
    }
  })

  app.patch('/api/admin/posts/:id', { preHandler: adminGuard }, async (request, reply) => {
    const id = contentIdSchema.safeParse((request.params as { id?: unknown }).id)
    const input = postInputSchema.safeParse(request.body)
    if (!id.success || !input.success) return reply.code(400).send({ error: 'INVALID_POST' })
    const user = requireCmsUser(request)
    try {
      return await service.update(id.data, input.data, user.id)
    } catch (error) {
      return sendError(reply, error)
    }
  })

  app.post('/api/admin/posts/:id/publish', { preHandler: adminGuard }, async (request, reply) => {
    const id = contentIdSchema.safeParse((request.params as { id?: unknown }).id)
    if (!id.success) return reply.code(400).send({ error: 'INVALID_POST_ID' })
    const user = requireCmsUser(request)
    try {
      return await service.publish(id.data, user.id)
    } catch (error) {
      return sendError(reply, error)
    }
  })

  app.post('/api/admin/posts/:id/archive', { preHandler: adminGuard }, async (request, reply) => {
    const id = contentIdSchema.safeParse((request.params as { id?: unknown }).id)
    if (!id.success) return reply.code(400).send({ error: 'INVALID_POST_ID' })
    const user = requireCmsUser(request)
    try {
      return await service.archive(id.data, user.id)
    } catch (error) {
      return sendError(reply, error)
    }
  })

  app.post('/api/admin/posts/:id/unpublish', { preHandler: adminGuard }, async (request, reply) => {
    const id = contentIdSchema.safeParse((request.params as { id?: unknown }).id)
    if (!id.success) return reply.code(400).send({ error: 'INVALID_POST_ID' })
    const user = requireCmsUser(request)
    try {
      return await service.unpublish(id.data, user.id)
    } catch (error) {
      return sendError(reply, error)
    }
  })

  app.get('/api/admin/posts/:id/revisions', { preHandler: adminGuard }, async (request, reply) => {
    const id = contentIdSchema.safeParse((request.params as { id?: unknown }).id)
    if (!id.success) return reply.code(400).send({ error: 'INVALID_POST_ID' })
    try {
      return await service.listRevisions(id.data)
    } catch (error) {
      return sendError(reply, error)
    }
  })

  app.get('/api/admin/posts/:id/revisions/:version', { preHandler: adminGuard }, async (request, reply) => {
    const id = contentIdSchema.safeParse((request.params as { id?: unknown }).id)
    const version = Number((request.params as { version: string }).version)
    if (!id.success || !Number.isInteger(version) || version < 1)
      return reply.code(400).send({ error: 'INVALID_REVISION' })
    try {
      return await service.getRevision(id.data, version)
    } catch (error) {
      return sendError(reply, error)
    }
  })

  app.post('/api/admin/posts/:id/revisions/:version/restore', { preHandler: adminGuard }, async (request, reply) => {
    const id = contentIdSchema.safeParse((request.params as { id?: unknown }).id)
    const version = Number((request.params as { version: string }).version)
    if (!id.success || !Number.isInteger(version) || version < 1)
      return reply.code(400).send({ error: 'INVALID_REVISION' })
    const user = requireCmsUser(request)
    try {
      return await service.restoreRevision(id.data, version, user.id)
    } catch (error) {
      return sendError(reply, error)
    }
  })

  app.delete('/api/admin/posts/:id', { preHandler: adminGuard }, async (request, reply) => {
    const id = contentIdSchema.safeParse((request.params as { id?: unknown }).id)
    if (!id.success) return reply.code(400).send({ error: 'INVALID_POST_ID' })
    const user = requireCmsUser(request)
    try {
      await service.delete(id.data, user.id)
      return reply.code(204).send()
    } catch (error) {
      return sendError(reply, error)
    }
  })

  app.get('/api/public/posts', async (request, reply) => {
    const parsed = postListQuerySchema.omit({ status: true, search: true }).safeParse(request.query)
    if (!parsed.success) return reply.code(400).send({ error: 'INVALID_QUERY' })
    return service.listPublic(parsed.data)
  })

  app.get('/api/public/posts/:slug', async (request, reply) => {
    const slug = String((request.params as { slug?: unknown }).slug ?? '')
    try {
      return await service.getPublicBySlug(slug, {
        ip: request.ip,
        userAgent: String(request.headers['user-agent'] ?? ''),
      })
    } catch (error) {
      return sendError(reply, error)
    }
  })

  return { service }
}
