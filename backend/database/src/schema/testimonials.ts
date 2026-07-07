import { boolean, index, integer, pgTable, text, uuid, varchar } from 'drizzle-orm/pg-core'

import { mediaAssets } from './media.js'
import { timestampColumns } from './shared.js'

export const testimonials = pgTable(
  'testimonials',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    avatarMediaId: uuid('avatar_media_id').references(() => mediaAssets.id, { onDelete: 'set null' }),
    authorName: varchar('author_name', { length: 180 }).notNull(),
    authorRole: varchar('author_role', { length: 180 }),
    company: varchar('company', { length: 180 }),
    quote: text('quote').notNull(),
    rating: integer('rating'),
    sortOrder: integer('sort_order').default(0).notNull(),
    isEnabled: boolean('is_enabled').default(true).notNull(),
    ...timestampColumns(),
  },
  (table) => [index('testimonials_enabled_sort_index').on(table.isEnabled, table.sortOrder)],
)
