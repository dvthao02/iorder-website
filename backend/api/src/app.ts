import { randomUUID } from 'node:crypto'
import { mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
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
import { LocalMediaStorage } from './media/media-storage.js'
import { registerActivityRoutes } from './modules/activity/activity-routes.js'
import { registerCategoryRoutes } from './modules/categories/categories-routes.js'
import { registerContentPageRoutes } from './modules/content-pages/content-pages-routes.js'
import { registerDownloadRoutes } from './modules/downloads/downloads-routes.js'
import { registerHomepageRoutes } from './modules/homepage/homepage-routes.js'
import { registerLeadRoutes } from './modules/leads/leads-routes.js'
import { registerMediaRoutes } from './modules/media/media-routes.js'
import { registerNavigationRoutes } from './modules/navigation/navigation-routes.js'
import { registerOfferingRoutes } from './modules/offerings/offerings-routes.js'
import { registerPartnerRoutes } from './modules/partners/partners-routes.js'
import { registerPostRoutes } from './modules/posts/posts-routes.js'
import { registerSettingsRoutes } from './modules/settings/settings-routes.js'
import { registerTestimonialRoutes } from './modules/testimonials/testimonials-routes.js'
import { registerUserRoutes } from './modules/users/users-routes.js'
import { initApiObservability, registerApiErrorReporting } from './observability/sentry.js'
import { registerSeoRoutes } from './seo/seo-routes.js'
import { HookManager } from './shared/hooks/index.js'
import { startPostScheduler } from './shared/scheduler/post-scheduler.js'
import { registerStatsRoutes } from './stats/stats-routes.js'

const moduleDir = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(moduleDir, '../../..')

// Chuyển TRUST_PROXY (chuỗi env) sang giá trị Fastify chấp nhận:
// 'true'/'false' → boolean, số → số hop, còn lại → danh sách IP/subnet.
function parseTrustProxy(value: string): boolean | number | string {
  const trimmed = value.trim()
  if (trimmed === '' || trimmed.toLowerCase() === 'false') return false
  if (trimmed.toLowerCase() === 'true') return true
  if (/^\d+$/.test(trimmed)) return Number(trimmed)
  return trimmed
}

export async function buildApp(env: ApiEnv) {
  initApiObservability(env)
  const database = createDatabase(env.DATABASE_URL)
  const mediaRoot = resolve(env.MEDIA_STORAGE_PATH)
  const mediaStorage = new LocalMediaStorage(mediaRoot, env.MEDIA_PUBLIC_BASE_URL)
  // Shared event bus: modules register lifecycle hooks (e.g. cache invalidation) on the same instance.
  const hooks = new HookManager()
  const app = Fastify({
    genReqId: () => randomUUID(),
    requestIdHeader: 'x-request-id',
    // Sau nginx/reverse proxy: lấy IP thật từ X-Forwarded-For để đếm lượt xem chính xác.
    trustProxy: parseTrustProxy(env.TRUST_PROXY),
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

  // Serve admin CMS at /admin
  const adminDist = resolve(repositoryRoot, 'frontend/admin/dist')
  await app.register(staticFiles, {
    root: adminDist,
    prefix: '/admin',
    decorateReply: false,
  })
  app.get('/admin', async (_req, reply) => reply.sendFile('index.html', adminDist))
  app.get('/admin/', async (_req, reply) => reply.sendFile('index.html', adminDist))

  // Serve compiled React frontend (SPA)
  const frontendDist = resolve(repositoryRoot, 'frontend/web/dist')
  await app.register(staticFiles, {
    root: frontendDist,
    prefix: '/',
    index: 'index.html',
  })

  // SPA fallback: serve index.html for React Router deep links.
  // Deep links trong CMS (vd /admin/bai-viet) → admin index.html; còn lại → site index.html
  app.setNotFoundHandler(async (request, reply) => {
    if (request.url.startsWith('/admin')) {
      return reply.sendFile('index.html', adminDist)
    }
    return reply.sendFile('index.html')
  })

  // Helmet mặc định set Cross-Origin-Resource-Policy: same-origin, block <img>/<video>
  // từ public site (port 5173) load media từ API (port 4000).
  // Override cho tất cả /media/* routes để cho phép cross-origin resource load.
  app.addHook('onSend', async (request, reply) => {
    void reply.header('x-request-id', request.id)
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
          localDevelopment =
            url.protocol === 'http:' &&
            ['127.0.0.1', 'localhost', '::1'].includes(url.hostname) &&
            ['5173', '5174'].includes(url.port)
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
    hooks,
  })
  const { service: postsService } = registerPostRoutes(app, { db: database.db, hooks })
  registerCategoryRoutes(app, { db: database.db })
  registerSeoRoutes(app, { db: database.db, publicOrigin: env.PUBLIC_ORIGIN })
  registerHomepageRoutes(app, {
    db: database.db,
    slug: env.HOMEPAGE_SLUG,
    previewSecret: env.CMS_PREVIEW_SECRET ?? env.SESSION_SECRET,
    publicOrigin: env.PUBLIC_ORIGIN,
    hooks,
  })
  registerOfferingRoutes(app, { db: database.db, hooks })
  registerContentPageRoutes(app, { db: database.db, hooks })
  registerPartnerRoutes(app, { db: database.db })
  registerTestimonialRoutes(app, { db: database.db })
  registerLeadRoutes(app, { db: database.db, sessionSecret: env.SESSION_SECRET })
  registerDownloadRoutes(app, { db: database.db })
  registerNavigationRoutes(app, { db: database.db })
  registerSettingsRoutes(app, { db: database.db })
  registerActivityRoutes(app, { db: database.db })
  registerUserRoutes(app, { db: database.db })
  registerStatsRoutes(app, { appDbUrls: env.IORDER_APP_DB_URLS })
  registerApiErrorReporting(app)

  // Scheduler tự động publish bài viết hẹn giờ (Posts.scheduledAt) — bật/tắt và cấu hình interval qua env.
  const postScheduler = startPostScheduler({
    postsService,
    logger: app.log,
    enabled: env.POST_SCHEDULER_ENABLED,
    intervalMs: env.POST_SCHEDULER_INTERVAL_MS,
  })

  app.addHook('onClose', async () => {
    postScheduler.stop()
    await database.close()
  })

  return app
}
