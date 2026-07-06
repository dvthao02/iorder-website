import type { AuthUser } from '@iorder/contracts'

declare module 'fastify' {
  interface FastifyRequest {
    cmsUser?: AuthUser
  }
}
