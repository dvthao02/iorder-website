import { homepageAutosaveInputSchema, homepageInputSchema, homepageVersionInputSchema } from '@iorder/contracts'
import type { CmsDatabase } from '@iorder/database'
import type { FastifyInstance } from 'fastify'

import { createAuthGuard, requireCmsUser } from '../../auth/auth-guard.js'
import { verifyHomepagePreviewToken } from '../../pages/preview-token.js'
import { sendError } from '../../shared/errors/index.js'
import { HookManager } from '../../shared/hooks/index.js'
import { registerHomepageHooks } from './homepage.hooks.js'
import { HomepageRepository } from './homepage.repository.js'
import { HomepageService } from './homepage.service.js'

const HOME_SLUG = 'home'

export function registerHomepageRoutes(
  app: FastifyInstance,
  options: {
    db: CmsDatabase
    slug?: string
    previewSecret: string
    publicOrigin: string
    hooks?: HookManager
  },
) {
  const adminGuard = createAuthGuard(options.db, ['admin', 'editor'])
  const homepageSlug = options.slug ?? HOME_SLUG
  const hooks = options.hooks ?? new HookManager()
  registerHomepageHooks(hooks)
  const repository = new HomepageRepository(options.db)
  const service = new HomepageService(repository, hooks, homepageSlug)

  app.get('/api/admin/homepage', { preHandler: adminGuard }, async () => {
    return { item: await service.getHomepage() }
  })

  app.put('/api/admin/homepage/autosave', { preHandler: adminGuard }, async (request, reply) => {
    const input = homepageAutosaveInputSchema.safeParse(request.body)
    if (!input.success) return reply.code(400).send({ error: 'INVALID_HOMEPAGE', details: input.error.flatten() })

    try {
      return await service.autosave(input.data.data, input.data.baseVersion)
    } catch (error) {
      return sendError(reply, error)
    }
  })

  // Compatibility/manual save endpoint. Explicit saves create a revision.
  app.put('/api/admin/homepage', { preHandler: adminGuard }, async (request, reply) => {
    const input = homepageInputSchema.safeParse(request.body)
    if (!input.success) return reply.code(400).send({ error: 'INVALID_HOMEPAGE', details: input.error.flatten() })

    const user = requireCmsUser(request)
    try {
      return await service.save(input.data, user.id)
    } catch (error) {
      return sendError(reply, error)
    }
  })

  app.post('/api/admin/homepage/checkpoint', { preHandler: adminGuard }, async (request, reply) => {
    const input = homepageVersionInputSchema.safeParse(request.body)
    if (!input.success) return reply.code(400).send({ error: 'INVALID_VERSION_REQUEST' })

    const user = requireCmsUser(request)
    try {
      return await service.createCheckpoint(input.data.baseVersion, user.id, input.data.changeNote)
    } catch (error) {
      return sendError(reply, error)
    }
  })

  app.post('/api/admin/homepage/publish', { preHandler: adminGuard }, async (request, reply) => {
    const input = homepageVersionInputSchema.safeParse(request.body ?? { baseVersion: -1 })
    const user = requireCmsUser(request)
    try {
      return await service.publish(
        input.success ? input.data.baseVersion : null,
        user.id,
        input.success ? input.data.changeNote : null,
      )
    } catch (error) {
      return sendError(reply, error)
    }
  })

  app.get('/api/admin/homepage/revisions', { preHandler: adminGuard }, async (_request, reply) => {
    try {
      return await service.listRevisions()
    } catch (error) {
      return sendError(reply, error)
    }
  })

  app.get('/api/admin/homepage/revisions/:version', { preHandler: adminGuard }, async (request, reply) => {
    const version = Number((request.params as { version: string }).version)
    if (!Number.isInteger(version) || version < 1) return reply.code(400).send({ error: 'INVALID_REVISION' })

    try {
      return await service.getRevision(version)
    } catch (error) {
      return sendError(reply, error)
    }
  })

  app.post('/api/admin/homepage/revisions/:version/restore', { preHandler: adminGuard }, async (request, reply) => {
    const version = Number((request.params as { version: string }).version)
    const input = homepageVersionInputSchema.safeParse(request.body)
    if (!Number.isInteger(version) || version < 1 || !input.success)
      return reply.code(400).send({ error: 'INVALID_REVISION_REQUEST' })

    const user = requireCmsUser(request)
    try {
      return await service.restoreRevision(version, input.data.baseVersion, user.id)
    } catch (error) {
      return sendError(reply, error)
    }
  })

  app.post('/api/admin/homepage/preview-token', { preHandler: adminGuard }, async (_request, reply) => {
    try {
      return await service.createPreviewToken(options.previewSecret, options.publicOrigin)
    } catch (error) {
      return sendError(reply, error)
    }
  })

  app.get('/api/public/homepage/preview', async (request, reply) => {
    const token = (request.query as { token?: string }).token ?? ''
    if (!verifyHomepagePreviewToken(token, options.previewSecret))
      return reply.code(401).send({ error: 'INVALID_OR_EXPIRED_PREVIEW' })

    try {
      const data = await service.getPreviewData()
      reply.header('Cache-Control', 'no-store, private')
      return data
    } catch (error) {
      return sendError(reply, error)
    }
  })

  app.get('/api/public/homepage', async (_request, reply) => {
    try {
      const result = await service.getPublicHomepage()
      if (!result) return reply.code(404).send({ error: 'HOMEPAGE_NOT_PUBLISHED' })
      return result
    } catch (error) {
      return sendError(reply, error)
    }
  })
}
