import { menuItemInputSchema } from '@iorder/contracts'
import type { CmsDatabase } from '@iorder/database'
import type { FastifyInstance } from 'fastify'

import { createAuthGuard, requireCmsUser } from '../../auth/auth-guard.js'
import { sendError } from '../../shared/errors/index.js'
import { NavigationRepository } from './navigation.repository.js'
import { NavigationService } from './navigation.service.js'

export function registerNavigationRoutes(app: FastifyInstance, { db }: { db: CmsDatabase }) {
  const authGuard = createAuthGuard(db, ['admin'])
  const repository = new NavigationRepository(db)
  const service = new NavigationService(repository)

  // ── Public: get menu by location ──────────────────────────────────────────
  app.get('/api/public/menus/:location', async (request, reply) => {
    const { location } = request.params as { location: string }
    try {
      return await service.getPublicMenu(location)
    } catch (error) {
      return sendError(reply, error)
    }
  })

  // ── Public: get link group by code ────────────────────────────────────────
  app.get('/api/public/link-groups/:code', async (request, reply) => {
    const { code } = request.params as { code: string }
    try {
      return await service.getPublicLinkGroup(code)
    } catch (error) {
      return sendError(reply, error)
    }
  })

  // ── Admin: create menu ────────────────────────────────────────────────────
  app.post('/api/admin/menus', { preHandler: [authGuard] }, async (request, reply) => {
    requireCmsUser(request)
    const { name, location } = request.body as { name: string; location: string }
    if (!name || !location) return reply.code(400).send({ error: 'MISSING_FIELDS' })
    try {
      const { statusCode, item } = await service.createMenu(name, location)
      return reply.code(statusCode).send({ item })
    } catch (error) {
      return sendError(reply, error)
    }
  })

  // ── Admin: seed default navigation ───────────────────────────────────────
  app.post('/api/admin/menus/seed-defaults', { preHandler: [authGuard] }, async (request, reply) => {
    requireCmsUser(request)
    const { statusCode, created } = await service.seedDefaults()
    return reply.code(statusCode).send({ created })
  })

  // ── Admin: list all menus ─────────────────────────────────────────────────
  app.get('/api/admin/menus', { preHandler: [authGuard] }, async (request) => {
    requireCmsUser(request)
    return service.listMenus()
  })

  // ── Admin: get single menu ────────────────────────────────────────────────
  app.get('/api/admin/menus/:location', { preHandler: [authGuard] }, async (request, reply) => {
    requireCmsUser(request)
    const { location } = request.params as { location: string }
    try {
      return await service.getMenu(location)
    } catch (error) {
      return sendError(reply, error)
    }
  })

  // ── Admin: upsert menu item ───────────────────────────────────────────────
  app.put('/api/admin/menus/:location/items/:itemId', { preHandler: [authGuard] }, async (request, reply) => {
    requireCmsUser(request)
    const { location, itemId } = request.params as { location: string; itemId: string }
    const body = menuItemInputSchema.safeParse(request.body)
    if (!body.success) return reply.code(400).send({ error: 'VALIDATION_ERROR', issues: body.error.issues })

    try {
      const { statusCode, item } = await service.upsertMenuItem(location, itemId, body.data)
      return reply.code(statusCode).send({ item })
    } catch (error) {
      return sendError(reply, error)
    }
  })

  // ── Admin: delete menu item ───────────────────────────────────────────────
  app.delete('/api/admin/menus/:location/items/:itemId', { preHandler: [authGuard] }, async (request, reply) => {
    requireCmsUser(request)
    const { location, itemId } = request.params as { location: string; itemId: string }
    try {
      await service.deleteMenuItem(location, itemId)
      return reply.code(204).send()
    } catch (error) {
      return sendError(reply, error)
    }
  })

  // ── Admin: list link groups ───────────────────────────────────────────────
  app.get('/api/admin/link-groups', { preHandler: [authGuard] }, async (request) => {
    requireCmsUser(request)
    return service.listLinkGroups()
  })

  // ── Admin: upsert content link ────────────────────────────────────────────
  app.put('/api/admin/link-groups/:code/links/:linkId', { preHandler: [authGuard] }, async (request, reply) => {
    requireCmsUser(request)
    const { code, linkId } = request.params as { code: string; linkId: string }
    const body = request.body as Record<string, unknown>

    try {
      const { statusCode, item } = await service.upsertContentLink(code, linkId, body)
      return reply.code(statusCode).send({ item })
    } catch (error) {
      return sendError(reply, error)
    }
  })

  // ── Admin: delete content link ────────────────────────────────────────────
  app.delete('/api/admin/link-groups/:code/links/:linkId', { preHandler: [authGuard] }, async (request, reply) => {
    requireCmsUser(request)
    const { code, linkId } = request.params as { code: string; linkId: string }
    try {
      await service.deleteContentLink(code, linkId)
      return reply.code(204).send()
    } catch (error) {
      return sendError(reply, error)
    }
  })
}
