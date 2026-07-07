import type { ContactLeadInput, LeadStatus } from '@iorder/contracts'
import type { CmsDatabase } from '@iorder/database'
import { auditLogs, contactLeads } from '@iorder/database'
import { and, count, desc, eq } from 'drizzle-orm'

export type LeadRecord = typeof contactLeads.$inferSelect

export function serializeLead(item: LeadRecord) {
  return {
    id: item.id,
    name: item.name,
    phone: item.phone,
    email: item.email,
    businessModel: item.businessModel,
    branches: item.branches,
    need: item.need,
    message: item.message,
    status: item.status,
    createdAt: item.createdAt.toISOString(),
    handledAt: item.handledAt ? item.handledAt.toISOString() : null,
    handledBy: item.handledBy,
  }
}

export type CreateLeadData = Pick<
  ContactLeadInput,
  'name' | 'phone' | 'email' | 'businessModel' | 'branches' | 'need' | 'message'
> & { ipHash: string | null }

export class LeadsRepository {
  constructor(private db: CmsDatabase) {}

  async findById(id: string) {
    const [row] = await this.db.select().from(contactLeads).where(eq(contactLeads.id, id)).limit(1)
    return row ?? null
  }

  async create(data: CreateLeadData) {
    const [created] = await this.db
      .insert(contactLeads)
      .values({
        name: data.name,
        phone: data.phone,
        email: data.email ?? null,
        businessModel: data.businessModel ?? null,
        branches: data.branches ?? null,
        need: data.need ?? null,
        message: data.message ?? null,
        ipHash: data.ipHash,
        status: 'new',
      })
      .returning()
    if (!created) throw new Error('Lead was not created')
    return created
  }

  async list(params: { page: number; limit: number; status?: LeadStatus }) {
    const filters = params.status ? [eq(contactLeads.status, params.status)] : []
    const whereClause = filters.length > 0 ? and(...filters) : undefined

    const [rows, totalRows, totalNewRows] = await Promise.all([
      this.db
        .select()
        .from(contactLeads)
        .where(whereClause)
        .orderBy(desc(contactLeads.createdAt))
        .limit(params.limit)
        .offset((params.page - 1) * params.limit),
      this.db.select({ value: count() }).from(contactLeads).where(whereClause),
      this.db.select({ value: count() }).from(contactLeads).where(eq(contactLeads.status, 'new')),
    ])

    // noUncheckedIndexedAccess: phần tử [0] có thể undefined theo type — fallback 0.
    return { rows, total: totalRows[0]?.value ?? 0, totalNew: totalNewRows[0]?.value ?? 0 }
  }

  async updateStatus(id: string, status: LeadStatus, handled: { handledAt: Date; handledBy: string } | null) {
    const [updated] = await this.db
      .update(contactLeads)
      .set({
        status,
        ...(handled ? { handledAt: handled.handledAt, handledBy: handled.handledBy } : {}),
      })
      .where(eq(contactLeads.id, id))
      .returning()
    return updated ?? null
  }

  async insertAuditLog(entry: {
    userId: string | null
    action: string
    entityType: string
    entityId: string
    beforeData?: unknown
    afterData?: unknown
  }) {
    await this.db.insert(auditLogs).values(entry)
  }
}
