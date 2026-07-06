import { describe, expect, it, vi } from 'vitest'

import { HookManager } from '../../shared/hooks/index.js'
import { OfferingCoverNotFoundError, OfferingNotFoundError, OfferingSlugExistsError } from './offerings.errors.js'
import type { OfferingsRepository } from './offerings.repository.js'
import { OfferingsService } from './offerings.service.js'

function fakeOffering(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'offering-1',
    coverMediaId: null,
    type: 'software',
    title: 'Phần mềm mẫu',
    slug: 'phan-mem-mau',
    summary: null,
    contentJson: { description: 'Mô tả', tags: [], metrics: [], features: [], benefits: [], faq: [], items: [] },
    icon: null,
    status: 'draft',
    sortOrder: 0,
    isFeatured: false,
    seoTitle: null,
    seoDescription: null,
    canonicalUrl: null,
    publishedAt: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  } as any
}

function fakeInput(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    type: 'software',
    title: 'Phần mềm mẫu',
    slug: 'phan-mem-mau',
    summary: null,
    icon: null,
    coverMediaId: null,
    sortOrder: 0,
    isFeatured: false,
    seoTitle: null,
    seoDescription: null,
    canonicalUrl: null,
    contentJson: { description: 'Mô tả', tags: [], metrics: [], features: [], benefits: [], faq: [], items: [] },
    ...overrides,
  } as any
}

function makeRepository(overrides: Partial<Record<keyof OfferingsRepository, unknown>> = {}) {
  const base = {
    resolveMediaUrl: vi.fn().mockResolvedValue(null),
    coverExists: vi.fn().mockResolvedValue(true),
    slugExistsForType: vi.fn().mockResolvedValue(false),
    createRevision: vi.fn().mockResolvedValue(undefined),
    insertAuditLog: vi.fn().mockResolvedValue(undefined),
    findById: vi.fn(),
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    publish: vi.fn(),
    archive: vi.fn(),
    unpublish: vi.fn(),
    softDelete: vi.fn().mockResolvedValue(undefined),
    listPublic: vi.fn(),
    findPublicByTypeAndSlug: vi.fn(),
    ...overrides,
  }
  return base as unknown as OfferingsRepository
}

describe('OfferingsService.create', () => {
  it('throws OfferingSlugExistsError without creating when the slug is taken for that type', async () => {
    const repository = makeRepository({ slugExistsForType: vi.fn().mockResolvedValue(true) })
    const service = new OfferingsService(repository, new HookManager())

    await expect(service.create(fakeInput(), 'editor-1')).rejects.toBeInstanceOf(OfferingSlugExistsError)
    expect(repository.create).not.toHaveBeenCalled()
  })

  it('throws OfferingCoverNotFoundError when the cover media does not exist', async () => {
    const repository = makeRepository({ coverExists: vi.fn().mockResolvedValue(false) })
    const service = new OfferingsService(repository, new HookManager())

    await expect(service.create(fakeInput({ coverMediaId: 'missing' }), 'editor-1')).rejects.toBeInstanceOf(
      OfferingCoverNotFoundError,
    )
  })

  it('creates the offering and emits offerings:created', async () => {
    const created = fakeOffering()
    const repository = makeRepository({ create: vi.fn().mockResolvedValue(created) })
    const hooks = new HookManager()
    const handler = vi.fn()
    hooks.register('offerings:created', handler)
    const service = new OfferingsService(repository, hooks)

    const result = await service.create(fakeInput(), 'editor-1')

    expect(result.statusCode).toBe(201)
    expect(handler).toHaveBeenCalledWith({ offeringId: created.id })
  })
})

describe('OfferingsService.update', () => {
  it('throws OfferingNotFoundError when the offering does not exist', async () => {
    const repository = makeRepository({ findById: vi.fn().mockResolvedValue(null) })
    const service = new OfferingsService(repository, new HookManager())

    await expect(service.update('missing', fakeInput(), 'editor-1')).rejects.toBeInstanceOf(OfferingNotFoundError)
  })

  it('throws OfferingSlugExistsError when the new slug collides within the same type', async () => {
    const existing = fakeOffering()
    const repository = makeRepository({
      findById: vi.fn().mockResolvedValue(existing),
      slugExistsForType: vi.fn().mockResolvedValue(true),
    })
    const service = new OfferingsService(repository, new HookManager())

    await expect(service.update(existing.id, fakeInput({ slug: 'khac' }), 'editor-1')).rejects.toBeInstanceOf(
      OfferingSlugExistsError,
    )
  })

  it('does not check slug uniqueness when the slug is unchanged', async () => {
    const existing = fakeOffering()
    const repository = makeRepository({
      findById: vi.fn().mockResolvedValue(existing),
      update: vi.fn().mockResolvedValue(existing),
    })
    const service = new OfferingsService(repository, new HookManager())

    await service.update(existing.id, fakeInput({ slug: existing.slug }), 'editor-1')

    expect(repository.slugExistsForType).not.toHaveBeenCalled()
  })
})

describe('OfferingsService.publish', () => {
  it('throws OfferingNotFoundError for an unknown id', async () => {
    const repository = makeRepository({ findById: vi.fn().mockResolvedValue(null) })
    const service = new OfferingsService(repository, new HookManager())

    await expect(service.publish('missing', 'editor-1')).rejects.toBeInstanceOf(OfferingNotFoundError)
  })

  it('preserves the existing publishedAt when republishing', async () => {
    const originalPublishedAt = new Date('2026-01-01T00:00:00Z')
    const existing = fakeOffering({ status: 'published', publishedAt: originalPublishedAt })
    const repository = makeRepository({
      findById: vi.fn().mockResolvedValue(existing),
      publish: vi.fn().mockResolvedValue(existing),
    })
    const service = new OfferingsService(repository, new HookManager())

    await service.publish(existing.id, 'editor-1')

    expect(repository.publish).toHaveBeenCalledWith(existing.id, originalPublishedAt)
  })
})

describe('OfferingsService.unpublish', () => {
  it('throws OfferingNotFoundError for an unknown id', async () => {
    const repository = makeRepository({ findById: vi.fn().mockResolvedValue(null) })
    const service = new OfferingsService(repository, new HookManager())

    await expect(service.unpublish('missing', 'editor-1')).rejects.toBeInstanceOf(OfferingNotFoundError)
  })

  it('reverts a published offering to draft and emits offerings:unpublished', async () => {
    const existing = fakeOffering({ status: 'published' })
    const draft = fakeOffering({ status: 'draft' })
    const repository = makeRepository({
      findById: vi.fn().mockResolvedValue(existing),
      unpublish: vi.fn().mockResolvedValue(draft),
    })
    const hooks = new HookManager()
    const handler = vi.fn()
    hooks.register('offerings:unpublished', handler)
    const service = new OfferingsService(repository, hooks)

    const result = await service.unpublish(existing.id, 'editor-1')

    expect(result.item.status).toBe('draft')
    expect(repository.unpublish).toHaveBeenCalledWith(existing.id)
    expect(handler).toHaveBeenCalledWith({ offeringId: existing.id })
  })
})

describe('OfferingsService.delete', () => {
  it('throws OfferingNotFoundError for an unknown id', async () => {
    const repository = makeRepository({ findById: vi.fn().mockResolvedValue(null) })
    const service = new OfferingsService(repository, new HookManager())

    await expect(service.delete('missing', 'editor-1')).rejects.toBeInstanceOf(OfferingNotFoundError)
  })

  it('soft-deletes and emits offerings:deleted on success', async () => {
    const existing = fakeOffering()
    const repository = makeRepository({ findById: vi.fn().mockResolvedValue(existing) })
    const hooks = new HookManager()
    const handler = vi.fn()
    hooks.register('offerings:deleted', handler)
    const service = new OfferingsService(repository, hooks)

    await service.delete(existing.id, 'editor-1')

    expect(repository.softDelete).toHaveBeenCalledWith(existing.id)
    expect(handler).toHaveBeenCalledWith({ offeringId: existing.id })
  })
})
