import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import cookie from '@fastify/cookie'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import multipart from '@fastify/multipart'
import rateLimit from '@fastify/rate-limit'
import staticFiles from '@fastify/static'
import { createDatabase } from '@iorder/database'
import Fastify from 'fastify'

import { registerAuthRoutes } from './auth/auth-routes.js'
import type { ApiEnv } from './env.js'
import { registerMediaRoutes } from './media/media-routes.js'
import { LocalMediaStorage } from './media/media-storage.js'
import { registerNavigationRoutes } from './navigation/navigation-routes.js'
import { registerOfferingRoutes } from './offerings/offering-routes.js'
import { registerHomepageRoutes } from './pages/homepage-routes.js'
import { registerPostRoutes } from './posts/post-routes.js'
import { registerSettingsRoutes } from './settings/settings-routes.js'
import { registerStatsRoutes } from './stats/stats-routes.js'

export async function buildApp(env: ApiEnv) {
  const database = createDatabase(env.DATABASE_URL)
  const mediaRoot = resolve(env.MEDIA_STORAGE_PATH)
  const mediaStorage = new LocalMediaStorage(mediaRoot, env.MEDIA_PUBLIC_BASE_URL)
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === 'production' ? 'info' : 'debug',
    },
  })

  await app.register(helmet)
  await app.register(cookie, {
    secret: env.SESSION_SECRET,
    hook: 'onRequest',
  })
  await app.register(rateLimit, {
    global: false,
  })
  await app.register(multipart)
  await mkdir(mediaRoot, { recursive: true })
  await app.register(staticFiles, {
    root: mediaRoot,
    prefix: '/media/',
    decorateReply: false,
  })

  // Serve compiled React frontend (SPA)
  const frontendDist = resolve(process.cwd(), 'dist')
  await app.register(staticFiles, {
    root: frontendDist,
    prefix: '/',
    index: 'index.html',
  })

  // SPA fallback: serve index.html for React Router deep links
  app.setNotFoundHandler(async (_request, reply) => {
    return reply.sendFile('index.html')
  })

  // Helmet mặc định set Cross-Origin-Resource-Policy: same-origin, block <img>/<video>
  // từ public site (port 5173) load media từ API (port 4000).
  // Override cho tất cả /media/* routes để cho phép cross-origin resource load.
  app.addHook('onSend', async (request, reply) => {
    if (request.url.startsWith('/media/')) {
      void reply.header('Cross-Origin-Resource-Policy', 'cross-origin')
    }
  })
  await app.register(cors, {
    origin(origin, callback) {
      const configured = origin === env.ADMIN_ORIGIN || origin === env.PUBLIC_ORIGIN
      let localDevelopment = false
      if (env.NODE_ENV !== 'production' && origin) {
        try {
          const url = new URL(origin)
          localDevelopment = url.protocol === 'http:'
            && ['127.0.0.1', 'localhost', '::1'].includes(url.hostname)
            && ['5173', '5174'].includes(url.port)
        } catch {
          localDevelopment = false
        }
      }
      callback(null, !origin || configured || localDevelopment)
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
  })

  app.get('/health', async (_request, reply) => {
    reply.header('Cross-Origin-Resource-Policy', 'cross-origin')
    return { service: 'iorder-cms-api', status: 'ok' }
  })

  app.get('/api/public/health', async () => ({
    status: 'ok',
    visibility: 'public',
  }))

  registerAuthRoutes(app, {
    db: database.db,
    env,
  })
  registerMediaRoutes(app, {
    db: database.db,
    storage: mediaStorage,
    maxFileSizeBytes: env.MEDIA_MAX_FILE_SIZE_MB * 1024 * 1024,
  })
  registerPostRoutes(app, { db: database.db })
  registerHomepageRoutes(app, { db: database.db, slug: env.HOMEPAGE_SLUG })
  registerOfferingRoutes(app, { db: database.db })
  registerNavigationRoutes(app, { db: database.db })
  registerSettingsRoutes(app, { db: database.db })
  registerStatsRoutes(app, { appDbUrls: env.IORDER_APP_DB_URLS })

  app.addHook('onClose', async () => {
    await database.close()
  })

  return app
}
