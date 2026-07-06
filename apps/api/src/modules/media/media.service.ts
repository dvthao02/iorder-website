import type { MediaListQuery, MediaMetadataInput } from '@iorder/contracts'

import type { HookManager } from '../../shared/hooks/index.js'
import type { MediaStorage } from '../../media/media-storage.js'
import { validateMediaFile } from '../../media/media-validation.js'
import { FileRequiredError, InvalidMediaFileError, MediaInUseError, MediaNotFoundError } from './media.errors.js'
import { MEDIA_EVENTS } from './media.hooks.js'
import { serializeMediaAsset, type MediaRepository } from './media.repository.js'

export interface RawUpload {
  buffer: Buffer
  filename: string
  mimeType: string
}

export class MediaService {
  constructor(
    private repository: MediaRepository,
    private storage: MediaStorage,
    private hooks: HookManager,
  ) {}

  async list(query: MediaListQuery) {
    const { items, total } = await this.repository.list(query)
    return { items: items.map(serializeMediaAsset), total, page: query.page, limit: query.limit }
  }

  async upload(upload: RawUpload | null, metadata: MediaMetadataInput, uploadedBy: string) {
    if (!upload || !upload.filename || upload.buffer.length === 0) throw new FileRequiredError()

    let validated: ReturnType<typeof validateMediaFile>
    try {
      validated = validateMediaFile(upload.filename, upload.mimeType, upload.buffer)
    } catch (error) {
      const code = error instanceof Error ? error.message : 'INVALID_MEDIA'
      throw new InvalidMediaFileError(code)
    }

    const stored = await this.storage.put(upload.buffer, validated.extension)

    try {
      const asset = await this.repository.create({
        uploadedBy,
        storageKey: stored.storageKey,
        publicUrl: stored.publicUrl,
        originalName: upload.filename,
        mimeType: upload.mimeType,
        fileSize: upload.buffer.length,
        width: validated.width,
        height: validated.height,
        altText: metadata.altText,
        caption: metadata.caption,
      })

      await this.repository.insertAuditLog({
        userId: uploadedBy,
        action: 'media.upload',
        entityType: 'media_asset',
        entityId: asset.id,
        afterData: serializeMediaAsset(asset),
      })

      await this.hooks.emit(MEDIA_EVENTS.UPLOADED, { mediaId: asset.id })

      return { statusCode: 201, item: serializeMediaAsset(asset) }
    } catch (error) {
      await this.storage.delete(stored.storageKey)
      throw error
    }
  }

  async update(id: string, input: MediaMetadataInput, editorId: string) {
    const existing = await this.repository.findById(id)
    if (!existing) throw new MediaNotFoundError()

    const updated = await this.repository.update(id, input)
    if (!updated) throw new MediaNotFoundError()

    await this.repository.insertAuditLog({
      userId: editorId,
      action: 'media.update',
      entityType: 'media_asset',
      entityId: updated.id,
      beforeData: serializeMediaAsset(existing),
      afterData: serializeMediaAsset(updated),
    })

    await this.hooks.emit(MEDIA_EVENTS.UPDATED, { mediaId: updated.id })

    return { item: serializeMediaAsset(updated) }
  }

  async getUsage(id: string) {
    const asset = await this.repository.findById(id)
    if (!asset) throw new MediaNotFoundError()

    const items = await this.repository.collectUsage(id)
    return { items, total: items.length, canDelete: items.length === 0 }
  }

  async delete(id: string, editorId: string) {
    const asset = await this.repository.findById(id)
    if (!asset) throw new MediaNotFoundError()

    const usage = await this.repository.collectUsage(id)
    if (usage.length > 0) throw new MediaInUseError(usage)

    await this.repository.delete(id)
    try {
      await this.storage.delete(asset.storageKey)
    } catch {
      // File trên storage có thể đã bị xóa trước đó — bản ghi DB vẫn được gỡ.
    }

    await this.repository.insertAuditLog({
      userId: editorId,
      action: 'media.delete',
      entityType: 'media_asset',
      entityId: id,
      beforeData: serializeMediaAsset(asset),
    })

    await this.hooks.emit(MEDIA_EVENTS.DELETED, { mediaId: id })
  }
}
