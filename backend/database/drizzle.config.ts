import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { config } from 'dotenv'
import { defineConfig } from 'drizzle-kit'

const currentDirectory = dirname(fileURLToPath(import.meta.url))

config({ path: resolve(currentDirectory, '../../.env') })

// `generate` is an offline schema comparison. Runtime migrations still require
// a real DATABASE_URL in src/migrate.ts.
const databaseUrl = process.env.DATABASE_URL ?? 'postgresql://unused:unused@127.0.0.1:5432/unused'

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/schema/index.ts',
  out: './migrations',
  dbCredentials: {
    url: databaseUrl,
  },
  strict: true,
  verbose: true,
})
