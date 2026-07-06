import { index, pgEnum, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'

import { users } from './identity.js'

export const leadStatusEnum = pgEnum('lead_status', ['new', 'contacted', 'closed'])

export const contactLeads = pgTable(
  'contact_leads',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 180 }).notNull(),
    phone: varchar('phone', { length: 30 }).notNull(),
    email: varchar('email', { length: 320 }),
    businessModel: varchar('business_model', { length: 120 }),
    branches: varchar('branches', { length: 60 }),
    need: varchar('need', { length: 200 }),
    message: text('message'),
    status: leadStatusEnum('status').default('new').notNull(),
    ipHash: varchar('ip_hash', { length: 128 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    handledAt: timestamp('handled_at', { withTimezone: true }),
    handledBy: uuid('handled_by').references(() => users.id, { onDelete: 'set null' }),
  },
  (table) => [
    index('contact_leads_status_created_index').on(table.status, table.createdAt),
    index('contact_leads_created_index').on(table.createdAt),
  ],
)
