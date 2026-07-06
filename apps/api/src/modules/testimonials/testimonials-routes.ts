import { contentIdSchema, testimonialInputSchema } from '@iorder/contracts'
import type { CmsDatabase } from '@iorder/database'
import type { FastifyInstance } from 'fastify'

import { createAuthGuard, requireCmsUser } from '../../auth/auth-guard.js'
import { sendError } from '../../shared/errors/index.js'
import { TestimonialsRepository } from './testimonials.repository.js'
import { TestimonialsService } from './testimonials.service.js'

export function registerTestimonialRoutes(app: FastifyInstance, options: { db: CmsDatabase }) {
  const adminGuard = createAuthGuard(options.db, ['admin', 'editor'])
  const repository = new TestimonialsRepository(options.db)
  const service = new TestimonialsService(repository)

  app.get('/api/admin/testimonials', { preHandler: adminGuard }, async () => service.list())

  app.post('/api/admin/testimonials', { preHandler: adminGuard }, async (request, reply) => {
    const input = testimonialInputSchema.safeParse(request.body)
    if (!input.success)
      return reply.code(400).send({ error: 'INVALID_TESTIMONIAL', details: input.error.flatten().fieldErrors })

    const user = requireCmsUser(request)
    try {
      const { statusCode, item } = await service.create(input.data, user.id)
      return reply.code(statusCode).send({ item })
    } catch (error) {
      return sendError(reply, error)
    }
  })

  app.patch('/api/admin/testimonials/:id', { preHandler: adminGuard }, async (request, reply) => {
    const id = contentIdSchema.safeParse((request.params as { id?: unknown }).id)
    const input = testimonialInputSchema.safeParse(request.body)
    if (!id.success || !input.success) return reply.code(400).send({ error: 'INVALID_TESTIMONIAL' })

    const user = requireCmsUser(request)
    try {
      return await service.update(id.data, input.data, user.id)
    } catch (error) {
      return sendError(reply, error)
    }
  })

  app.delete('/api/admin/testimonials/:id', { preHandler: adminGuard }, async (request, reply) => {
    const id = contentIdSchema.safeParse((request.params as { id?: unknown }).id)
    if (!id.success) return reply.code(400).send({ error: 'INVALID_TESTIMONIAL_ID' })

    const user = requireCmsUser(request)
    try {
      await service.delete(id.data, user.id)
      return reply.code(204).send()
    } catch (error) {
      return sendError(reply, error)
    }
  })

  app.get('/api/public/testimonials', async () => service.listPublic())
}
