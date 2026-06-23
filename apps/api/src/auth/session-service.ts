import type { AuthUser, CmsRole } from '@iorder/contracts'
import type { CmsDatabase } from '@iorder/database'
import { roles, sessions, userRoles, users } from '@iorder/database'
import { and, eq, gt, isNull } from 'drizzle-orm'

import { createSessionToken, hashIpAddress, hashSessionToken } from './session-token.js'

const CMS_ROLE_CODES = new Set<CmsRole>(['admin', 'editor', 'author'])

function isCmsRole(value: string): value is CmsRole {
  return CMS_ROLE_CODES.has(value as CmsRole)
}

async function getUserRoles(db: CmsDatabase, userId: string): Promise<CmsRole[]> {
  const result = await db
    .select({ code: roles.code })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .where(eq(userRoles.userId, userId))

  return result.map(({ code }) => code).filter(isCmsRole)
}

export async function getAuthUser(db: CmsDatabase, userId: string): Promise<AuthUser | null> {
  const [user] = await db
    .select({
      id: users.id,
      username: users.username,
      fullName: users.fullName,
    })
    .from(users)
    .where(and(eq(users.id, userId), eq(users.status, 'active')))
    .limit(1)

  if (!user) {
    return null
  }

  return {
    ...user,
    roles: await getUserRoles(db, user.id),
  }
}

export async function createSession(options: {
  db: CmsDatabase
  userId: string
  ttlDays: number
  ipAddress: string
  userAgent?: string
  sessionSecret: string
}) {
  const token = createSessionToken()
  const expiresAt = new Date(Date.now() + options.ttlDays * 24 * 60 * 60 * 1000)

  await options.db.insert(sessions).values({
    userId: options.userId,
    tokenHash: hashSessionToken(token),
    expiresAt,
    ipHash: hashIpAddress(options.ipAddress, options.sessionSecret),
    ...(options.userAgent ? { userAgent: options.userAgent.slice(0, 500) } : {}),
  })

  return { token, expiresAt }
}

export async function findSessionUser(db: CmsDatabase, token: string): Promise<AuthUser | null> {
  const [session] = await db
    .select({
      id: sessions.id,
      userId: sessions.userId,
    })
    .from(sessions)
    .where(and(
      eq(sessions.tokenHash, hashSessionToken(token)),
      isNull(sessions.revokedAt),
      gt(sessions.expiresAt, new Date()),
    ))
    .limit(1)

  if (!session) {
    return null
  }

  const user = await getAuthUser(db, session.userId)

  if (!user) {
    return null
  }

  await db
    .update(sessions)
    .set({ lastSeenAt: new Date() })
    .where(eq(sessions.id, session.id))

  return user
}

export async function revokeSession(db: CmsDatabase, token: string): Promise<void> {
  await db
    .update(sessions)
    .set({ revokedAt: new Date() })
    .where(and(
      eq(sessions.tokenHash, hashSessionToken(token)),
      isNull(sessions.revokedAt),
    ))
}
