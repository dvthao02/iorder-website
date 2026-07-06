import { loginInputSchema } from '@iorder/contracts'
import type { CmsDatabase } from '@iorder/database'
import { auditLogs, users } from '@iorder/database'
import { eq } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'

import type { ApiEnv } from '../env.js'
import { createAuthGuard, readSessionToken, requireCmsUser, SESSION_COOKIE_NAME } from './auth-guard.js'
import { verifyPassword } from './password.js'
import { createSession, getAuthUser, revokeSession } from './session-service.js'

const genericLoginError = { error: 'INVALID_CREDENTIALS' }

function sessionCookieOptions(env: ApiEnv, expiresAt?: Date) {
  return {
    path: '/',
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    signed: true,
    ...(expiresAt ? { expires: expiresAt } : {}),
  }
}

export function registerAuthRoutes(
  app: FastifyInstance,
  options: {
    db: CmsDatabase
    env: ApiEnv
  },
) {
  const sessionGuard = createAuthGuard(options.db)
  const adminGuard = createAuthGuard(options.db, ['admin'])

  app.post(
    '/api/admin/auth/login',
    {
      config: {
        rateLimit: {
          max: 5,
          timeWindow: '1 minute',
        },
      },
    },
    async (request, reply) => {
      const parsed = loginInputSchema.safeParse(request.body)

      if (!parsed.success) {
        return reply.code(400).send({
          error: 'INVALID_INPUT',
          details: parsed.error.flatten().fieldErrors,
        })
      }

      const [userRecord] = await options.db
        .select({
          id: users.id,
          passwordHash: users.passwordHash,
          status: users.status,
        })
        .from(users)
        .where(eq(users.username, parsed.data.username))
        .limit(1)

      if (
        !userRecord ||
        userRecord.status !== 'active' ||
        !(await verifyPassword(parsed.data.password, userRecord.passwordHash))
      ) {
        return reply.code(401).send(genericLoginError)
      }

      const authUser = await getAuthUser(options.db, userRecord.id)

      if (!authUser || authUser.roles.length === 0) {
        return reply.code(403).send({ error: 'NO_CMS_ROLE' })
      }

      const session = await createSession({
        db: options.db,
        userId: userRecord.id,
        ttlDays: options.env.SESSION_TTL_DAYS,
        ipAddress: request.ip,
        sessionSecret: options.env.SESSION_SECRET,
        ...(request.headers['user-agent'] ? { userAgent: request.headers['user-agent'] } : {}),
      })

      await options.db
        .update(users)
        .set({ lastLoginAt: new Date(), updatedAt: new Date() })
        .where(eq(users.id, userRecord.id))

      await options.db.insert(auditLogs).values({
        userId: userRecord.id,
        action: 'auth.login',
        entityType: 'user',
        entityId: userRecord.id,
      })

      reply.setCookie(SESSION_COOKIE_NAME, session.token, sessionCookieOptions(options.env, session.expiresAt))

      return reply.send({ user: authUser })
    },
  )

  app.post(
    '/api/admin/auth/logout',
    {
      preHandler: sessionGuard,
    },
    async (request, reply) => {
      const token = readSessionToken(request)
      const user = requireCmsUser(request)

      if (token) {
        await revokeSession(options.db, token)
      }

      await options.db.insert(auditLogs).values({
        userId: user.id,
        action: 'auth.logout',
        entityType: 'user',
        entityId: user.id,
      })

      reply.clearCookie(SESSION_COOKIE_NAME, sessionCookieOptions(options.env))
      return reply.code(204).send()
    },
  )

  app.get(
    '/api/admin/auth/me',
    {
      preHandler: sessionGuard,
    },
    async (request) => ({ user: requireCmsUser(request) }),
  )

  app.get(
    '/api/admin/system/status',
    {
      preHandler: adminGuard,
    },
    async () => ({
      service: 'iorder-cms-api',
      adminAccess: true,
    }),
  )
}
