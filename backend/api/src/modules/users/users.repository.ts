import type { CmsRole, CreateUserInput, UpdateUserInput } from '@iorder/contracts'
import type { CmsDatabase } from '@iorder/database'
import { auditLogs, roles, sessions, userRoles, users } from '@iorder/database'
import { and, eq, inArray, ne } from 'drizzle-orm'

export type UserRecord = typeof users.$inferSelect
export type UserWithRoles = { user: UserRecord; roles: CmsRole[] }

export function serializeUser(row: UserWithRoles) {
  return {
    id: row.user.id,
    username: row.user.username,
    email: row.user.email,
    fullName: row.user.fullName,
    status: row.user.status,
    roles: row.roles,
    lastLoginAt: row.user.lastLoginAt ? row.user.lastLoginAt.toISOString() : null,
    createdAt: row.user.createdAt.toISOString(),
  }
}

export class UsersRepository {
  constructor(private db: CmsDatabase) {}

  private async getRolesForUser(userId: string): Promise<CmsRole[]> {
    const rows = await this.db
      .select({ code: roles.code })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, userId))
    return rows.map((row) => row.code) as CmsRole[]
  }

  async findByUsername(username: string) {
    const [row] = await this.db.select().from(users).where(eq(users.username, username)).limit(1)
    return row ?? null
  }

  async findById(id: string): Promise<UserWithRoles | null> {
    const [user] = await this.db.select().from(users).where(eq(users.id, id)).limit(1)
    if (!user) return null
    return { user, roles: await this.getRolesForUser(user.id) }
  }

  async list(): Promise<UserWithRoles[]> {
    const allUsers = await this.db.select().from(users).orderBy(users.fullName)
    const result: UserWithRoles[] = []
    for (const user of allUsers) {
      result.push({ user, roles: await this.getRolesForUser(user.id) })
    }
    return result
  }

  async create(input: CreateUserInput, passwordHash: string): Promise<UserWithRoles> {
    return this.db.transaction(async (tx) => {
      const [created] = await tx
        .insert(users)
        .values({
          username: input.username,
          email: input.email,
          fullName: input.fullName,
          passwordHash,
        })
        .returning()
      if (!created) throw new Error('User was not created')

      const roleRows = await tx
        .select({ id: roles.id, code: roles.code })
        .from(roles)
        .where(inArray(roles.code, input.roles))
      if (roleRows.length > 0) {
        await tx.insert(userRoles).values(roleRows.map((role) => ({ userId: created.id, roleId: role.id })))
      }

      return { user: created, roles: roleRows.map((role) => role.code) as CmsRole[] }
    })
  }

  async update(id: string, input: UpdateUserInput): Promise<UserWithRoles | null> {
    return this.db.transaction(async (tx) => {
      const [updated] = await tx
        .update(users)
        .set({
          fullName: input.fullName,
          email: input.email,
          status: input.status,
          updatedAt: new Date(),
        })
        .where(eq(users.id, id))
        .returning()
      if (!updated) return null

      await tx.delete(userRoles).where(eq(userRoles.userId, id))
      const roleRows = await tx
        .select({ id: roles.id, code: roles.code })
        .from(roles)
        .where(inArray(roles.code, input.roles))
      if (roleRows.length > 0) {
        await tx.insert(userRoles).values(roleRows.map((role) => ({ userId: id, roleId: role.id })))
      }

      return { user: updated, roles: roleRows.map((role) => role.code) as CmsRole[] }
    })
  }

  async setStatus(id: string, status: 'active' | 'disabled') {
    const [updated] = await this.db
      .update(users)
      .set({ status, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning()
    return updated ?? null
  }

  async updatePasswordHash(id: string, passwordHash: string) {
    await this.db.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, id))
  }

  async deleteAllSessionsForUser(userId: string) {
    await this.db.delete(sessions).where(eq(sessions.userId, userId))
  }

  async deleteSessionsForUserExcept(userId: string, currentSessionId: string) {
    await this.db.delete(sessions).where(and(eq(sessions.userId, userId), ne(sessions.id, currentSessionId)))
  }

  async insertAuditLog(entry: {
    userId: string
    action: string
    entityType: string
    entityId: string
    beforeData?: unknown
    afterData?: unknown
  }) {
    await this.db.insert(auditLogs).values(entry)
  }
}
