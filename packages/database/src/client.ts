import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

import * as schema from './schema/index.js'

export function createDatabase(databaseUrl: string) {
  const sql = postgres(databaseUrl, {
    max: 10,
    prepare: false,
  })

  return {
    db: drizzle(sql, { schema }),
    close: () => sql.end(),
  }
}

export type CmsDatabase = ReturnType<typeof createDatabase>['db']
