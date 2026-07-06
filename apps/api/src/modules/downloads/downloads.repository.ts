import type { DownloadInput } from '@iorder/contracts'
import type { CmsDatabase } from '@iorder/database'
import { auditLogs, mediaAssets, supportDownloads } from '@iorder/database'
import { asc, eq } from 'drizzle-orm'

export type DownloadRecord = typeof supportDownloads.$inferSelect

export function serializeDownload(
  download: DownloadRecord,
  fileUrl: string | null = null,
  fileName: string | null = null,
) {
  return {
    id: download.id,
    title: download.title,
    description: download.description,
    meta: download.meta,
    icon: download.icon,
    fileMediaId: download.fileMediaId,
    fileUrl,
    fileName,
    sortOrder: download.sortOrder,
    isEnabled: download.isEnabled,
    createdAt: download.createdAt.toISOString(),
    updatedAt: download.updatedAt.toISOString(),
  }
}

export class DownloadsRepository {
  constructor(private db: CmsDatabase) {}

  async fileExists(id: string | null) {
    if (!id) return true
    const [asset] = await this.db
      .select({ id: mediaAssets.id })
      .from(mediaAssets)
      .where(eq(mediaAssets.id, id))
      .limit(1)
    return Boolean(asset)
  }

  async findById(id: string) {
    const [row] = await this.db
      .select({
        download: supportDownloads,
        fileUrl: mediaAssets.publicUrl,
        fileName: mediaAssets.originalName,
      })
      .from(supportDownloads)
      .leftJoin(mediaAssets, eq(supportDownloads.fileMediaId, mediaAssets.id))
      .where(eq(supportDownloads.id, id))
      .limit(1)
    return row ?? null
  }

  async list() {
    return this.db
      .select({
        download: supportDownloads,
        fileUrl: mediaAssets.publicUrl,
        fileName: mediaAssets.originalName,
      })
      .from(supportDownloads)
      .leftJoin(mediaAssets, eq(supportDownloads.fileMediaId, mediaAssets.id))
      .orderBy(asc(supportDownloads.sortOrder), asc(supportDownloads.title))
  }

  async create(data: DownloadInput) {
    const [created] = await this.db
      .insert(supportDownloads)
      .values({
        title: data.title,
        description: data.description,
        meta: data.meta,
        icon: data.icon,
        fileMediaId: data.fileMediaId,
        sortOrder: data.sortOrder,
        isEnabled: data.isEnabled,
      })
      .returning()
    if (!created) throw new Error('Download was not created')
    return created
  }

  async update(id: string, data: DownloadInput) {
    const [updated] = await this.db
      .update(supportDownloads)
      .set({
        title: data.title,
        description: data.description,
        meta: data.meta,
        icon: data.icon,
        fileMediaId: data.fileMediaId,
        sortOrder: data.sortOrder,
        isEnabled: data.isEnabled,
        updatedAt: new Date(),
      })
      .where(eq(supportDownloads.id, id))
      .returning()
    return updated ?? null
  }

  async delete(id: string) {
    await this.db.delete(supportDownloads).where(eq(supportDownloads.id, id))
  }

  async insertAuditLog(entry: {
    userId: string
    action: string
    entityType: string
    entityId: string
    beforeData?: unknown
    afterData?: unknown
  }) {
    await this.db.insert(auditLogs).values(entry)
  }

  async listPublic() {
    return this.db
      .select({
        download: supportDownloads,
        fileUrl: mediaAssets.publicUrl,
        fileName: mediaAssets.originalName,
      })
      .from(supportDownloads)
      .leftJoin(mediaAssets, eq(supportDownloads.fileMediaId, mediaAssets.id))
      .where(eq(supportDownloads.isEnabled, true))
      .orderBy(asc(supportDownloads.sortOrder), asc(supportDownloads.title))
  }
}
