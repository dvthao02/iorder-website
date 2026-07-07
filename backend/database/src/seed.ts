import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { config } from 'dotenv'
import postgres from 'postgres'

config({ path: resolve(import.meta.dirname, '../../../.env') })

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to seed the CMS database')
}

const seedSql = await readFile(resolve(import.meta.dirname, '../scripts/01-seed-core.sql'), 'utf8')

const sql = postgres(databaseUrl, {
  max: 1,
  prepare: false,
})

try {
  await sql.unsafe(seedSql)
} finally {
  await sql.end()
}
