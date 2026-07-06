import { pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'

import { timestampColumns } from './shared.js'

export const contentPages = pgTable('content_pages', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: varchar('slug', { length: 200 }).notNull().unique(),
  title: varchar('title', { length: 220 }).notNull(),
  lead: text('lead'),
  body: text('body').notNull(),
  seoTitle: varchar('seo_title', { length: 220 }),
  seoDescription: varchar('seo_description', { length: 320 }),
  status: varchar('status', { length: 20 }).default('draft').notNull(),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  ...timestampColumns(),
})
