import { describe, expect, it, vi } from 'vitest'

import { LeadRateLimitedError } from './leads.errors.js'
import type { LeadsRepository } from './leads.repository.js'
import { LeadsService } from './leads.service.js'

function fakeLead(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'lead-1',
    name: 'Nguyễn Văn A',
    phone: '0901234567',
    email: null,
    businessModel: null,
    branches: null,
    need: null,
    message: null,
    status: 'new',
    ipHash: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    handledAt: null,
    handledBy: null,
    ...overrides,
  } as any
}

function makeRepository(overrides: Partial<Record<keyof LeadsRepository, unknown>> = {}) {
  const base = {
    findById: vi.fn().mockResolvedValue(fakeLead()),
    create: vi.fn().mockResolvedValue(fakeLead()),
    list: vi.fn().mockResolvedValue({ rows: [], total: 0, totalNew: 0 }),
    updateStatus: vi.fn().mockResolvedValue(fakeLead({ status: 'contacted' })),
    insertAuditLog: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
  return base as unknown as LeadsRepository
}

const validInput = {
  name: 'Nguyễn Văn A',
  phone: '0901234567',
  email: undefined,
  businessModel: undefined,
  branches: undefined,
  need: undefined,
  message: undefined,
  website: undefined,
} as any

describe('LeadsService.createFromPublicForm', () => {
  it('creates a lead with valid data and returns it', async () => {
    const repository = makeRepository()
    const service = new LeadsService(repository)

    const result = await service.createFromPublicForm(validInput, { ip: '1.2.3.4', ipHash: 'hash' })

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Nguyễn Văn A', phone: '0901234567', ipHash: 'hash' }),
    )
    expect(repository.insertAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ userId: null, action: 'lead.create' }),
    )
    expect(result.skipped).toBe(false)
    if (!result.skipped) expect(result.item.id).toBe('lead-1')
  })

  it('does not call repository.create when honeypot field is filled (bot)', async () => {
    const repository = makeRepository()
    const service = new LeadsService(repository)

    const result = await service.createFromPublicForm(
      { ...validInput, website: 'http://spam.example' },
      { ip: '1.2.3.5', ipHash: 'hash' },
    )

    expect(repository.create).not.toHaveBeenCalled()
    expect(repository.insertAuditLog).not.toHaveBeenCalled()
    expect(result.skipped).toBe(true)
  })

  it('blocks the 6th request from the same IP within the rate limit window', async () => {
    const repository = makeRepository()
    const service = new LeadsService(repository)

    for (let i = 0; i < 5; i += 1) {
      await service.createFromPublicForm(validInput, { ip: '9.9.9.9', ipHash: 'hash' })
    }

    await expect(service.createFromPublicForm(validInput, { ip: '9.9.9.9', ipHash: 'hash' })).rejects.toBeInstanceOf(
      LeadRateLimitedError,
    )
  })
})

describe('LeadsService.updateStatus', () => {
  it('sets handledBy/handledAt when transitioning out of "new"', async () => {
    const repository = makeRepository({
      findById: vi.fn().mockResolvedValue(fakeLead({ status: 'new' })),
      updateStatus: vi.fn().mockResolvedValue(fakeLead({ status: 'contacted', handledBy: 'user-42' })),
    })
    const service = new LeadsService(repository)

    await service.updateStatus('lead-1', 'contacted', 'user-42')

    expect(repository.updateStatus).toHaveBeenCalledWith(
      'lead-1',
      'contacted',
      expect.objectContaining({ handledBy: 'user-42' }),
    )
    expect(repository.insertAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-42', action: 'lead.status_update' }),
    )
  })
})
