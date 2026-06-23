import { resolve } from 'node:path'
import { config } from 'dotenv'
import { migrate } from 'drizzle-orm/postgres-js/migrator'

import { createDatabase } from './client.js'

config({ path: resolve(import.meta.dirname, '../../../.env') })

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to run migrations')
}

const connection = createDatabase(databaseUrl)

try {
  await migrate(connection.db, { migrationsFolder: './migrations' })
} finally {
  await connection.close()
}
