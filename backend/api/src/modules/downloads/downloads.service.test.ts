import { describe, expect, it, vi } from 'vitest'

import { DownloadFileNotFoundError, DownloadNotFoundError } from './downloads.errors.js'
import type { DownloadsRepository } from './downloads.repository.js'
import { DownloadsService } from './downloads.service.js'

const download = {
  id: '00000000-0000-4000-8000-000000000010',
  title: 'Bộ cài đặt',
  description: null,
  meta: null,
  icon: 'download' as const,
  fileMediaId: '00000000-0000-4000-8000-000000000011',
  sortOrder: 0,
  isEnabled: true,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
}
const input = {
  title: download.title,
  description: download.description,
  meta: download.meta,
  icon: download.icon,
  fileMediaId: download.fileMediaId,
  sortOrder: download.sortOrder,
  isEnabled: download.isEnabled,
}

function makeRepository(overrides: Record<string, unknown> = {}) {
  return {
    fileExists: vi.fn().mockResolvedValue(true),
    create: vi.fn().mockResolvedValue(download),
    findById: vi.fn().mockResolvedValue({ download, fileUrl: 'https://cdn.example/setup.zip', fileName: 'setup.zip' }),
    update: vi.fn(),
    delete: vi.fn().mockResolvedValue(undefined),
    insertAuditLog: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}

describe('DownloadsService mutations', () => {
  it('does not create a download whose selected file no longer exists', async () => {
    const repository = makeRepository({ fileExists: vi.fn().mockResolvedValue(false) })
    const service = new DownloadsService(repository as unknown as DownloadsRepository)

    await expect(service.create(input, 'editor-1')).rejects.toBeInstanceOf(DownloadFileNotFoundError)
    expect(repository.create).not.toHaveBeenCalled()
  })

  it('writes an audit record when a download is created', async () => {
    const repository = makeRepository()
    const service = new DownloadsService(repository as unknown as DownloadsRepository)

    const result = await service.create(input, 'editor-1')

    expect(result.statusCode).toBe(201)
    expect(repository.insertAuditLog).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'editor-1', action: 'download.create', entityId: download.id,
    }))
  })

  it('keeps deletion safe when the download is not found', async () => {
    const repository = makeRepository({ findById: vi.fn().mockResolvedValue(null) })
    const service = new DownloadsService(repository as unknown as DownloadsRepository)

    await expect(service.delete(download.id, 'editor-1')).rejects.toBeInstanceOf(DownloadNotFoundError)
    expect(repository.delete).not.toHaveBeenCalled()
  })
})
