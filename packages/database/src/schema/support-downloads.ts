import { boolean, index, integer, pgTable, text, uuid, varchar } from 'drizzle-orm/pg-core'

import { mediaAssets } from './media.js'
import { timestampColumns } from './shared.js'

export const supportDownloads = pgTable(
  'support_downloads',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    fileMediaId: uuid('file_media_id').references(() => mediaAssets.id, { onDelete: 'set null' }),
    icon: varchar('icon', { length: 60 }).notNull(),
    title: varchar('title', { length: 220 }).notNull(),
    description: text('description'),
    meta: varchar('meta', { length: 160 }),
    sortOrder: integer('sort_order').default(0).notNull(),
    isEnabled: boolean('is_enabled').default(true).notNull(),
    ...timestampColumns(),
  },
  (table) => [index('support_downloads_enabled_sort_index').on(table.isEnabled, table.sortOrder)],
)
