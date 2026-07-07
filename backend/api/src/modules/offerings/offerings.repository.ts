import type { OfferingInput, OfferingListQuery } from '@iorder/contracts'
import type { CmsDatabase } from '@iorder/database'
import { auditLogs, mediaAssets, offeringRevisions, offerings } from '@iorder/database'
import { and, asc, count, desc, eq, ilike, isNull, max, ne, or } from 'drizzle-orm'

export type OfferingRecord = typeof offerings.$inferSelect

export function serializeOffering(offering: OfferingRecord, coverUrl: string | null = null) {
  return {
    id: offering.id,
    type: offering.type,
    title: offering.title,
    slug: offering.slug,
    summary: offering.summary,
    icon: offering.icon,
    coverMediaId: offering.coverMediaId,
    coverUrl,
    sortOrder: offering.sortOrder,
    isFeatured: offering.isFeatured,
    status: offering.status,
    seoTitle: offering.seoTitle,
    seoDescription: offering.seoDescription,
    canonicalUrl: offering.canonicalUrl,
    publishedAt: offering.publishedAt?.toISOString() ?? null,
    createdAt: offering.createdAt.toISOString(),
    updatedAt: offering.updatedAt.toISOString(),
    contentJson: offering.contentJson as Record<string, unknown>,
  }
}

export class OfferingsRepository {
  constructor(private db: CmsDatabase) {}

  async resolveMediaUrl(id: string | null): Promise<string | null> {
    if (!id) return null
    const [asset] = await this.db
      .select({ publicUrl: mediaAssets.publicUrl })
      .from(mediaAssets)
      .where(eq(mediaAssets.id, id))
      .limit(1)
    return asset?.publicUrl ?? null
  }

  async coverExists(id: string | null) {
    if (!id) return true
    const [asset] = await this.db
      .select({ id: mediaAssets.id })
      .from(mediaAssets)
      .where(eq(mediaAssets.id, id))
      .limit(1)
    return Boolean(asset)
  }

  async slugExistsForType(type: OfferingRecord['type'], slug: string, excludedId?: string) {
    const filters = [eq(offerings.type, type), eq(offerings.slug, slug), isNull(offerings.deletedAt)]
    if (excludedId) filters.push(ne(offerings.id, excludedId))
    const [row] = await this.db
      .select({ id: offerings.id })
      .from(offerings)
      .where(and(...filters))
      .limit(1)
    return Boolean(row)
  }

  async createRevision(offering: OfferingRecord, editorId: string, changeNote: string) {
    const [current] = await this.db
      .select({ version: max(offeringRevisions.versionNumber) })
      .from(offeringRevisions)
      .where(eq(offeringRevisions.offeringId, offering.id))

    await this.db.insert(offeringRevisions).values({
      offeringId: offering.id,
      editorId,
      versionNumber: (current?.version ?? 0) + 1,
      contentSnapshot: serializeOffering(offering),
      changeNote,
    })
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

  async findById(id: string) {
    const [row] = await this.db
      .select()
      .from(offerings)
      .where(and(eq(offerings.id, id), isNull(offerings.deletedAt)))
      .limit(1)
    return row ?? null
  }

  async list(query: OfferingListQuery) {
    const filters = [isNull(offerings.deletedAt)]
    if (query.type) filters.push(eq(offerings.type, query.type))
    if (query.status) filters.push(eq(offerings.status, query.status))
    if (query.search)
      filters.push(or(ilike(offerings.title, `%${query.search}%`), ilike(offerings.slug, `%${query.search}%`))!)

    const offset = (query.page - 1) * query.limit
    const [rows, countRows] = await Promise.all([
      this.db
        .select()
        .from(offerings)
        .where(and(...filters))
        .orderBy(asc(offerings.type), asc(offerings.sortOrder), desc(offerings.updatedAt))
        .limit(query.limit)
        .offset(offset),
      this.db
        .select({ total: count() })
        .from(offerings)
        .where(and(...filters)),
    ])
    return { rows, total: countRows[0]?.total ?? 0 }
  }

  async create(
    data: Pick<
      OfferingInput,
      | 'type'
      | 'title'
      | 'slug'
      | 'summary'
      | 'icon'
      | 'coverMediaId'
      | 'sortOrder'
      | 'isFeatured'
      | 'seoTitle'
      | 'seoDescription'
      | 'canonicalUrl'
      | 'contentJson'
    >,
  ) {
    const [created] = await this.db
      .insert(offerings)
      .values({
        type: data.type,
        title: data.title,
        slug: data.slug,
        summary: data.summary,
        icon: data.icon,
        coverMediaId: data.coverMediaId,
        sortOrder: data.sortOrder,
        isFeatured: data.isFeatured,
        seoTitle: data.seoTitle,
        seoDescription: data.seoDescription,
        canonicalUrl: data.canonicalUrl,
        contentJson: data.contentJson,
        status: 'draft',
      })
      .returning()
    if (!created) throw new Error('Offering was not created')
    return created
  }

  async update(
    id: string,
    data: Pick<
      OfferingInput,
      | 'title'
      | 'slug'
      | 'summary'
      | 'icon'
      | 'coverMediaId'
      | 'sortOrder'
      | 'isFeatured'
      | 'seoTitle'
      | 'seoDescription'
      | 'canonicalUrl'
      | 'contentJson'
    >,
  ) {
    const [updated] = await this.db
      .update(offerings)
      .set({
        title: data.title,
        slug: data.slug,
        summary: data.summary,
        icon: data.icon,
        coverMediaId: data.coverMediaId,
        sortOrder: data.sortOrder,
        isFeatured: data.isFeatured,
        seoTitle: data.seoTitle,
        seoDescription: data.seoDescription,
        canonicalUrl: data.canonicalUrl,
        contentJson: data.contentJson,
        updatedAt: new Date(),
      })
      .where(eq(offerings.id, id))
      .returning()
    return updated ?? null
  }

  async publish(id: string, existingPublishedAt: Date | null) {
    const now = new Date()
    const [updated] = await this.db
      .update(offerings)
      .set({
        status: 'published',
        publishedAt: existingPublishedAt ?? now,
        updatedAt: now,
      })
      .where(eq(offerings.id, id))
      .returning()
    return updated ?? null
  }

  async archive(id: string) {
    const [updated] = await this.db
      .update(offerings)
      .set({ status: 'archived', updatedAt: new Date() })
      .where(eq(offerings.id, id))
      .returning()
    return updated ?? null
  }

  async unpublish(id: string) {
    const [updated] = await this.db
      .update(offerings)
      .set({ status: 'draft', updatedAt: new Date() })
      .where(eq(offerings.id, id))
      .returning()
    return updated ?? null
  }

  async softDelete(id: string) {
    await this.db.update(offerings).set({ deletedAt: new Date(), updatedAt: new Date() }).where(eq(offerings.id, id))
  }

  async listPublic(type?: OfferingRecord['type']) {
    const typeFilter = type ? [eq(offerings.type, type)] : []
    return this.db
      .select()
      .from(offerings)
      .where(and(eq(offerings.status, 'published'), isNull(offerings.deletedAt), ...typeFilter))
      .orderBy(asc(offerings.sortOrder), asc(offerings.title))
  }

  async findPublicByTypeAndSlug(type: OfferingRecord['type'], slug: string) {
    const [row] = await this.db
      .select()
      .from(offerings)
      .where(
        and(
          eq(offerings.type, type),
          eq(offerings.slug, slug),
          eq(offerings.status, 'published'),
          isNull(offerings.deletedAt),
        ),
      )
      .limit(1)
    return row ?? null
  }
}
