import { sql } from 'drizzle-orm'
import {
  bigint,
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

import { contentStatusEnum, salesEquipmentCategoryEnum } from './enums.js'
import { users } from './identity.js'
import { mediaAssets } from './media.js'
import { timestampColumns, uuidV7Default } from './shared.js'

export const salesEquipment = pgTable(
  'sales_equipment',
  {
    id: uuid('id').default(uuidV7Default).primaryKey(),
    category: salesEquipmentCategoryEnum('category').notNull(),
    name: varchar('name', { length: 220 }).notNull(),
    slug: varchar('slug', { length: 180 }).notNull(),
    modelCode: varchar('model_code', { length: 80 }),
    coverMediaId: uuid('cover_media_id').references(() => mediaAssets.id, { onDelete: 'set null' }),
    priceVnd: bigint('price_vnd', { mode: 'number' }).notNull(),
    warrantyMonths: integer('warranty_months').default(12).notNull(),
    summary: text('summary'),
    specificationGroups: jsonb('specification_groups').$type<Record<string, unknown>[]>().default([]).notNull(),
    status: contentStatusEnum('status').default('draft').notNull(),
    draftVersion: integer('draft_version').default(0).notNull(),
    sortOrder: integer('sort_order').default(0).notNull(),
    isFeatured: boolean('is_featured').default(false).notNull(),
    seoTitle: varchar('seo_title', { length: 70 }),
    seoDescription: varchar('seo_description', { length: 180 }),
    canonicalUrl: text('canonical_url'),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    ...timestampColumns(),
  },
  (table) => [
    uniqueIndex('sales_equipment_active_slug_unique')
      .on(table.slug)
      .where(sql`${table.deletedAt} is null`),
    index('sales_equipment_category_status_sort_index').on(table.category, table.status, table.sortOrder),
  ],
)

export const salesEquipmentRevisions = pgTable(
  'sales_equipment_revisions',
  {
    id: uuid('id').default(uuidV7Default).primaryKey(),
    salesEquipmentId: uuid('sales_equipment_id')
      .notNull()
      .references(() => salesEquipment.id, { onDelete: 'cascade' }),
    editorId: uuid('editor_id').references(() => users.id, { onDelete: 'set null' }),
    versionNumber: integer('version_number').notNull(),
    contentSnapshot: jsonb('content_snapshot').$type<Record<string, unknown>>().notNull(),
    changeNote: varchar('change_note', { length: 500 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex('sales_equipment_revisions_version_unique').on(table.salesEquipmentId, table.versionNumber)],
)
