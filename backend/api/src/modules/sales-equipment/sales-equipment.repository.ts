import type { EquipmentSpecificationGroup, SalesEquipmentInput, SalesEquipmentListQuery } from '@iorder/contracts'
import type { CmsDatabase } from '@iorder/database'
import { auditLogs, mediaAssets, salesEquipment, salesEquipmentRevisions } from '@iorder/database'
import { and, asc, count, desc, eq, ilike, isNull, max, ne, or } from 'drizzle-orm'

export type SalesEquipmentRecord = typeof salesEquipment.$inferSelect

export function serializeSalesEquipment(item: SalesEquipmentRecord, coverUrl: string | null = null) {
  return {
    id: item.id,
    category: item.category,
    name: item.name,
    slug: item.slug,
    modelCode: item.modelCode,
    coverMediaId: item.coverMediaId,
    coverUrl,
    priceVnd: item.priceVnd,
    warrantyMonths: item.warrantyMonths,
    summary: item.summary,
    specificationGroups: item.specificationGroups as EquipmentSpecificationGroup[],
    sortOrder: item.sortOrder,
    isFeatured: item.isFeatured,
    status: item.status,
    seoTitle: item.seoTitle,
    seoDescription: item.seoDescription,
    canonicalUrl: item.canonicalUrl,
    publishedAt: item.publishedAt?.toISOString() ?? null,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }
}

export class SalesEquipmentRepository {
  constructor(private db: CmsDatabase) {}

  async coverExists(id: string | null) {
    if (!id) return true
    const [asset] = await this.db
      .select({ id: mediaAssets.id })
      .from(mediaAssets)
      .where(eq(mediaAssets.id, id))
      .limit(1)
    return Boolean(asset)
  }

  async resolveCoverUrl(id: string | null) {
    if (!id) return null
    const [asset] = await this.db
      .select({ publicUrl: mediaAssets.publicUrl })
      .from(mediaAssets)
      .where(eq(mediaAssets.id, id))
      .limit(1)
    return asset?.publicUrl ?? null
  }

  async slugExists(slug: string, excludedId?: string) {
    const filters = [eq(salesEquipment.slug, slug), isNull(salesEquipment.deletedAt)]
    if (excludedId) filters.push(ne(salesEquipment.id, excludedId))
    const [row] = await this.db
      .select({ id: salesEquipment.id })
      .from(salesEquipment)
      .where(and(...filters))
      .limit(1)
    return Boolean(row)
  }

  async findById(id: string) {
    const [row] = await this.db
      .select()
      .from(salesEquipment)
      .where(and(eq(salesEquipment.id, id), isNull(salesEquipment.deletedAt)))
      .limit(1)
    return row ?? null
  }

  async list(query: SalesEquipmentListQuery) {
    const filters = [isNull(salesEquipment.deletedAt)]
    if (query.category) filters.push(eq(salesEquipment.category, query.category))
    if (query.status) filters.push(eq(salesEquipment.status, query.status))
    if (query.search)
      filters.push(
        or(ilike(salesEquipment.name, `%${query.search}%`), ilike(salesEquipment.modelCode, `%${query.search}%`))!,
      )
    const offset = (query.page - 1) * query.limit
    const [rows, countRows] = await Promise.all([
      this.db
        .select()
        .from(salesEquipment)
        .where(and(...filters))
        .orderBy(asc(salesEquipment.category), asc(salesEquipment.sortOrder), desc(salesEquipment.updatedAt))
        .limit(query.limit)
        .offset(offset),
      this.db
        .select({ total: count() })
        .from(salesEquipment)
        .where(and(...filters)),
    ])
    return { rows, total: countRows[0]?.total ?? 0 }
  }

  async create(input: SalesEquipmentInput) {
    const [created] = await this.db
      .insert(salesEquipment)
      .values({ ...input, status: 'draft' })
      .returning()
    if (!created) throw new Error('Sales equipment was not created')
    return created
  }

  async update(id: string, input: SalesEquipmentInput) {
    const [updated] = await this.db
      .update(salesEquipment)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(salesEquipment.id, id))
      .returning()
    return updated ?? null
  }

  async setStatus(id: string, status: 'draft' | 'published' | 'archived', publishedAt?: Date | null) {
    const now = new Date()
    const [updated] = await this.db
      .update(salesEquipment)
      .set({
        status,
        publishedAt: status === 'published' ? (publishedAt ?? now) : (publishedAt ?? null),
        updatedAt: now,
      })
      .where(eq(salesEquipment.id, id))
      .returning()
    return updated ?? null
  }

  async softDelete(id: string) {
    await this.db
      .update(salesEquipment)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(salesEquipment.id, id))
  }

  async createRevision(item: SalesEquipmentRecord, editorId: string, changeNote: string) {
    const [current] = await this.db
      .select({ version: max(salesEquipmentRevisions.versionNumber) })
      .from(salesEquipmentRevisions)
      .where(eq(salesEquipmentRevisions.salesEquipmentId, item.id))
    await this.db.insert(salesEquipmentRevisions).values({
      salesEquipmentId: item.id,
      editorId,
      versionNumber: (current?.version ?? 0) + 1,
      contentSnapshot: serializeSalesEquipment(item),
      changeNote,
    })
  }

  async listRevisions(id: string) {
    return this.db
      .select()
      .from(salesEquipmentRevisions)
      .where(eq(salesEquipmentRevisions.salesEquipmentId, id))
      .orderBy(desc(salesEquipmentRevisions.versionNumber))
  }

  async findRevision(id: string, version: number) {
    const [revision] = await this.db
      .select()
      .from(salesEquipmentRevisions)
      .where(and(eq(salesEquipmentRevisions.salesEquipmentId, id), eq(salesEquipmentRevisions.versionNumber, version)))
      .limit(1)
    return revision ?? null
  }

  async restore(id: string, snapshot: SalesEquipmentInput) {
    const [updated] = await this.db
      .update(salesEquipment)
      .set({ ...snapshot, status: 'draft', publishedAt: null, deletedAt: null, updatedAt: new Date() })
      .where(eq(salesEquipment.id, id))
      .returning()
    return updated ?? null
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

  async listPublic(category?: SalesEquipmentRecord['category']) {
    const categoryFilter = category ? [eq(salesEquipment.category, category)] : []
    return this.db
      .select()
      .from(salesEquipment)
      .where(and(eq(salesEquipment.status, 'published'), isNull(salesEquipment.deletedAt), ...categoryFilter))
      .orderBy(asc(salesEquipment.sortOrder), asc(salesEquipment.name))
  }
}
