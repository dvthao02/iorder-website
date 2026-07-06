import {
  changePasswordInputSchema,
  contentIdSchema,
  createUserInputSchema,
  resetPasswordInputSchema,
  updateUserInputSchema,
} from '@iorder/contracts'
import type { CmsDatabase } from '@iorder/database'
import type { FastifyInstance } from 'fastify'

import { createAuthGuard, readSessionToken, requireCmsUser } from '../../auth/auth-guard.js'
import { findSessionIdByToken } from '../../auth/session-service.js'
import { sendError } from '../../shared/errors/index.js'
import { UsersRepository } from './users.repository.js'
import { UsersService } from './users.service.js'

export function registerUserRoutes(app: FastifyInstance, options: { db: CmsDatabase }) {
  const adminGuard = createAuthGuard(options.db, ['admin'])
  const selfGuard = createAuthGuard(options.db, ['admin', 'editor'])
  const repository = new UsersRepository(options.db)
  const service = new UsersService(repository)

  // ── Admin: list all users ────────────────────────────────────────────────
  app.get('/api/admin/users', { preHandler: adminGuard }, async () => service.listUsers())

  // ── Admin: create user ───────────────────────────────────────────────────
  app.post('/api/admin/users', { preHandler: adminGuard }, async (request, reply) => {
    const input = createUserInputSchema.safeParse(request.body)
    if (!input.success)
      return reply.code(400).send({ error: 'INVALID_USER', details: input.error.flatten().fieldErrors })

    const user = requireCmsUser(request)
    try {
      const { statusCode, item } = await service.createUser(input.data, user.id)
      return reply.code(statusCode).send({ item })
    } catch (error) {
      return sendError(reply, error)
    }
  })

  // ── Admin: update user ───────────────────────────────────────────────────
  app.patch('/api/admin/users/:id', { preHandler: adminGuard }, async (request, reply) => {
    const id = contentIdSchema.safeParse((request.params as { id?: unknown }).id)
    const input = updateUserInputSchema.safeParse(request.body)
    if (!id.success || !input.success) return reply.code(400).send({ error: 'INVALID_USER' })

    const user = requireCmsUser(request)
    try {
      return await service.updateUser(id.data, user.id, input.data)
    } catch (error) {
      return sendError(reply, error)
    }
  })

  // ── Admin: reset another user's password ─────────────────────────────────
  app.post('/api/admin/users/:id/reset-password', { preHandler: adminGuard }, async (request, reply) => {
    const id = contentIdSchema.safeParse((request.params as { id?: unknown }).id)
    const input = resetPasswordInputSchema.safeParse(request.body)
    if (!id.success || !input.success) return reply.code(400).send({ error: 'INVALID_PASSWORD' })

    const user = requireCmsUser(request)
    try {
      return await service.resetPassword(id.data, input.data.password, user.id)
    } catch (error) {
      return sendError(reply, error)
    }
  })

  // ── Admin: disable user ──────────────────────────────────────────────────
  app.post('/api/admin/users/:id/disable', { preHandler: adminGuard }, async (request, reply) => {
    const id = contentIdSchema.safeParse((request.params as { id?: unknown }).id)
    if (!id.success) return reply.code(400).send({ error: 'INVALID_USER_ID' })

    const user = requireCmsUser(request)
    try {
      return await service.disableUser(id.data, user.id)
    } catch (error) {
      return sendError(reply, error)
    }
  })

  // ── Self-service: change own password (any logged-in cms role) ──────────
  app.post('/api/admin/me/change-password', { preHandler: selfGuard }, async (request, reply) => {
    const input = changePasswordInputSchema.safeParse(request.body)
    if (!input.success)
      return reply.code(400).send({ error: 'INVALID_PASSWORD', details: input.error.flatten().fieldErrors })

    const user = requireCmsUser(request)
    const token = readSessionToken(request)
    const currentSessionId = token ? await findSessionIdByToken(options.db, token) : null

    try {
      return await service.changeOwnPassword(user.id, currentSessionId, input.data)
    } catch (error) {
      return sendError(reply, error)
    }
  })
}
