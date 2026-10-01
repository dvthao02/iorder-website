import { sql } from 'drizzle-orm'
import { timestamp } from 'drizzle-orm/pg-core'

// PostgreSQL function installed by migration 0016. Keeping the default in the
// database means Drizzle, seed scripts, and direct SQL inserts all create UUIDv7.
export const uuidV7Default = sql`public.uuid_v7()`

export function timestampColumns() {
  return {
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  }
}
