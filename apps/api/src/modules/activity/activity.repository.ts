import type { ActivityListQuery } from '@iorder/contracts'
import type { CmsDatabase } from '@iorder/database'
import { auditLogs, users } from '@iorder/database'
import { and, count, desc, eq } from 'drizzle-orm'

export type AuditLogRow = typeof auditLogs.$inferSelect
export type AuditLogWithUser = { log: AuditLogRow; userName: string | null }

export function serializeAuditLogEntry(row: AuditLogWithUser) {
  return {
    id: row.log.id,
    action: row.log.action,
    entityType: row.log.entityType,
    entityId: row.log.entityId,
    userName: row.userName,
    beforeData: row.log.beforeData ?? null,
    afterData: row.log.afterData ?? null,
    createdAt: row.log.createdAt.toISOString(),
  }
}

export class ActivityRepository {
  constructor(private db: CmsDatabase) {}

  async list(query: ActivityListQuery): Promise<{ items: AuditLogWithUser[]; total: number }> {
    const conditions = []
    if (query.entityType) conditions.push(eq(auditLogs.entityType, query.entityType))
    if (query.action) conditions.push(eq(auditLogs.action, query.action))
    if (query.userId) conditions.push(eq(auditLogs.userId, query.userId))
    const where = conditions.length > 0 ? and(...conditions) : undefined

    const [rows, totalRow] = await Promise.all([
      this.db
        .select({ log: auditLogs, userName: users.fullName })
        .from(auditLogs)
        .leftJoin(users, eq(auditLogs.userId, users.id))
        .where(where)
        .orderBy(desc(auditLogs.createdAt))
        .limit(query.limit)
        .offset((query.page - 1) * query.limit),
      this.db.select({ value: count() }).from(auditLogs).where(where),
    ])

    return { items: rows, total: totalRow[0]?.value ?? 0 }
  }
}
