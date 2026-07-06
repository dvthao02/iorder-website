import { describe, expect, it, vi } from 'vitest'

import { HookManager } from '../../shared/hooks/index.js'
import {
  CoverMediaNotFoundError,
  PostNotFoundError,
  RevisionIncompatibleError,
  RevisionNotFoundError,
  SlugExistsError,
} from './posts.errors.js'
import type { PostsRepository } from './posts.repository.js'
import { PostsService } from './posts.service.js'

function fakePost(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'post-1',
    authorId: 'author-1',
    coverMediaId: null,
    type: 'news',
    title: 'Bài viết mẫu',
    slug: 'bai-viet-mau',
    excerpt: null,
    contentJson: { body: '<p>Nội dung</p>', category: null, checklist: [] },
    status: 'draft',
    viewCount: 0,
    seoTitle: null,
    seoDescription: null,
    canonicalUrl: null,
    promotionStartAt: null,
    promotionEndAt: null,
    ctaLabel: null,
    ctaUrl: null,
    badgeText: null,
    publishedAt: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  } as any
}

function fakeInput(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    type: 'news',
    title: 'Bài viết mẫu',
    slug: 'bai-viet-mau',
    excerpt: null,
    body: '<p>Nội dung</p>',
    category: null,
    checklist: [],
    coverMediaId: null,
    seoTitle: null,
    seoDescription: null,
    canonicalUrl: null,
    promotionStartAt: null,
    promotionEndAt: null,
    ctaLabel: null,
    ctaUrl: null,
    badgeText: null,
    categoryIds: [],
    tags: [],
    ...overrides,
  } as any
}

function makeRepository(overrides: Partial<Record<keyof PostsRepository, unknown>> = {}) {
  const base = {
    loadTaxonomy: vi.fn().mockResolvedValue(new Map()),
    taxonomyFor: vi.fn().mockResolvedValue({ categories: [], tags: [] }),
    syncCategories: vi.fn().mockResolvedValue(undefined),
    syncTags: vi.fn().mockResolvedValue(undefined),
    coverExists: vi.fn().mockResolvedValue(true),
    slugExists: vi.fn().mockResolvedValue(false),
    createRevision: vi.fn().mockResolvedValue(undefined),
    insertAuditLog: vi.fn().mockResolvedValue(undefined),
    findById: vi.fn(),
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    setStatus: vi.fn(),
    incrementViewCount: vi.fn().mockResolvedValue(undefined),
    listPublic: vi.fn(),
    findPublicBySlug: vi.fn(),
    findDueScheduled: vi.fn().mockResolvedValue([]),
    listRevisions: vi.fn().mockResolvedValue([]),
    findRevisionByVersion: vi.fn(),
    ...overrides,
  }
  return base as unknown as PostsRepository
}

describe('PostsService.create', () => {
  it('throws SlugExistsError without creating the post when the slug is taken', async () => {
    const repository = makeRepository({ slugExists: vi.fn().mockResolvedValue(true) })
    const service = new PostsService(repository, new HookManager())

    await expect(service.create(fakeInput(), 'author-1')).rejects.toBeInstanceOf(SlugExistsError)
    expect(repository.create).not.toHaveBeenCalled()
  })

  it('throws CoverMediaNotFoundError when the referenced cover media does not exist', async () => {
    const repository = makeRepository({ coverExists: vi.fn().mockResolvedValue(false) })
    const service = new PostsService(repository, new HookManager())

    await expect(service.create(fakeInput({ coverMediaId: 'missing-media' }), 'author-1')).rejects.toBeInstanceOf(
      CoverMediaNotFoundError,
    )
  })

  it('creates the post, syncs taxonomy, records a revision, and emits posts:created', async () => {
    const created = fakePost()
    const repository = makeRepository({
      create: vi.fn().mockResolvedValue(created),
      findById: vi.fn().mockResolvedValue({ post: created, coverUrl: null }),
    })
    const hooks = new HookManager()
    const handler = vi.fn()
    hooks.register('posts:created', handler)
    const service = new PostsService(repository, hooks)

    const result = await service.create(fakeInput(), 'author-1')

    expect(result.statusCode).toBe(201)
    expect(repository.syncCategories).toHaveBeenCalledWith(created.id, [])
    expect(repository.syncTags).toHaveBeenCalledWith(created.id, [])
    expect(repository.createRevision).toHaveBeenCalled()
    expect(handler).toHaveBeenCalledWith({ postId: created.id })
  })
})

describe('PostsService.update', () => {
  it('throws PostNotFoundError when the post does not exist', async () => {
    const repository = makeRepository({ findById: vi.fn().mockResolvedValue(null) })
    const service = new PostsService(repository, new HookManager())

    await expect(service.update('missing', fakeInput(), 'editor-1')).rejects.toBeInstanceOf(PostNotFoundError)
  })

  it('throws SlugExistsError when another post already owns the new slug', async () => {
    const existing = fakePost()
    const repository = makeRepository({
      findById: vi.fn().mockResolvedValue({ post: existing, coverUrl: null }),
      slugExists: vi.fn().mockResolvedValue(true),
    })
    const service = new PostsService(repository, new HookManager())

    await expect(service.update(existing.id, fakeInput({ slug: 'khac' }), 'editor-1')).rejects.toBeInstanceOf(
      SlugExistsError,
    )
  })
})

describe('PostsService.publish / archive', () => {
  it('publish throws PostNotFoundError for an unknown id', async () => {
    const repository = makeRepository({ findById: vi.fn().mockResolvedValue(null) })
    const service = new PostsService(repository, new HookManager())

    await expect(service.publish('missing', 'editor-1')).rejects.toBeInstanceOf(PostNotFoundError)
  })

  it('archive emits posts:archived on success', async () => {
    const existing = fakePost({ status: 'published' })
    const archived = fakePost({ status: 'archived' })
    const repository = makeRepository({
      findById: vi.fn().mockResolvedValue({ post: existing, coverUrl: null }),
      setStatus: vi.fn().mockResolvedValue(archived),
    })
    const hooks = new HookManager()
    const handler = vi.fn()
    hooks.register('posts:archived', handler)
    const service = new PostsService(repository, hooks)

    const result = await service.archive(existing.id, 'editor-1')

    expect(result.item.status).toBe('archived')
    expect(handler).toHaveBeenCalledWith({ postId: archived.id })
  })
})

describe('PostsService.unpublish', () => {
  it('throws PostNotFoundError for an unknown id', async () => {
    const repository = makeRepository({ findById: vi.fn().mockResolvedValue(null) })
    const service = new PostsService(repository, new HookManager())

    await expect(service.unpublish('missing', 'editor-1')).rejects.toBeInstanceOf(PostNotFoundError)
  })

  it('reverts a published post to draft and emits posts:unpublished', async () => {
    const existing = fakePost({ status: 'published' })
    const draft = fakePost({ status: 'draft' })
    const repository = makeRepository({
      findById: vi.fn().mockResolvedValue({ post: existing, coverUrl: null }),
      setStatus: vi.fn().mockResolvedValue(draft),
    })
    const hooks = new HookManager()
    const handler = vi.fn()
    hooks.register('posts:unpublished', handler)
    const service = new PostsService(repository, hooks)

    const result = await service.unpublish(existing.id, 'editor-1')

    expect(result.item.status).toBe('draft')
    expect(repository.setStatus).toHaveBeenCalledWith(existing.id, 'draft')
    expect(repository.insertAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'post.unpublish', entityId: draft.id }),
    )
    expect(handler).toHaveBeenCalledWith({ postId: draft.id })
  })
})

describe('PostsService.listRevisions / getRevision', () => {
  it('listRevisions throws PostNotFoundError for an unknown id', async () => {
    const repository = makeRepository({ findById: vi.fn().mockResolvedValue(null) })
    const service = new PostsService(repository, new HookManager())

    await expect(service.listRevisions('missing')).rejects.toBeInstanceOf(PostNotFoundError)
  })

  it('listRevisions returns the repository summary list', async () => {
    const existing = fakePost()
    const summaries = [
      { version: 1, changeNote: 'Created draft', editorName: 'Admin', createdAt: '2026-01-01T00:00:00.000Z' },
    ]
    const repository = makeRepository({
      findById: vi.fn().mockResolvedValue({ post: existing, coverUrl: null }),
      listRevisions: vi.fn().mockResolvedValue(summaries),
    })
    const service = new PostsService(repository, new HookManager())

    const result = await service.listRevisions(existing.id)

    expect(result.items).toEqual(summaries)
  })

  it('getRevision throws RevisionNotFoundError when the version does not exist', async () => {
    const existing = fakePost()
    const repository = makeRepository({
      findById: vi.fn().mockResolvedValue({ post: existing, coverUrl: null }),
      findRevisionByVersion: vi.fn().mockResolvedValue(null),
    })
    const service = new PostsService(repository, new HookManager())

    await expect(service.getRevision(existing.id, 99)).rejects.toBeInstanceOf(RevisionNotFoundError)
  })
})

describe('PostsService.restoreRevision', () => {
  it('throws PostNotFoundError when the post does not exist', async () => {
    const repository = makeRepository({ findById: vi.fn().mockResolvedValue(null) })
    const service = new PostsService(repository, new HookManager())

    await expect(service.restoreRevision('missing', 1, 'editor-1')).rejects.toBeInstanceOf(PostNotFoundError)
  })

  it('throws RevisionNotFoundError when the version does not exist', async () => {
    const existing = fakePost()
    const repository = makeRepository({
      findById: vi.fn().mockResolvedValue({ post: existing, coverUrl: null }),
      findRevisionByVersion: vi.fn().mockResolvedValue(null),
    })
    const service = new PostsService(repository, new HookManager())

    await expect(service.restoreRevision(existing.id, 1, 'editor-1')).rejects.toBeInstanceOf(RevisionNotFoundError)
  })

  it('throws RevisionIncompatibleError when the stored snapshot no longer matches the schema', async () => {
    const existing = fakePost()
    const repository = makeRepository({
      findById: vi.fn().mockResolvedValue({ post: existing, coverUrl: null }),
      findRevisionByVersion: vi.fn().mockResolvedValue({
        version: 1,
        changeNote: null,
        editorName: null,
        createdAt: '2026-01-01T00:00:00.000Z',
        snapshot: { garbage: true },
      }),
    })
    const service = new PostsService(repository, new HookManager())

    await expect(service.restoreRevision(existing.id, 1, 'editor-1')).rejects.toBeInstanceOf(RevisionIncompatibleError)
  })

  it('restores a valid snapshot as a draft, creates a revision, and emits posts:restored', async () => {
    // id phải là UUID thật: postResponseSchema dùng contentIdSchema (z.string().uuid())
    // để validate snapshot — id kiểu 'post-1' sẽ bị RevisionIncompatibleError.
    const uuid = '6f1e8a52-3c9d-4b7e-9a10-2d5c8e4f7b31'
    const existing = fakePost({ id: uuid, status: 'published' })
    const updated = fakePost({ id: uuid, status: 'published' })
    const draft = fakePost({ id: uuid, status: 'draft' })
    const snapshot = {
      id: existing.id,
      type: 'news',
      title: 'Tiêu đề cũ',
      slug: existing.slug,
      excerpt: null,
      body: '<p>Nội dung cũ</p>',
      category: null,
      checklist: [],
      status: 'draft',
      coverMediaId: null,
      coverUrl: null,
      seoTitle: null,
      seoDescription: null,
      canonicalUrl: null,
      promotionStartAt: null,
      promotionEndAt: null,
      scheduledAt: null,
      authorId: null,
      authorName: null,
      ctaLabel: null,
      ctaUrl: null,
      badgeText: null,
      viewCount: 0,
      categories: [],
      tags: [],
      publishedAt: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    }
    const repository = makeRepository({
      findById: vi.fn().mockResolvedValue({ post: existing, coverUrl: null }),
      findRevisionByVersion: vi.fn().mockResolvedValue({
        version: 1,
        changeNote: 'Created draft',
        editorName: 'Admin',
        createdAt: '2026-01-01T00:00:00.000Z',
        snapshot,
      }),
      update: vi.fn().mockResolvedValue(updated),
      setStatus: vi.fn().mockResolvedValue(draft),
    })
    const hooks = new HookManager()
    const handler = vi.fn()
    hooks.register('posts:restored', handler)
    const service = new PostsService(repository, hooks)

    const result = await service.restoreRevision(existing.id, 1, 'editor-1')

    expect(result.item.status).toBe('draft')
    expect(repository.setStatus).toHaveBeenCalledWith(updated.id, 'draft')
    expect(repository.createRevision).toHaveBeenCalledWith(draft, 'editor-1', 'Khôi phục phiên bản 1')
    expect(repository.insertAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'post.restore', entityId: draft.id }),
    )
    expect(handler).toHaveBeenCalledWith({ postId: draft.id })
  })
})

describe('PostsService.publishDueScheduled', () => {
  it('publishes each due post, records an audit log, and emits posts:published', async () => {
    const due1 = fakePost({ id: 'post-1', status: 'draft' })
    const due2 = fakePost({ id: 'post-2', status: 'draft' })
    const published1 = fakePost({ id: 'post-1', status: 'published' })
    const published2 = fakePost({ id: 'post-2', status: 'published' })

    const repository = makeRepository({
      findDueScheduled: vi.fn().mockResolvedValue([due1, due2]),
      setStatus: vi.fn().mockResolvedValueOnce(published1).mockResolvedValueOnce(published2),
    })
    const hooks = new HookManager()
    const handler = vi.fn()
    hooks.register('posts:published', handler)
    const service = new PostsService(repository, hooks)

    const result = await service.publishDueScheduled()

    expect(result.count).toBe(2)
    expect(result.published.map((item) => item.id)).toEqual(['post-1', 'post-2'])
    expect(repository.setStatus).toHaveBeenCalledWith('post-1', 'published')
    expect(repository.setStatus).toHaveBeenCalledWith('post-2', 'published')
    expect(repository.insertAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'post.publish.scheduled', entityId: 'post-1' }),
    )
    expect(repository.insertAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'post.publish.scheduled', entityId: 'post-2' }),
    )
    expect(handler).toHaveBeenCalledWith({ postId: 'post-1' })
    expect(handler).toHaveBeenCalledWith({ postId: 'post-2' })
  })

  it('does nothing when no post is due', async () => {
    const repository = makeRepository({ findDueScheduled: vi.fn().mockResolvedValue([]) })
    const hooks = new HookManager()
    const handler = vi.fn()
    hooks.register('posts:published', handler)
    const service = new PostsService(repository, hooks)

    const result = await service.publishDueScheduled()

    expect(result.count).toBe(0)
    expect(result.published).toEqual([])
    expect(repository.setStatus).not.toHaveBeenCalled()
    expect(handler).not.toHaveBeenCalled()
  })

  it('continues publishing remaining posts when one fails', async () => {
    const due1 = fakePost({ id: 'post-1', status: 'draft' })
    const due2 = fakePost({ id: 'post-2', status: 'draft' })
    const published2 = fakePost({ id: 'post-2', status: 'published' })

    const repository = makeRepository({
      findDueScheduled: vi.fn().mockResolvedValue([due1, due2]),
      setStatus: vi.fn().mockRejectedValueOnce(new Error('db error')).mockResolvedValueOnce(published2),
    })
    const hooks = new HookManager()
    const handler = vi.fn()
    hooks.register('posts:published', handler)
    const service = new PostsService(repository, hooks)
    const logger = { error: vi.fn() }

    const result = await service.publishDueScheduled(logger)

    expect(result.count).toBe(1)
    expect(result.published[0]?.id).toBe('post-2')
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ postId: 'post-1' }),
      'Failed to auto-publish scheduled post',
    )
    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith({ postId: 'post-2' })
  })
})
