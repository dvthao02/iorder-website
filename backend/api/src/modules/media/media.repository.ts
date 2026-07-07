import type { MediaListQuery, MediaMetadataInput } from '@iorder/contracts'
import type { CmsDatabase } from '@iorder/database'
import {
  auditLogs,
  mediaAssets,
  offerings,
  pageBlocks,
  partners,
  posts,
  siteProfile,
  testimonials,
} from '@iorder/database'
import { and, count, desc, eq, ilike, isNull, not } from 'drizzle-orm'

export type MediaAssetRecord = typeof mediaAssets.$inferSelect

export function serializeMediaAsset(asset: MediaAssetRecord) {
  return {
    id: asset.id,
    publicUrl: asset.publicUrl,
    originalName: asset.originalName,
    mimeType: asset.mimeType,
    fileSize: asset.fileSize,
    width: asset.width,
    height: asset.height,
    altText: asset.altText,
    caption: asset.caption,
    createdAt: asset.createdAt.toISOString(),
  }
}

export type MediaUsageItem = {
  entityType: 'homepage_section' | 'post' | 'offering' | 'partner' | 'testimonial' | 'site_profile'
  entityId: string
  label: string
  location: string
}

export class MediaRepository {
  constructor(private db: CmsDatabase) {}

  async list(query: MediaListQuery) {
    const filters = []
    if (query.kind === 'image') filters.push(ilike(mediaAssets.mimeType, 'image/%'))
    else if (query.kind === 'document') filters.push(not(ilike(mediaAssets.mimeType, 'image/%')))
    if (query.search) filters.push(ilike(mediaAssets.originalName, `%${query.search}%`))

    const where = filters.length > 0 ? and(...filters) : undefined
    const offset = (query.page - 1) * query.limit
    const [items, totals] = await Promise.all([
      this.db
        .select()
        .from(mediaAssets)
        .where(where)
        .orderBy(desc(mediaAssets.createdAt))
        .limit(query.limit)
        .offset(offset),
      this.db.select({ value: count() }).from(mediaAssets).where(where),
    ])
    return { items, total: totals[0]?.value ?? 0 }
  }

  async findById(id: string) {
    const [asset] = await this.db.select().from(mediaAssets).where(eq(mediaAssets.id, id)).limit(1)
    return asset ?? null
  }

  async create(data: {
    uploadedBy: string
    storageKey: string
    publicUrl: string
    originalName: string
    mimeType: string
    fileSize: number
    width: number | null
    height: number | null
    altText: string | null
    caption: string | null
  }) {
    const [asset] = await this.db.insert(mediaAssets).values(data).returning()
    if (!asset) throw new Error('Media asset was not created')
    return asset
  }

  async update(id: string, data: MediaMetadataInput) {
    const [updated] = await this.db
      .update(mediaAssets)
      .set({
        altText: data.altText,
        caption: data.caption,
        updatedAt: new Date(),
      })
      .where(eq(mediaAssets.id, id))
      .returning()
    return updated ?? null
  }

  async delete(id: string) {
    await this.db.delete(mediaAssets).where(eq(mediaAssets.id, id))
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

  async collectUsage(mediaId: string): Promise<MediaUsageItem[]> {
    const [blocks, postRows, offeringRows, partnerRows, testimonialRows, profiles] = await Promise.all([
      this.db
        .select({ id: pageBlocks.id, type: pageBlocks.type, data: pageBlocks.data, appearance: pageBlocks.appearance })
        .from(pageBlocks),
      this.db
        .select({ id: posts.id, title: posts.title, coverMediaId: posts.coverMediaId })
        .from(posts)
        .where(isNull(posts.deletedAt)),
      this.db
        .select({ id: offerings.id, title: offerings.title, coverMediaId: offerings.coverMediaId })
        .from(offerings)
        .where(isNull(offerings.deletedAt)),
      this.db.select({ id: partners.id, name: partners.name, logoMediaId: partners.logoMediaId }).from(partners),
      this.db
        .select({ id: testimonials.id, authorName: testimonials.authorName, avatarMediaId: testimonials.avatarMediaId })
        .from(testimonials),
      this.db
        .select({ id: siteProfile.id, companyName: siteProfile.companyName, logoMediaId: siteProfile.logoMediaId })
        .from(siteProfile),
    ])

    const items: MediaUsageItem[] = []
    for (const block of blocks) {
      if (JSON.stringify({ data: block.data, appearance: block.appearance }).includes(mediaId))
        items.push({ entityType: 'homepage_section', entityId: block.id, label: block.type, location: 'Trang chủ' })
    }
    for (const row of postRows)
      if (row.coverMediaId === mediaId)
        items.push({ entityType: 'post', entityId: row.id, label: row.title, location: 'Ảnh bìa bài viết' })
    for (const row of offeringRows)
      if (row.coverMediaId === mediaId)
        items.push({
          entityType: 'offering',
          entityId: row.id,
          label: row.title,
          location: 'Ảnh bìa phần mềm/giải pháp',
        })
    for (const row of partnerRows)
      if (row.logoMediaId === mediaId)
        items.push({ entityType: 'partner', entityId: row.id, label: row.name, location: 'Logo đối tác' })
    for (const row of testimonialRows)
      if (row.avatarMediaId === mediaId)
        items.push({ entityType: 'testimonial', entityId: row.id, label: row.authorName, location: 'Ảnh khách hàng' })
    for (const row of profiles)
      if (row.logoMediaId === mediaId)
        items.push({ entityType: 'site_profile', entityId: row.id, label: row.companyName, location: 'Logo website' })
    return items
  }
}
