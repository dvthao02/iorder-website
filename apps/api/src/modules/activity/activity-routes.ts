import { activityListQuerySchema } from '@iorder/contracts'
import type { CmsDatabase } from '@iorder/database'
import type { FastifyInstance } from 'fastify'

import { createAuthGuard } from '../../auth/auth-guard.js'
import { sendError } from '../../shared/errors/index.js'
import { ActivityRepository } from './activity.repository.js'
import { ActivityService } from './activity.service.js'

export function registerActivityRoutes(app: FastifyInstance, options: { db: CmsDatabase }) {
  const adminGuard = createAuthGuard(options.db, ['admin'])
  const repository = new ActivityRepository(options.db)
  const service = new ActivityService(repository)

  app.get('/api/admin/activity', { preHandler: adminGuard }, async (request, reply) => {
    const input = activityListQuerySchema.safeParse(request.query)
    if (!input.success)
      return reply.code(400).send({ error: 'INVALID_ACTIVITY_QUERY', details: input.error.flatten().fieldErrors })

    try {
      return await service.list(input.data)
    } catch (error) {
      return sendError(reply, error)
    }
  })
}
