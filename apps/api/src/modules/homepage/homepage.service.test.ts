import { describe, expect, it, vi } from 'vitest'

import { HookManager } from '../../shared/hooks/index.js'
import {
  ContentConflictError,
  HomepageDraftRequiredError,
  HomepageNotFoundError,
  MediaReferenceNotFoundError,
  RevisionIncompatibleError,
} from './homepage.errors.js'
import type { HomepageRepository } from './homepage.repository.js'
import { HomepageService } from './homepage.service.js'

function fakePage(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'page-1',
    title: 'Trang chủ',
    slug: 'home',
    template: 'home',
    status: 'draft',
    draftVersion: 1,
    seoTitle: null,
    seoDescription: null,
    canonicalUrl: null,
    scheduledAt: null,
    publishedAt: null,
    deletedAt: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  } as any
}

function fakeBlock(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'block-1',
    pageId: 'page-1',
    type: 'home_hero',
    sortOrder: 0,
    data: { title: 'Hero' },
    appearance: {},
    isEnabled: true,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  } as any
}

function makeRepository(overrides: Partial<Record<keyof HomepageRepository, unknown>> = {}) {
  const base = {
    mediaReferencesExist: vi.fn().mockResolvedValue(true),
    findAssetsByIds: vi.fn().mockResolvedValue([]),
    findBySlug: vi.fn(),
    addRevision: vi.fn().mockResolvedValue({ id: 'revision-1' }),
    save: vi.fn(),
    publish: vi.fn(),
    markDraft: vi.fn(),
    insertAuditLog: vi.fn().mockResolvedValue(undefined),
    listRevisions: vi.fn().mockResolvedValue([]),
    findRevisionByVersion: vi.fn(),
    findLatestPublishedSnapshot: vi.fn(),
    ...overrides,
  }
  return base as unknown as HomepageRepository
}

describe('HomepageService.autosave', () => {
  it('throws MediaReferenceNotFoundError when a referenced media id does not exist, without calling save', async () => {
    const repository = makeRepository({ mediaReferencesExist: vi.fn().mockResolvedValue(false) })
    const service = new HomepageService(repository, new HookManager())

    await expect(service.autosave({ blocks: [] } as any, 1)).rejects.toBeInstanceOf(MediaReferenceNotFoundError)
    expect(repository.save).not.toHaveBeenCalled()
  })

  it('throws ContentConflictError with the current draftVersion when save reports a version conflict', async () => {
    const currentPage = fakePage({ draftVersion: 5 })
    const repository = makeRepository({
      save: vi.fn().mockResolvedValue({ conflict: true, current: { page: currentPage, blocks: [] } }),
    })
    const service = new HomepageService(repository, new HookManager())

    const error = await service.autosave({ blocks: [] } as any, 1).catch((e) => e)
    expect(error).toBeInstanceOf(ContentConflictError)
    expect((error as ContentConflictError).currentVersion).toBe(5)
  })

  it('emits homepage:autosaved and returns the serialized item on success', async () => {
    const page = fakePage({ draftVersion: 2 })
    const repository = makeRepository({
      save: vi.fn().mockResolvedValue({ conflict: false, current: { page, blocks: [fakeBlock()] } }),
    })
    const hooks = new HookManager()
    const handler = vi.fn()
    hooks.register('homepage:autosaved', handler)
    const service = new HomepageService(repository, hooks)

    const result = await service.autosave({ blocks: [] } as any, 1)

    expect(result.item.draftVersion).toBe(2)
    expect(handler).toHaveBeenCalledWith({ pageId: page.id, version: 2 })
  })
})

describe('HomepageService.publish', () => {
  it('throws HomepageDraftRequiredError when there are no blocks to publish', async () => {
    const repository = makeRepository({
      findBySlug: vi.fn().mockResolvedValue({ page: fakePage(), blocks: [] }),
    })
    const service = new HomepageService(repository, new HookManager())

    await expect(service.publish(null, 'editor-1')).rejects.toBeInstanceOf(HomepageDraftRequiredError)
  })

  it('throws ContentConflictError when baseVersion does not match the stored draftVersion', async () => {
    const repository = makeRepository({
      findBySlug: vi.fn().mockResolvedValue({ page: fakePage({ draftVersion: 3 }), blocks: [fakeBlock()] }),
    })
    const service = new HomepageService(repository, new HookManager())

    await expect(service.publish(1, 'editor-1')).rejects.toBeInstanceOf(ContentConflictError)
  })

  it('throws MediaReferenceNotFoundError before publishing when media is missing', async () => {
    const repository = makeRepository({
      findBySlug: vi.fn().mockResolvedValue({ page: fakePage({ draftVersion: 1 }), blocks: [fakeBlock()] }),
      mediaReferencesExist: vi.fn().mockResolvedValue(false),
    })
    const service = new HomepageService(repository, new HookManager())

    await expect(service.publish(1, 'editor-1')).rejects.toBeInstanceOf(MediaReferenceNotFoundError)
    expect(repository.publish).not.toHaveBeenCalled()
  })

  it('publishes and emits homepage:published on success', async () => {
    const draftPage = fakePage({ draftVersion: 1 })
    const publishedPage = fakePage({ draftVersion: 1, status: 'published' })
    const repository = makeRepository({
      findBySlug: vi.fn().mockResolvedValue({ page: draftPage, blocks: [fakeBlock()] }),
      publish: vi.fn().mockResolvedValue(publishedPage),
    })
    const hooks = new HookManager()
    const handler = vi.fn()
    hooks.register('homepage:published', handler)
    const service = new HomepageService(repository, hooks)

    const result = await service.publish(1, 'editor-1')

    expect(result.item.status).toBe('published')
    expect(handler).toHaveBeenCalledWith({
      pageId: publishedPage.id,
      version: publishedPage.draftVersion,
      editorId: 'editor-1',
    })
  })
})

describe('HomepageService.restoreRevision', () => {
  it('throws HomepageNotFoundError when the homepage does not exist', async () => {
    const repository = makeRepository({ findBySlug: vi.fn().mockResolvedValue(null) })
    const service = new HomepageService(repository, new HookManager())

    await expect(service.restoreRevision(1, 1, 'editor-1')).rejects.toBeInstanceOf(HomepageNotFoundError)
  })

  it('throws ContentConflictError when baseVersion is stale', async () => {
    const repository = makeRepository({
      findBySlug: vi.fn().mockResolvedValue({ page: fakePage({ draftVersion: 4 }), blocks: [] }),
    })
    const service = new HomepageService(repository, new HookManager())

    await expect(service.restoreRevision(1, 1, 'editor-1')).rejects.toBeInstanceOf(ContentConflictError)
  })

  it('throws RevisionIncompatibleError when the stored snapshot no longer matches the schema', async () => {
    const repository = makeRepository({
      findBySlug: vi.fn().mockResolvedValue({ page: fakePage({ draftVersion: 1 }), blocks: [] }),
      findRevisionByVersion: vi.fn().mockResolvedValue({ snapshot: { garbage: true } }),
    })
    const service = new HomepageService(repository, new HookManager())

    await expect(service.restoreRevision(1, 1, 'editor-1')).rejects.toBeInstanceOf(RevisionIncompatibleError)
  })
})
