import { resolve } from 'node:path'
import { config } from 'dotenv'
import { buildApp } from './app.js'
import { readEnv } from './env.js'

config({ path: resolve(import.meta.dirname, '../../../.env') })

const env = readEnv()
const app = await buildApp(env)

let closing = false

async function shutdown(signal: NodeJS.Signals) {
  if (closing) return
  closing = true
  app.log.info({ signal }, 'Shutting down API server')

  try {
    await app.close()
    process.exit(0)
  } catch (error) {
    app.log.error(error, 'Failed to close API server cleanly')
    process.exit(1)
  }
}

process.once('SIGTERM', () => void shutdown('SIGTERM'))
process.once('SIGINT', () => void shutdown('SIGINT'))

try {
  await app.listen({ host: env.API_HOST, port: env.API_PORT })
} catch (error) {
  app.log.error(error)
  process.exitCode = 1
}
