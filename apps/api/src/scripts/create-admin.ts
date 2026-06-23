import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createDatabase } from '@iorder/database'
import { auditLogs, roles, userRoles, users } from '@iorder/database'
import { config } from 'dotenv'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

import { hashPassword } from '../auth/password.js'

const currentDirectory = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(currentDirectory, '../../../../.env') })

const inputSchema = z.object({
  DATABASE_URL: z.string().min(1),
  CMS_ADMIN_USERNAME: z.string().trim().toLowerCase().min(1).max(80),
  CMS_ADMIN_NAME: z.string().trim().min(2).max(180),
  CMS_ADMIN_PASSWORD: z.string().min(1).max(200),
})

const input = inputSchema.parse(process.env)
const database = createDatabase(input.DATABASE_URL)

try {
  const passwordHash = await hashPassword(input.CMS_ADMIN_PASSWORD)

  const [adminRole] = await database.db
    .select({ id: roles.id })
    .from(roles)
    .where(eq(roles.code, 'admin'))
    .limit(1)

  if (!adminRole) {
    throw new Error('Admin role is missing. Run pnpm.cmd db:seed first.')
  }

  const [user] = await database.db
    .insert(users)
    .values({
      username: input.CMS_ADMIN_USERNAME,
      fullName: input.CMS_ADMIN_NAME,
      passwordHash,
      status: 'active',
    })
    .onConflictDoUpdate({
      target: users.username,
      set: {
        fullName: input.CMS_ADMIN_NAME,
        passwordHash,
        status: 'active',
        updatedAt: new Date(),
      },
    })
    .returning({ id: users.id, username: users.username })

  if (!user) {
    throw new Error('Admin user could not be created')
  }

  await database.db
    .insert(userRoles)
    .values({ userId: user.id, roleId: adminRole.id })
    .onConflictDoNothing()

  await database.db.insert(auditLogs).values({
    userId: user.id,
    action: 'user.bootstrap_admin',
    entityType: 'user',
    entityId: user.id,
  })

  process.stdout.write(`CMS administrator is ready: ${user.username}\n`)
} finally {
  await database.close()
}
