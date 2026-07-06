import { siteProfileInputSchema } from '@iorder/contracts'
import type { CmsDatabase } from '@iorder/database'
import type { FastifyInstance } from 'fastify'

import { createAuthGuard, requireCmsUser } from '../../auth/auth-guard.js'
import { SettingsRepository } from './settings.repository.js'
import { SettingsService } from './settings.service.js'

export function registerSettingsRoutes(app: FastifyInstance, { db }: { db: CmsDatabase }) {
  const authGuard = createAuthGuard(db, ['admin'])
  const repository = new SettingsRepository(db)
  const service = new SettingsService(repository)

  // ── Public: get combined settings ─────────────────────────────────────────
  app.get('/api/public/settings', async () => service.getPublicSettings())

  // ── Admin: get site profile ───────────────────────────────────────────────
  app.get('/api/admin/settings/profile', { preHandler: [authGuard] }, async (request) => {
    requireCmsUser(request)
    return service.getProfile()
  })

  // ── Admin: update site profile ────────────────────────────────────────────
  app.put('/api/admin/settings/profile', { preHandler: [authGuard] }, async (request, reply) => {
    const user = requireCmsUser(request)
    const body = siteProfileInputSchema.safeParse(request.body)
    if (!body.success) return reply.code(400).send({ error: 'VALIDATION_ERROR', issues: body.error.issues })
    return service.updateProfile(body.data, user.id)
  })

  // ── Admin: get external links ─────────────────────────────────────────────
  app.get('/api/admin/settings/external-links', { preHandler: [authGuard] }, async (request) => {
    requireCmsUser(request)
    return service.getExternalLinks()
  })

  // ── Admin: update external links ──────────────────────────────────────────
  app.put('/api/admin/settings/external-links', { preHandler: [authGuard] }, async (request) => {
    const user = requireCmsUser(request)
    return service.updateExternalLinks(request.body as Record<string, string | null>, user.id)
  })

  // ── Admin: get appearance ─────────────────────────────────────────────────
  app.get('/api/admin/settings/appearance', { preHandler: [authGuard] }, async (request) => {
    requireCmsUser(request)
    return service.getAppearance()
  })

  // ── Admin: update appearance ──────────────────────────────────────────────
  app.put('/api/admin/settings/appearance', { preHandler: [authGuard] }, async (request) => {
    const user = requireCmsUser(request)
    return service.updateAppearance(request.body as Record<string, unknown>, user.id)
  })

  // ── Admin: list all settings ──────────────────────────────────────────────
  app.get('/api/admin/settings', { preHandler: [authGuard] }, async (request) => {
    requireCmsUser(request)
    return service.listAll()
  })
}
