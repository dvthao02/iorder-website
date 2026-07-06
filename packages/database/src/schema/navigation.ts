import { AnyPgColumn, boolean, index, integer, pgTable, text, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core'

import { linkTypeEnum } from './enums.js'
import { timestampColumns } from './shared.js'

export const menus = pgTable(
  'menus',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 120 }).notNull(),
    location: varchar('location', { length: 80 }).notNull(),
    ...timestampColumns(),
  },
  (table) => [uniqueIndex('menus_location_unique').on(table.location)],
)

export const menuItems = pgTable(
  'menu_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    menuId: uuid('menu_id')
      .notNull()
      .references(() => menus.id, { onDelete: 'cascade' }),
    parentId: uuid('parent_id').references((): AnyPgColumn => menuItems.id, { onDelete: 'cascade' }),
    label: varchar('label', { length: 180 }).notNull(),
    url: text('url').notNull(),
    target: varchar('target', { length: 20 }).default('_self').notNull(),
    icon: varchar('icon', { length: 120 }),
    sortOrder: integer('sort_order').default(0).notNull(),
    isEnabled: boolean('is_enabled').default(true).notNull(),
    ...timestampColumns(),
  },
  (table) => [
    uniqueIndex('menu_items_position_unique').on(table.menuId, table.parentId, table.sortOrder),
    index('menu_items_menu_enabled_index').on(table.menuId, table.isEnabled),
  ],
)

export const linkGroups = pgTable(
  'link_groups',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    code: varchar('code', { length: 100 }).notNull(),
    name: varchar('name', { length: 160 }).notNull(),
    ...timestampColumns(),
  },
  (table) => [uniqueIndex('link_groups_code_unique').on(table.code)],
)

export const contentLinks = pgTable(
  'content_links',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    groupId: uuid('group_id')
      .notNull()
      .references(() => linkGroups.id, { onDelete: 'cascade' }),
    label: varchar('label', { length: 180 }).notNull(),
    url: text('url').notNull(),
    type: linkTypeEnum('type').default('external').notNull(),
    target: varchar('target', { length: 20 }).default('_self').notNull(),
    icon: varchar('icon', { length: 120 }),
    sortOrder: integer('sort_order').default(0).notNull(),
    isEnabled: boolean('is_enabled').default(true).notNull(),
    ...timestampColumns(),
  },
  (table) => [
    uniqueIndex('content_links_position_unique').on(table.groupId, table.sortOrder),
    index('content_links_group_enabled_index').on(table.groupId, table.isEnabled),
  ],
)
