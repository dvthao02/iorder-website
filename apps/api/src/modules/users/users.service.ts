import type { ChangePasswordInput, CreateUserInput, UpdateUserInput } from '@iorder/contracts'

import { hashPassword, verifyPassword } from '../../auth/password.js'
import {
  DuplicateUsernameError,
  InvalidCurrentPasswordError,
  SelfModificationForbiddenError,
  UserNotFoundError,
} from './users.errors.js'
import { serializeUser, type UsersRepository } from './users.repository.js'

export class UsersService {
  constructor(private repository: UsersRepository) {}

  async listUsers() {
    const rows = await this.repository.list()
    return { items: rows.map(serializeUser), total: rows.length }
  }

  async createUser(input: CreateUserInput, actingUserId: string) {
    const existing = await this.repository.findByUsername(input.username)
    if (existing) throw new DuplicateUsernameError()

    const passwordHash = await hashPassword(input.password)
    const created = await this.repository.create(input, passwordHash)

    await this.repository.insertAuditLog({
      userId: actingUserId,
      action: 'user.create',
      entityType: 'user',
      entityId: created.user.id,
      afterData: serializeUser(created),
    })

    return { statusCode: 201, item: serializeUser(created) }
  }

  async updateUser(targetUserId: string, actingUserId: string, input: UpdateUserInput) {
    if (targetUserId === actingUserId) throw new SelfModificationForbiddenError()

    const existing = await this.repository.findById(targetUserId)
    if (!existing) throw new UserNotFoundError()

    const updated = await this.repository.update(targetUserId, input)
    if (!updated) throw new UserNotFoundError()

    await this.repository.insertAuditLog({
      userId: actingUserId,
      action: 'user.update',
      entityType: 'user',
      entityId: targetUserId,
      beforeData: serializeUser(existing),
      afterData: serializeUser(updated),
    })

    return { item: serializeUser(updated) }
  }

  async resetPassword(id: string, newPassword: string, actingUserId: string) {
    const existing = await this.repository.findById(id)
    if (!existing) throw new UserNotFoundError()

    const passwordHash = await hashPassword(newPassword)
    await this.repository.updatePasswordHash(id, passwordHash)
    await this.repository.deleteAllSessionsForUser(id)

    await this.repository.insertAuditLog({
      userId: actingUserId,
      action: 'user.reset_password',
      entityType: 'user',
      entityId: id,
    })

    return { item: serializeUser(existing) }
  }

  async disableUser(targetUserId: string, actingUserId: string) {
    if (targetUserId === actingUserId) throw new SelfModificationForbiddenError()

    const existing = await this.repository.findById(targetUserId)
    if (!existing) throw new UserNotFoundError()

    const updated = await this.repository.setStatus(targetUserId, 'disabled')
    if (!updated) throw new UserNotFoundError()
    await this.repository.deleteAllSessionsForUser(targetUserId)

    const updatedWithRoles = { user: updated, roles: existing.roles }

    await this.repository.insertAuditLog({
      userId: actingUserId,
      action: 'user.disable',
      entityType: 'user',
      entityId: targetUserId,
      beforeData: serializeUser(existing),
      afterData: serializeUser(updatedWithRoles),
    })

    return { item: serializeUser(updatedWithRoles) }
  }

  async changeOwnPassword(currentUserId: string, currentSessionId: string | null, input: ChangePasswordInput) {
    const existing = await this.repository.findById(currentUserId)
    if (!existing) throw new UserNotFoundError()

    const isValid = await verifyPassword(input.currentPassword, existing.user.passwordHash)
    if (!isValid) throw new InvalidCurrentPasswordError()

    const passwordHash = await hashPassword(input.newPassword)
    await this.repository.updatePasswordHash(currentUserId, passwordHash)

    if (currentSessionId) {
      await this.repository.deleteSessionsForUserExcept(currentUserId, currentSessionId)
    } else {
      await this.repository.deleteAllSessionsForUser(currentUserId)
    }

    await this.repository.insertAuditLog({
      userId: currentUserId,
      action: 'user.change_password',
      entityType: 'user',
      entityId: currentUserId,
    })

    return { item: serializeUser(existing) }
  }
}
