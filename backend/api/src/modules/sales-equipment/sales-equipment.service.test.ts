import { describe, expect, it, vi } from 'vitest'

import { HookManager } from '../../shared/hooks/index.js'
import { SalesEquipmentNotFoundError, SalesEquipmentSlugExistsError } from './sales-equipment.errors.js'
import type { SalesEquipmentRepository } from './sales-equipment.repository.js'
import { SalesEquipmentService } from './sales-equipment.service.js'

const input = {
  category: 'pos',
  name: 'Máy POS iOrder IOD86',
  slug: 'may-pos-iod86',
  modelCode: 'IOD86',
  coverMediaId: null,
  priceVnd: 6_990_000,
  warrantyMonths: 12,
  summary: null,
  specificationGroups: [],
  sortOrder: 0,
  isFeatured: true,
  seoTitle: null,
  seoDescription: null,
  canonicalUrl: null,
} as const

function record(overrides: Record<string, unknown> = {}) {
  return {
    id: 'equipment-1',
    ...input,
    status: 'draft',
    draftVersion: 0,
    publishedAt: null,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as any
}

function repository(overrides: Partial<Record<keyof SalesEquipmentRepository, unknown>> = {}) {
  return {
    coverExists: vi.fn().mockResolvedValue(true),
    resolveCoverUrl: vi.fn().mockResolvedValue(null),
    slugExists: vi.fn().mockResolvedValue(false),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    setStatus: vi.fn(),
    softDelete: vi.fn(),
    createRevision: vi.fn(),
    insertAuditLog: vi.fn(),
    list: vi.fn(),
    listPublic: vi.fn(),
    listRevisions: vi.fn(),
    findRevision: vi.fn(),
    restore: vi.fn(),
    ...overrides,
  } as unknown as SalesEquipmentRepository
}

describe('SalesEquipmentService', () => {
  it('rejects duplicate slugs before creating equipment', async () => {
    const repo = repository({ slugExists: vi.fn().mockResolvedValue(true) })
    const service = new SalesEquipmentService(repo, new HookManager())
    await expect(service.create(input as any, 'editor-1')).rejects.toBeInstanceOf(SalesEquipmentSlugExistsError)
    expect(repo.create).not.toHaveBeenCalled()
  })

  it('creates a draft, revision and audit record', async () => {
    const created = record()
    const repo = repository({ create: vi.fn().mockResolvedValue(created) })
    const hooks = new HookManager()
    const listener = vi.fn()
    hooks.register('sales-equipment:created', listener)
    const result = await new SalesEquipmentService(repo, hooks).create(input as any, 'editor-1')
    expect(result.statusCode).toBe(201)
    expect(repo.createRevision).toHaveBeenCalledWith(created, 'editor-1', 'Created')
    expect(listener).toHaveBeenCalledWith({ salesEquipmentId: created.id })
  })

  it('does not update an unknown equipment entry', async () => {
    const repo = repository({ findById: vi.fn().mockResolvedValue(null) })
    await expect(
      new SalesEquipmentService(repo, new HookManager()).update('missing', input as any, 'editor-1'),
    ).rejects.toBeInstanceOf(SalesEquipmentNotFoundError)
  })
})
