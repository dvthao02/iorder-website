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
  CMS_ADMIN_USERNAME: z.string().trim().toLowerCase().min(1).max(80).default('admin'),
  CMS_ADMIN_NAME: z.string().trim().min(2).max(180).default('CMS Administrator'),
  CMS_ADMIN_PASSWORD: z.string().min(1).max(200).optional(),
})

const input = inputSchema.parse(process.env)
const database = createDatabase(input.DATABASE_URL)

try {
  const [adminRole] = await database.db.select({ id: roles.id }).from(roles).where(eq(roles.code, 'admin')).limit(1)

  if (!adminRole) {
    throw new Error('Admin role is missing. Run pnpm.cmd db:seed first.')
  }

  const [existingUser] = await database.db
    .select({ id: users.id, username: users.username })
    .from(users)
    .where(eq(users.username, input.CMS_ADMIN_USERNAME))
    .limit(1)

  if (!existingUser && !input.CMS_ADMIN_PASSWORD) {
    throw new Error('CMS_ADMIN_PASSWORD is required to create the first CMS administrator.')
  }

  const passwordHash = input.CMS_ADMIN_PASSWORD ? await hashPassword(input.CMS_ADMIN_PASSWORD) : undefined
  const [user] = existingUser
    ? await database.db
        .update(users)
        .set(
          passwordHash
            ? {
                fullName: input.CMS_ADMIN_NAME,
                passwordHash,
                status: 'active',
                updatedAt: new Date(),
              }
            : {
                fullName: input.CMS_ADMIN_NAME,
                status: 'active',
                updatedAt: new Date(),
              },
        )
        .where(eq(users.id, existingUser.id))
        .returning({ id: users.id, username: users.username })
    : await database.db
        .insert(users)
        .values({
          username: input.CMS_ADMIN_USERNAME,
          fullName: input.CMS_ADMIN_NAME,
          passwordHash: passwordHash!,
          status: 'active',
        })
        .returning({ id: users.id, username: users.username })

  if (!user) {
    throw new Error('Admin user could not be created')
  }

  await database.db.insert(userRoles).values({ userId: user.id, roleId: adminRole.id }).onConflictDoNothing()

  if (!existingUser || passwordHash) {
    await database.db.insert(auditLogs).values({
      userId: user.id,
      action: existingUser ? 'user.bootstrap_admin_update' : 'user.bootstrap_admin',
      entityType: 'user',
      entityId: user.id,
    })
  }

  process.stdout.write(
    existingUser && !passwordHash
      ? `CMS administrator already exists: ${user.username}\n`
      : `CMS administrator is ready: ${user.username}\n`,
  )
} finally {
  await database.close()
}
