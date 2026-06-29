import type { FastifyInstance } from 'fastify'
import * as Sentry from '@sentry/node'

import type { ApiEnv } from '../env.js'

let isInitialized = false

export function initApiObservability(env: ApiEnv) {
  if (!env.SENTRY_DSN || isInitialized) return

  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.SENTRY_ENVIRONMENT ?? env.NODE_ENV,
    tracesSampleRate: env.SENTRY_TRACES_SAMPLE_RATE,
    sendDefaultPii: false,
    ...(env.SENTRY_RELEASE ? { release: env.SENTRY_RELEASE } : {}),
    beforeSend(event) {
      if (event.request?.headers) {
        delete event.request.headers.cookie
        delete event.request.headers.authorization
      }
      return event
    },
  })

  isInitialized = true
}

export function registerApiErrorReporting(app: FastifyInstance) {
  if (!isInitialized) return
  Sentry.setupFastifyErrorHandler(app)
}
