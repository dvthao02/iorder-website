import type { AuthUser, CmsRole } from '@iorder/contracts'
import type { CmsDatabase } from '@iorder/database'
import type { FastifyReply, FastifyRequest } from 'fastify'

import { findSessionUser } from './session-service.js'

export const SESSION_COOKIE_NAME = 'iorder_cms_session'

export function readSessionToken(request: FastifyRequest): string | null {
  const signedCookie = request.cookies[SESSION_COOKIE_NAME]

  if (!signedCookie) {
    return null
  }

  const result = request.unsignCookie(signedCookie)
  return result.valid ? result.value : null
}

export function createAuthGuard(db: CmsDatabase, allowedRoles: CmsRole[] = []) {
  return async function authGuard(request: FastifyRequest, reply: FastifyReply) {
    const token = readSessionToken(request)

    if (!token) {
      await reply.code(401).send({ error: 'UNAUTHENTICATED' })
      return
    }

    const user = await findSessionUser(db, token)

    if (!user) {
      await reply.code(401).send({ error: 'UNAUTHENTICATED' })
      return
    }

    if (allowedRoles.length > 0 && !allowedRoles.some((role) => user.roles.includes(role))) {
      await reply.code(403).send({ error: 'FORBIDDEN' })
      return
    }

    request.cmsUser = user
  }
}

export function requireCmsUser(request: FastifyRequest): AuthUser {
  if (!request.cmsUser) {
    throw new Error('Authenticated CMS user was not attached to the request')
  }

  return request.cmsUser
}
