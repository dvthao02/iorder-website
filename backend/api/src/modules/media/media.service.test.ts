import { describe, expect, it, vi } from 'vitest'

import { MediaInUseError, MediaNotFoundError } from './media.errors.js'
import type { MediaRepository } from './media.repository.js'
import { MediaService } from './media.service.js'
import { HookManager } from '../../shared/hooks/index.js'

const asset = {
  id: '00000000-0000-4000-8000-000000000050',
  storageKey: 'media/test.jpg',
  publicUrl: 'https://cdn.example/test.jpg',
  originalName: 'test.jpg',
  mimeType: 'image/jpeg',
  fileSize: 1024,
  width: 100,
  height: 100,
  altText: null,
  caption: null,
  uploadedBy: 'editor-1',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
}

function makeRepository(overrides: Record<string, unknown> = {}) {
  return {
    findById: vi.fn().mockResolvedValue(asset),
    update: vi.fn().mockResolvedValue({ ...asset, altText: 'Ảnh minh họa' }),
    collectUsage: vi.fn().mockResolvedValue([]),
    delete: vi.fn().mockResolvedValue(undefined),
    insertAuditLog: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}

function makeStorage() {
  return { put: vi.fn(), delete: vi.fn().mockResolvedValue(undefined) }
}

describe('MediaService mutations', () => {
  it('does not update a missing asset', async () => {
    const repository = makeRepository({ findById: vi.fn().mockResolvedValue(null) })
    const service = new MediaService(repository as unknown as MediaRepository, makeStorage() as never, new HookManager())
    await expect(service.update(asset.id, { altText: null, caption: null }, 'editor-1')).rejects.toBeInstanceOf(MediaNotFoundError)
  })

  it('keeps a referenced asset intact on deletion', async () => {
    const repository = makeRepository({ collectUsage: vi.fn().mockResolvedValue([{ entityType: 'post', entityId: 'post-1', label: 'Bài viết', location: 'Ảnh bìa' }]) })
    const storage = makeStorage()
    const service = new MediaService(repository as unknown as MediaRepository, storage as never, new HookManager())
    await expect(service.delete(asset.id, 'editor-1')).rejects.toBeInstanceOf(MediaInUseError)
    expect(repository.delete).not.toHaveBeenCalled()
    expect(storage.delete).not.toHaveBeenCalled()
  })

  it('records metadata changes in the audit log', async () => {
    const repository = makeRepository()
    const service = new MediaService(repository as unknown as MediaRepository, makeStorage() as never, new HookManager())
    await service.update(asset.id, { altText: 'Ảnh minh họa', caption: null }, 'editor-1')
    expect(repository.insertAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: 'media.update', entityId: asset.id }))
  })
})
