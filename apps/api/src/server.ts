import { resolve } from 'node:path'
import { config } from 'dotenv'
import { buildApp } from './app.js'
import { readEnv } from './env.js'

config({ path: resolve(import.meta.dirname, '../../../.env') })

const env = readEnv()
const app = await buildApp(env)

try {
  await app.listen({ host: env.API_HOST, port: env.API_PORT })
} catch (error) {
  app.log.error(error)
  process.exitCode = 1
}
