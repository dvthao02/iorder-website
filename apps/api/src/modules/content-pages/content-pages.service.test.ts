import { describe, expect, it, vi } from 'vitest'

import { HookManager } from '../../shared/hooks/index.js'
import { ContentPageNotFoundError, ContentPageSlugExistsError } from './content-pages.errors.js'
import type { ContentPagesRepository } from './content-pages.repository.js'
import { ContentPagesService } from './content-pages.service.js'

function fakeContentPage(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'page-1',
    slug: 'ho-tro/faq',
    title: 'Câu hỏi thường gặp',
    lead: 'Tổng hợp câu hỏi phổ biến',
    body: '<h3>Câu hỏi</h3><p>Trả lời</p>',
    seoTitle: null,
    seoDescription: null,
    status: 'draft',
    publishedAt: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  } as any
}

function fakeInput(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    slug: 'ho-tro/faq',
    title: 'Câu hỏi thường gặp',
    lead: 'Tổng hợp câu hỏi phổ biến',
    body: '<h3>Câu hỏi</h3><p>Trả lời</p>',
    seoTitle: null,
    seoDescription: null,
    status: 'draft',
    ...overrides,
  } as any
}

function makeRepository(overrides: Partial<Record<keyof ContentPagesRepository, unknown>> = {}) {
  const base = {
    insertAuditLog: vi.fn().mockResolvedValue(undefined),
    findById: vi.fn(),
    findBySlug: vi.fn(),
    findPublishedBySlug: vi.fn(),
    slugExists: vi.fn().mockResolvedValue(false),
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    publish: vi.fn(),
    unpublish: vi.fn(),
    hardDelete: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
  return base as unknown as ContentPagesRepository
}

describe('ContentPagesService.create', () => {
  it('throws ContentPageSlugExistsError without creating when the slug is taken', async () => {
    const repository = makeRepository({ slugExists: vi.fn().mockResolvedValue(true) })
    const service = new ContentPagesService(repository, new HookManager())

    await expect(service.create(fakeInput(), 'editor-1')).rejects.toBeInstanceOf(ContentPageSlugExistsError)
    expect(repository.create).not.toHaveBeenCalled()
  })

  it('creates the content page, writes audit log, and emits content-pages:created', async () => {
    const created = fakeContentPage()
    const repository = makeRepository({ create: vi.fn().mockResolvedValue(created) })
    const hooks = new HookManager()
    const handler = vi.fn()
    hooks.register('content-pages:created', handler)
    const service = new ContentPagesService(repository, hooks)

    const result = await service.create(fakeInput(), 'editor-1')

    expect(result.statusCode).toBe(201)
    expect(repository.insertAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'content_page.create', entityId: created.id }),
    )
    expect(handler).toHaveBeenCalledWith({ contentPageId: created.id })
  })
})

describe('ContentPagesService.update', () => {
  it('throws ContentPageNotFoundError when the page does not exist', async () => {
    const repository = makeRepository({ findById: vi.fn().mockResolvedValue(null) })
    const service = new ContentPagesService(repository, new HookManager())

    await expect(service.update('missing', fakeInput(), 'editor-1')).rejects.toBeInstanceOf(ContentPageNotFoundError)
  })

  it('throws ContentPageSlugExistsError when the new slug collides with another page', async () => {
    const existing = fakeContentPage()
    const repository = makeRepository({
      findById: vi.fn().mockResolvedValue(existing),
      slugExists: vi.fn().mockResolvedValue(true),
    })
    const service = new ContentPagesService(repository, new HookManager())

    await expect(service.update(existing.id, fakeInput({ slug: 'khac' }), 'editor-1')).rejects.toBeInstanceOf(
      ContentPageSlugExistsError,
    )
  })

  it('does not check slug uniqueness when the slug is unchanged', async () => {
    const existing = fakeContentPage()
    const repository = makeRepository({
      findById: vi.fn().mockResolvedValue(existing),
      update: vi.fn().mockResolvedValue(existing),
    })
    const service = new ContentPagesService(repository, new HookManager())

    await service.update(existing.id, fakeInput({ slug: existing.slug }), 'editor-1')

    expect(repository.slugExists).not.toHaveBeenCalled()
  })

  it('writes an audit log with before/after data on success', async () => {
    const existing = fakeContentPage()
    const updated = fakeContentPage({ title: 'Updated title' })
    const repository = makeRepository({
      findById: vi.fn().mockResolvedValue(existing),
      update: vi.fn().mockResolvedValue(updated),
    })
    const service = new ContentPagesService(repository, new HookManager())

    await service.update(existing.id, fakeInput({ title: 'Updated title' }), 'editor-1')

    expect(repository.insertAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'content_page.update', entityId: existing.id }),
    )
  })
})

describe('ContentPagesService.publish', () => {
  it('throws ContentPageNotFoundError for an unknown id', async () => {
    const repository = makeRepository({ findById: vi.fn().mockResolvedValue(null) })
    const service = new ContentPagesService(repository, new HookManager())

    await expect(service.publish('missing', 'editor-1')).rejects.toBeInstanceOf(ContentPageNotFoundError)
  })

  it('preserves the existing publishedAt when republishing', async () => {
    const originalPublishedAt = new Date('2026-01-01T00:00:00Z')
    const existing = fakeContentPage({ status: 'published', publishedAt: originalPublishedAt })
    const repository = makeRepository({
      findById: vi.fn().mockResolvedValue(existing),
      publish: vi.fn().mockResolvedValue(existing),
    })
    const service = new ContentPagesService(repository, new HookManager())

    await service.publish(existing.id, 'editor-1')

    expect(repository.publish).toHaveBeenCalledWith(existing.id, originalPublishedAt)
  })

  it('emits content-pages:published and writes an audit log', async () => {
    const existing = fakeContentPage()
    const published = fakeContentPage({ status: 'published', publishedAt: new Date() })
    const repository = makeRepository({
      findById: vi.fn().mockResolvedValue(existing),
      publish: vi.fn().mockResolvedValue(published),
    })
    const hooks = new HookManager()
    const handler = vi.fn()
    hooks.register('content-pages:published', handler)
    const service = new ContentPagesService(repository, hooks)

    const result = await service.publish(existing.id, 'editor-1')

    expect(result.item.status).toBe('published')
    expect(repository.insertAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: 'content_page.publish' }))
    expect(handler).toHaveBeenCalledWith({ contentPageId: existing.id })
  })
})

describe('ContentPagesService.unpublish', () => {
  it('throws ContentPageNotFoundError for an unknown id', async () => {
    const repository = makeRepository({ findById: vi.fn().mockResolvedValue(null) })
    const service = new ContentPagesService(repository, new HookManager())

    await expect(service.unpublish('missing', 'editor-1')).rejects.toBeInstanceOf(ContentPageNotFoundError)
  })

  it('reverts a published page to draft and emits content-pages:unpublished', async () => {
    const existing = fakeContentPage({ status: 'published' })
    const draft = fakeContentPage({ status: 'draft' })
    const repository = makeRepository({
      findById: vi.fn().mockResolvedValue(existing),
      unpublish: vi.fn().mockResolvedValue(draft),
    })
    const hooks = new HookManager()
    const handler = vi.fn()
    hooks.register('content-pages:unpublished', handler)
    const service = new ContentPagesService(repository, hooks)

    const result = await service.unpublish(existing.id, 'editor-1')

    expect(result.item.status).toBe('draft')
    expect(repository.unpublish).toHaveBeenCalledWith(existing.id)
    expect(handler).toHaveBeenCalledWith({ contentPageId: existing.id })
  })
})

describe('ContentPagesService.delete', () => {
  it('throws ContentPageNotFoundError for an unknown id', async () => {
    const repository = makeRepository({ findById: vi.fn().mockResolvedValue(null) })
    const service = new ContentPagesService(repository, new HookManager())

    await expect(service.delete('missing', 'editor-1')).rejects.toBeInstanceOf(ContentPageNotFoundError)
  })

  it('writes an audit log with the full beforeData row, then hard-deletes and emits content-pages:deleted', async () => {
    const existing = fakeContentPage()
    const repository = makeRepository({ findById: vi.fn().mockResolvedValue(existing) })
    const hooks = new HookManager()
    const handler = vi.fn()
    hooks.register('content-pages:deleted', handler)
    const service = new ContentPagesService(repository, hooks)

    await service.delete(existing.id, 'editor-1')

    expect(repository.insertAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'content_page.delete',
        entityId: existing.id,
        beforeData: expect.objectContaining({ id: existing.id }),
      }),
    )
    expect(repository.hardDelete).toHaveBeenCalledWith(existing.id)
    expect(handler).toHaveBeenCalledWith({ contentPageId: existing.id })
  })
})

describe('ContentPagesService.getPublicBySlug', () => {
  it('throws ContentPageNotFoundError when no published page matches the slug', async () => {
    const repository = makeRepository({ findPublishedBySlug: vi.fn().mockResolvedValue(null) })
    const service = new ContentPagesService(repository, new HookManager())

    await expect(service.getPublicBySlug('ho-tro/faq')).rejects.toBeInstanceOf(ContentPageNotFoundError)
  })

  it('returns the serialized page when found', async () => {
    const page = fakeContentPage({ status: 'published' })
    const repository = makeRepository({ findPublishedBySlug: vi.fn().mockResolvedValue(page) })
    const service = new ContentPagesService(repository, new HookManager())

    const result = await service.getPublicBySlug('ho-tro/faq')

    expect(result.item.slug).toBe('ho-tro/faq')
  })
})
