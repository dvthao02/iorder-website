import { describe, expect, it, vi } from 'vitest'

import { PartnerLogoNotFoundError, PartnerNotFoundError } from './partners.errors.js'
import type { PartnersRepository } from './partners.repository.js'
import { PartnersService } from './partners.service.js'

const partner = {
  id: '00000000-0000-4000-8000-000000000030',
  name: 'Công ty ABC',
  kind: 'partner' as const,
  description: null,
  websiteUrl: 'https://example.com',
  logoMediaId: '00000000-0000-4000-8000-000000000031',
  sortOrder: 0,
  isEnabled: true,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
}
const input = {
  name: partner.name,
  kind: partner.kind,
  description: partner.description,
  websiteUrl: partner.websiteUrl,
  logoMediaId: partner.logoMediaId,
  sortOrder: partner.sortOrder,
  isEnabled: partner.isEnabled,
}

function makeRepository(overrides: Record<string, unknown> = {}) {
  return {
    logoExists: vi.fn().mockResolvedValue(true),
    create: vi.fn().mockResolvedValue(partner),
    findById: vi.fn().mockResolvedValue({ partner, logoUrl: 'https://cdn.example/logo.png' }),
    update: vi.fn(),
    delete: vi.fn().mockResolvedValue(undefined),
    insertAuditLog: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}

describe('PartnersService mutations', () => {
  it('does not create a partner with an unavailable logo', async () => {
    const repository = makeRepository({ logoExists: vi.fn().mockResolvedValue(false) })
    const service = new PartnersService(repository as unknown as PartnersRepository)

    await expect(service.create(input, 'editor-1')).rejects.toBeInstanceOf(PartnerLogoNotFoundError)
    expect(repository.create).not.toHaveBeenCalled()
  })

  it('writes an audit record when a partner is created', async () => {
    const repository = makeRepository()
    const service = new PartnersService(repository as unknown as PartnersRepository)

    const result = await service.create(input, 'editor-1')

    expect(result.statusCode).toBe(201)
    expect(repository.insertAuditLog).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'editor-1', action: 'partner.create', entityId: partner.id,
    }))
  })

  it('does not delete a partner that cannot be found', async () => {
    const repository = makeRepository({ findById: vi.fn().mockResolvedValue(null) })
    const service = new PartnersService(repository as unknown as PartnersRepository)

    await expect(service.delete(partner.id, 'editor-1')).rejects.toBeInstanceOf(PartnerNotFoundError)
    expect(repository.delete).not.toHaveBeenCalled()
  })
})
