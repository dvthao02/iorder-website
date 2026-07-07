import { createHash } from 'node:crypto'
import {
  contactLeadInputSchema,
  contentIdSchema,
  leadListQuerySchema,
  updateLeadStatusInputSchema,
} from '@iorder/contracts'
import type { CmsDatabase } from '@iorder/database'
import type { FastifyInstance } from 'fastify'

import { createAuthGuard, requireCmsUser } from '../../auth/auth-guard.js'
import { sendError } from '../../shared/errors/index.js'
import { LeadsRepository } from './leads.repository.js'
import { LeadsService } from './leads.service.js'

function hashIp(ip: string, secret: string): string {
  return createHash('sha256').update(`${ip}${secret}`).digest('hex')
}

export function registerLeadRoutes(app: FastifyInstance, options: { db: CmsDatabase; sessionSecret: string }) {
  const adminGuard = createAuthGuard(options.db, ['admin', 'editor'])
  const repository = new LeadsRepository(options.db)
  const service = new LeadsService(repository)

  app.post('/api/public/contact', async (request, reply) => {
    const input = contactLeadInputSchema.safeParse(request.body)
    if (!input.success)
      return reply.code(400).send({ error: 'INVALID_CONTACT_LEAD', details: input.error.flatten().fieldErrors })

    const ip = request.ip
    const ipHash = ip ? hashIp(ip, options.sessionSecret) : null

    try {
      const result = await service.createFromPublicForm(input.data, { ip, ipHash })
      return reply.code(200).send({ success: true, skipped: result.skipped })
    } catch (error) {
      return sendError(reply, error)
    }
  })

  app.get('/api/admin/leads', { preHandler: adminGuard }, async (request, reply) => {
    const query = leadListQuerySchema.safeParse(request.query)
    if (!query.success) return reply.code(400).send({ error: 'INVALID_LEAD_QUERY' })

    try {
      const result = await service.list(query.data)
      return reply.send(result)
    } catch (error) {
      return sendError(reply, error)
    }
  })

  app.patch('/api/admin/leads/:id/status', { preHandler: adminGuard }, async (request, reply) => {
    const id = contentIdSchema.safeParse((request.params as { id?: unknown }).id)
    const input = updateLeadStatusInputSchema.safeParse(request.body)
    if (!id.success || !input.success) return reply.code(400).send({ error: 'INVALID_LEAD_STATUS' })

    const user = requireCmsUser(request)
    try {
      const result = await service.updateStatus(id.data, input.data.status, user.id)
      return reply.send(result)
    } catch (error) {
      return sendError(reply, error)
    }
  })
}
