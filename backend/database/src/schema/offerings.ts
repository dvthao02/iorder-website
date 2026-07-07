import { sql } from 'drizzle-orm'
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'

import { contentStatusEnum, offeringTypeEnum, partnerKindEnum } from './enums.js'
import { users } from './identity.js'
import { mediaAssets } from './media.js'
import { timestampColumns } from './shared.js'

export const offerings = pgTable(
  'offerings',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    coverMediaId: uuid('cover_media_id').references(() => mediaAssets.id, { onDelete: 'set null' }),
    type: offeringTypeEnum('type').notNull(),
    title: varchar('title', { length: 220 }).notNull(),
    slug: varchar('slug', { length: 180 }).notNull(),
    summary: text('summary'),
    contentJson: jsonb('content_json').$type<Record<string, unknown>>().notNull(),
    icon: varchar('icon', { length: 120 }),
    status: contentStatusEnum('status').default('draft').notNull(),
    draftVersion: integer('draft_version').default(0).notNull(),
    sortOrder: integer('sort_order').default(0).notNull(),
    isFeatured: boolean('is_featured').default(false).notNull(),
    seoTitle: varchar('seo_title', { length: 70 }),
    seoDescription: varchar('seo_description', { length: 180 }),
    canonicalUrl: text('canonical_url'),
    scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    ...timestampColumns(),
  },
  (table) => [
    uniqueIndex('offerings_active_type_slug_unique')
      .on(table.type, table.slug)
      .where(sql`${table.deletedAt} is null`),
    index('offerings_type_status_sort_index').on(table.type, table.status, table.sortOrder),
  ],
)

export const offeringRevisions = pgTable(
  'offering_revisions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    offeringId: uuid('offering_id')
      .notNull()
      .references(() => offerings.id, { onDelete: 'cascade' }),
    editorId: uuid('editor_id').references(() => users.id, { onDelete: 'set null' }),
    versionNumber: integer('version_number').notNull(),
    contentSnapshot: jsonb('content_snapshot').$type<Record<string, unknown>>().notNull(),
    changeNote: varchar('change_note', { length: 500 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex('offering_revisions_version_unique').on(table.offeringId, table.versionNumber)],
)

export const partners = pgTable(
  'partners',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    logoMediaId: uuid('logo_media_id').references(() => mediaAssets.id, { onDelete: 'set null' }),
    kind: partnerKindEnum('kind').default('partner').notNull(),
    name: varchar('name', { length: 180 }).notNull(),
    description: text('description'),
    websiteUrl: text('website_url'),
    sortOrder: integer('sort_order').default(0).notNull(),
    isEnabled: boolean('is_enabled').default(true).notNull(),
    ...timestampColumns(),
  },
  (table) => [
    uniqueIndex('partners_name_unique').on(table.name),
    index('partners_enabled_sort_index').on(table.isEnabled, table.sortOrder),
  ],
)
