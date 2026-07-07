import { describe, expect, it, vi } from 'vitest'

import { DuplicateUsernameError, InvalidCurrentPasswordError, SelfModificationForbiddenError } from './users.errors.js'
import type { UserWithRoles, UsersRepository } from './users.repository.js'
import { UsersService } from './users.service.js'

function fakeUser(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'user-1',
    username: 'editor01',
    email: 'editor01@example.com',
    passwordHash: 'scrypt$32768$8$1$c2FsdA$aGFzaA',
    fullName: 'Nguyễn Văn A',
    status: 'active',
    lastLoginAt: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  } as any
}

function fakeUserWithRoles(overrides: Partial<Record<string, unknown>> = {}, roles: string[] = ['editor']) {
  return { user: fakeUser(overrides), roles } as UserWithRoles
}

function fakeCreateInput(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    username: 'editor01',
    email: 'editor01@example.com',
    fullName: 'Nguyễn Văn A',
    password: 'supersecretpw',
    roles: ['editor'],
    ...overrides,
  } as any
}

function fakeUpdateInput(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    fullName: 'Nguyễn Văn A',
    email: 'editor01@example.com',
    roles: ['editor'],
    status: 'active',
    ...overrides,
  } as any
}

function makeRepository(overrides: Partial<Record<keyof UsersRepository, unknown>> = {}) {
  const base = {
    findByUsername: vi.fn().mockResolvedValue(null),
    findById: vi.fn(),
    list: vi.fn().mockResolvedValue([]),
    create: vi.fn(),
    update: vi.fn(),
    setStatus: vi.fn(),
    updatePasswordHash: vi.fn().mockResolvedValue(undefined),
    deleteAllSessionsForUser: vi.fn().mockResolvedValue(undefined),
    deleteSessionsForUserExcept: vi.fn().mockResolvedValue(undefined),
    insertAuditLog: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
  return base as unknown as UsersRepository
}

describe('UsersService.createUser', () => {
  it('creates the user and logs the audit entry without leaking the password', async () => {
    const created = fakeUserWithRoles()
    const repository = makeRepository({ create: vi.fn().mockResolvedValue(created) })
    const service = new UsersService(repository)

    const result = await service.createUser(fakeCreateInput(), 'admin-1')

    expect(result.statusCode).toBe(201)
    expect(result.item).not.toHaveProperty('passwordHash')
    expect(repository.insertAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'user.create', userId: 'admin-1' }),
    )
  })

  it('throws DuplicateUsernameError when the username is already taken', async () => {
    const repository = makeRepository({ findByUsername: vi.fn().mockResolvedValue(fakeUser()) })
    const service = new UsersService(repository)

    await expect(service.createUser(fakeCreateInput(), 'admin-1')).rejects.toBeInstanceOf(DuplicateUsernameError)
    expect(repository.create).not.toHaveBeenCalled()
  })
})

describe('UsersService.updateUser', () => {
  it('updates the user and logs before/after audit data', async () => {
    const existing = fakeUserWithRoles()
    const updated = fakeUserWithRoles({ fullName: 'Nguyễn Văn B' })
    const repository = makeRepository({
      findById: vi.fn().mockResolvedValue(existing),
      update: vi.fn().mockResolvedValue(updated),
    })
    const service = new UsersService(repository)

    const result = await service.updateUser('user-1', 'admin-1', fakeUpdateInput({ fullName: 'Nguyễn Văn B' }))

    expect(result.item.fullName).toBe('Nguyễn Văn B')
    expect(repository.insertAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: 'user.update' }))
  })

  it('throws SelfModificationForbiddenError when acting on own account', async () => {
    const repository = makeRepository()
    const service = new UsersService(repository)

    await expect(service.updateUser('admin-1', 'admin-1', fakeUpdateInput())).rejects.toBeInstanceOf(
      SelfModificationForbiddenError,
    )
    expect(repository.findById).not.toHaveBeenCalled()
  })
})

describe('UsersService.resetPassword', () => {
  it('hashes the new password and revokes all sessions for the user', async () => {
    const existing = fakeUserWithRoles()
    const repository = makeRepository({ findById: vi.fn().mockResolvedValue(existing) })
    const service = new UsersService(repository)

    await service.resetPassword('user-1', 'brandnewpassword', 'admin-1')

    expect(repository.updatePasswordHash).toHaveBeenCalledWith('user-1', expect.any(String))
    expect(repository.deleteAllSessionsForUser).toHaveBeenCalledWith('user-1')
    expect(repository.insertAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: 'user.reset_password' }))
  })
})

describe('UsersService.disableUser', () => {
  it('disables the target user and revokes their sessions', async () => {
    const existing = fakeUserWithRoles()
    const disabled = fakeUser({ status: 'disabled' })
    const repository = makeRepository({
      findById: vi.fn().mockResolvedValue(existing),
      setStatus: vi.fn().mockResolvedValue(disabled),
    })
    const service = new UsersService(repository)

    const result = await service.disableUser('user-1', 'admin-1')

    expect(result.item.status).toBe('disabled')
    expect(repository.deleteAllSessionsForUser).toHaveBeenCalledWith('user-1')
    expect(repository.insertAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: 'user.disable' }))
  })

  it('throws SelfModificationForbiddenError when acting on own account', async () => {
    const repository = makeRepository()
    const service = new UsersService(repository)

    await expect(service.disableUser('admin-1', 'admin-1')).rejects.toBeInstanceOf(SelfModificationForbiddenError)
    expect(repository.findById).not.toHaveBeenCalled()
  })
})

describe('UsersService.changeOwnPassword', () => {
  it('changes the password and clears other sessions when the current password is valid', async () => {
    const { hashPassword } = await import('../../auth/password.js')
    const realHash = await hashPassword('correct-horse-battery')
    const repository = makeRepository({
      findById: vi.fn().mockResolvedValue(fakeUserWithRoles({ passwordHash: realHash })),
    })
    const service = new UsersService(repository)

    await service.changeOwnPassword('user-1', 'session-1', {
      currentPassword: 'correct-horse-battery',
      newPassword: 'brandnewpassword',
    })

    expect(repository.updatePasswordHash).toHaveBeenCalledWith('user-1', expect.any(String))
    expect(repository.deleteSessionsForUserExcept).toHaveBeenCalledWith('user-1', 'session-1')
    expect(repository.insertAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: 'user.change_password' }))
  })

  it('throws InvalidCurrentPasswordError when the current password does not match', async () => {
    const { hashPassword } = await import('../../auth/password.js')
    const realHash = await hashPassword('the-real-password')
    const repository = makeRepository({
      findById: vi.fn().mockResolvedValue(fakeUserWithRoles({ passwordHash: realHash })),
    })
    const service = new UsersService(repository)

    await expect(
      service.changeOwnPassword('user-1', 'session-1', {
        currentPassword: 'wrong-password',
        newPassword: 'brandnewpassword',
      }),
    ).rejects.toBeInstanceOf(InvalidCurrentPasswordError)
    expect(repository.updatePasswordHash).not.toHaveBeenCalled()
  })
})
