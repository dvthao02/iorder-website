import type { DownloadInput } from '@iorder/contracts'

import { DownloadFileNotFoundError, DownloadNotFoundError } from './downloads.errors.js'
import { serializeDownload, type DownloadsRepository } from './downloads.repository.js'

export class DownloadsService {
  constructor(private repository: DownloadsRepository) {}

  async list() {
    const rows = await this.repository.list()
    return { items: rows.map((row) => serializeDownload(row.download, row.fileUrl, row.fileName)), total: rows.length }
  }

  async create(input: DownloadInput, editorId: string) {
    if (!(await this.repository.fileExists(input.fileMediaId))) throw new DownloadFileNotFoundError()

    const created = await this.repository.create(input)
    await this.repository.insertAuditLog({
      userId: editorId,
      action: 'download.create',
      entityType: 'support_download',
      entityId: created.id,
      afterData: serializeDownload(created),
    })
    const withFile = await this.repository.findById(created.id)
    return { statusCode: 201, item: serializeDownload(created, withFile?.fileUrl ?? null, withFile?.fileName ?? null) }
  }

  async update(id: string, input: DownloadInput, editorId: string) {
    const existing = await this.repository.findById(id)
    if (!existing) throw new DownloadNotFoundError()
    if (!(await this.repository.fileExists(input.fileMediaId))) throw new DownloadFileNotFoundError()

    const updated = await this.repository.update(id, input)
    if (!updated) throw new DownloadNotFoundError()
    await this.repository.insertAuditLog({
      userId: editorId,
      action: 'download.update',
      entityType: 'support_download',
      entityId: updated.id,
      beforeData: serializeDownload(existing.download),
      afterData: serializeDownload(updated),
    })
    const withFile = await this.repository.findById(updated.id)
    return { item: serializeDownload(updated, withFile?.fileUrl ?? null, withFile?.fileName ?? null) }
  }

  async delete(id: string, editorId: string) {
    const existing = await this.repository.findById(id)
    if (!existing) throw new DownloadNotFoundError()

    await this.repository.delete(id)
    await this.repository.insertAuditLog({
      userId: editorId,
      action: 'download.delete',
      entityType: 'support_download',
      entityId: id,
      beforeData: serializeDownload(existing.download),
    })
  }

  async listPublic() {
    const rows = await this.repository.listPublic()
    return { items: rows.map((row) => serializeDownload(row.download, row.fileUrl, row.fileName)) }
  }
}
