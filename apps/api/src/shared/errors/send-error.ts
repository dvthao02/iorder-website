import type { FastifyReply } from 'fastify'

import { ApplicationError } from './ApplicationError.js'

// Adapter dùng chung cho mọi *-routes.ts: map ApplicationError sang response HTTP đúng mã lỗi,
// còn lỗi không xác định thì ném lại để Fastify error handler mặc định xử lý (log + 500).
export function sendError(reply: FastifyReply, error: unknown) {
  if (error instanceof ApplicationError) {
    return reply.code(error.statusCode).send(error.toJSON())
  }
  throw error
}
