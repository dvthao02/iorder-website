import {
  DEFAULT_SECTION_APPEARANCE,
  HOMEPAGE_SECTION_ORDER,
  sectionAppearanceSchema,
  type HomepageBlock,
  type HomepageInput,
} from '@iorder/contracts'
import type { CmsDatabase } from '@iorder/database'
import { auditLogs, mediaAssets, pageBlocks, pageRevisions, pages, users } from '@iorder/database'
import { and, desc, eq, inArray, isNull, max, sql } from 'drizzle-orm'

const knownSectionTypes = new Set(HOMEPAGE_SECTION_ORDER)

export type HomepagePage = typeof pages.$inferSelect
export type HomepageBlockRow = typeof pageBlocks.$inferSelect
export type HomepageWithBlocks = { page: HomepagePage; blocks: HomepageBlockRow[] }
export type SaveHomepageResult =
  { conflict: true; current: HomepageWithBlocks | null } | { conflict: false; current: HomepageWithBlocks }

// Kéo-thả sắp xếp lại section: giữ nguyên thứ tự client gửi lên, chỉ lọc trùng/lạ — không ép về HOMEPAGE_SECTION_ORDER.
export function normalizeBlocks(blocks: HomepageBlock[]) {
  const seen = new Set<string>()
  const result: HomepageBlock[] = []
  for (const block of blocks) {
    if (!knownSectionTypes.has(block.type) || seen.has(block.type)) continue
    seen.add(block.type)
    result.push(block)
  }
  return result
}

export function serializeHomepage(page: HomepagePage, blocks: HomepageBlockRow[]) {
  const serialized = blocks.map(
    (block) =>
      ({
        type: block.type,
        isEnabled: block.isEnabled,
        appearance: sectionAppearanceSchema.parse(block.appearance ?? DEFAULT_SECTION_APPEARANCE),
        data: block.data,
      }) as HomepageBlock,
  )

  return {
    id: page.id,
    title: page.title,
    seoTitle: page.seoTitle,
    seoDescription: page.seoDescription,
    canonicalUrl: page.canonicalUrl,
    status: page.status === 'review' || page.status === 'scheduled' ? ('draft' as const) : page.status,
    draftVersion: page.draftVersion,
    publishedAt: page.publishedAt?.toISOString() ?? null,
    updatedAt: page.updatedAt.toISOString(),
    blocks: serialized,
  }
}

export function collectMediaIds(blocks: HomepageBlock[]) {
  const ids = new Set<string>()

  for (const block of blocks) {
    if (block.appearance.backgroundMediaId) ids.add(block.appearance.backgroundMediaId)
    if (block.appearance.mobileBackgroundMediaId) ids.add(block.appearance.mobileBackgroundMediaId)
    if (block.type === 'home_hero') {
      if (block.data.imageMediaId) ids.add(block.data.imageMediaId)
      block.data.slides.forEach((slide) => ids.add(slide.imageMediaId))
    }
    if (block.type === 'home_stats') block.data.partners.forEach((partner) => ids.add(partner.mediaId))
    if (block.type === 'home_process') {
      ids.add(block.data.featureMediaId)
      block.data.models.forEach((model) => ids.add(model.mediaId))
    }
    if (block.type === 'home_testimonials') {
      block.data.items.forEach((item) => {
        if (item.avatarMediaId) ids.add(item.avatarMediaId)
      })
    }
  }

  return [...ids]
}

export function serializeAsset(asset: typeof mediaAssets.$inferSelect) {
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

export class HomepageRepository {
  constructor(private db: CmsDatabase) {}

  async mediaReferencesExist(blocks: HomepageBlock[]): Promise<boolean> {
    const ids = collectMediaIds(blocks)
    if (ids.length === 0) return true
    const found = await this.db.select({ id: mediaAssets.id }).from(mediaAssets).where(inArray(mediaAssets.id, ids))
    return found.length === ids.length
  }

  async findAssetsByIds(ids: string[]) {
    if (ids.length === 0) return []
    return this.db.select().from(mediaAssets).where(inArray(mediaAssets.id, ids))
  }

  async findBySlug(slug: string): Promise<HomepageWithBlocks | null> {
    const [page] = await this.db
      .select()
      .from(pages)
      .where(and(eq(pages.slug, slug), isNull(pages.deletedAt)))
      .limit(1)

    if (!page) return null
    const blocks = await this.db
      .select()
      .from(pageBlocks)
      .where(eq(pageBlocks.pageId, page.id))
      .orderBy(pageBlocks.sortOrder)
    return { page, blocks }
  }

  async addRevision(
    page: HomepagePage,
    blocks: HomepageBlockRow[],
    editorId: string,
    isPublished: boolean,
    changeNote?: string | null,
  ) {
    const [current] = await this.db
      .select({ version: max(pageRevisions.versionNumber) })
      .from(pageRevisions)
      .where(eq(pageRevisions.pageId, page.id))

    const [revision] = await this.db
      .insert(pageRevisions)
      .values({
        pageId: page.id,
        editorId,
        versionNumber: (current?.version ?? 0) + 1,
        contentSnapshot: serializeHomepage(page, blocks),
        changeNote: changeNote ?? (isPublished ? 'Đã xuất bản' : 'Đã lưu phiên bản'),
        isPublished,
      })
      .returning()
    return revision
  }

  async save(rawInput: HomepageInput, slug: string, expectedVersion?: number): Promise<SaveHomepageResult> {
    const input = { ...rawInput, blocks: normalizeBlocks(rawInput.blocks) }
    let current = await this.findBySlug(slug)
    let page = current?.page

    if (!page) {
      if (expectedVersion !== undefined && expectedVersion !== 0) return { conflict: true, current: null }
      const [created] = await this.db
        .insert(pages)
        .values({
          title: input.title,
          slug,
          template: 'home',
          status: 'draft',
          draftVersion: 1,
          seoTitle: input.seoTitle,
          seoDescription: input.seoDescription,
          canonicalUrl: input.canonicalUrl,
        })
        .returning()
      if (!created) throw new Error('Homepage was not created')
      page = created
    } else {
      const condition =
        expectedVersion === undefined
          ? eq(pages.id, page.id)
          : and(eq(pages.id, page.id), eq(pages.draftVersion, expectedVersion))
      const [updated] = await this.db
        .update(pages)
        .set({
          title: input.title,
          seoTitle: input.seoTitle,
          seoDescription: input.seoDescription,
          canonicalUrl: input.canonicalUrl,
          draftVersion: sql`${pages.draftVersion} + 1`,
          updatedAt: new Date(),
        })
        .where(condition)
        .returning()
      if (!updated) {
        current = await this.findBySlug(slug)
        return { conflict: true, current }
      }
      page = updated
    }

    await this.db.delete(pageBlocks).where(eq(pageBlocks.pageId, page.id))
    if (input.blocks.length > 0) {
      await this.db.insert(pageBlocks).values(
        input.blocks.map((block, index) => ({
          pageId: page!.id,
          type: block.type,
          sortOrder: index,
          data: block.data,
          appearance: block.appearance,
          isEnabled: block.isEnabled,
        })),
      )
    }

    current = await this.findBySlug(slug)
    if (!current) throw new Error('Homepage could not be reloaded')
    return { conflict: false, current }
  }

  async publish(pageId: string) {
    const [publishedPage] = await this.db
      .update(pages)
      .set({
        status: 'published',
        publishedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(pages.id, pageId))
      .returning()
    return publishedPage ?? null
  }

  async markDraft(pageId: string) {
    const [draftPage] = await this.db
      .update(pages)
      .set({ status: 'draft', updatedAt: new Date() })
      .where(eq(pages.id, pageId))
      .returning()
    return draftPage ?? null
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

  async listRevisions(pageId: string) {
    const rows = await this.db
      .select({
        id: pageRevisions.id,
        versionNumber: pageRevisions.versionNumber,
        changeNote: pageRevisions.changeNote,
        isPublished: pageRevisions.isPublished,
        editorName: users.fullName,
        createdAt: pageRevisions.createdAt,
      })
      .from(pageRevisions)
      .leftJoin(users, eq(pageRevisions.editorId, users.id))
      .where(eq(pageRevisions.pageId, pageId))
      .orderBy(desc(pageRevisions.versionNumber))
      .limit(50)
    return rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() }))
  }

  async findRevisionByVersion(pageId: string, version: number) {
    const [row] = await this.db
      .select({
        id: pageRevisions.id,
        versionNumber: pageRevisions.versionNumber,
        changeNote: pageRevisions.changeNote,
        isPublished: pageRevisions.isPublished,
        editorName: users.fullName,
        createdAt: pageRevisions.createdAt,
        snapshot: pageRevisions.contentSnapshot,
      })
      .from(pageRevisions)
      .leftJoin(users, eq(pageRevisions.editorId, users.id))
      .where(and(eq(pageRevisions.pageId, pageId), eq(pageRevisions.versionNumber, version)))
      .limit(1)
    if (!row) return null
    return { ...row, createdAt: row.createdAt.toISOString() }
  }

  async findLatestPublishedSnapshot(pageId: string) {
    const [revision] = await this.db
      .select({ snapshot: pageRevisions.contentSnapshot })
      .from(pageRevisions)
      .where(and(eq(pageRevisions.pageId, pageId), eq(pageRevisions.isPublished, true)))
      .orderBy(desc(pageRevisions.versionNumber))
      .limit(1)
    return revision ?? null
  }
}
