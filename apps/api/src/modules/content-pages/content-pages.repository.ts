import type { ContentPageInput, ContentPageListQuery } from '@iorder/contracts'
import type { CmsDatabase } from '@iorder/database'
import { auditLogs, contentPages } from '@iorder/database'
import { and, count, desc, eq, ilike, ne, or } from 'drizzle-orm'

export type ContentPageRecord = typeof contentPages.$inferSelect

export function serializeContentPage(page: ContentPageRecord) {
  return {
    id: page.id,
    slug: page.slug,
    title: page.title,
    lead: page.lead,
    body: page.body,
    seoTitle: page.seoTitle,
    seoDescription: page.seoDescription,
    status: page.status as 'draft' | 'published',
    publishedAt: page.publishedAt?.toISOString() ?? null,
    createdAt: page.createdAt.toISOString(),
    updatedAt: page.updatedAt.toISOString(),
  }
}

export class ContentPagesRepository {
  constructor(private db: CmsDatabase) {}

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
    const rows = await this.db.select().from(contentPages).where(eq(contentPages.id, id)).limit(1)
    return rows[0] ?? null
  }

  async findBySlug(slug: string) {
    const rows = await this.db.select().from(contentPages).where(eq(contentPages.slug, slug)).limit(1)
    return rows[0] ?? null
  }

  async findPublishedBySlug(slug: string) {
    const rows = await this.db
      .select()
      .from(contentPages)
      .where(and(eq(contentPages.slug, slug), eq(contentPages.status, 'published')))
      .limit(1)
    return rows[0] ?? null
  }

  async slugExists(slug: string, excludedId?: string) {
    const filters = [eq(contentPages.slug, slug)]
    if (excludedId) filters.push(ne(contentPages.id, excludedId))
    const rows = await this.db
      .select({ id: contentPages.id })
      .from(contentPages)
      .where(and(...filters))
      .limit(1)
    return Boolean(rows[0])
  }

  async list(query: ContentPageListQuery) {
    const filters = []
    if (query.status) filters.push(eq(contentPages.status, query.status))
    if (query.search)
      filters.push(or(ilike(contentPages.title, `%${query.search}%`), ilike(contentPages.slug, `%${query.search}%`))!)

    const offset = (query.page - 1) * query.limit
    const whereClause = filters.length > 0 ? and(...filters) : undefined
    const [rows, countRows] = await Promise.all([
      this.db
        .select()
        .from(contentPages)
        .where(whereClause)
        .orderBy(desc(contentPages.updatedAt))
        .limit(query.limit)
        .offset(offset),
      this.db.select({ total: count() }).from(contentPages).where(whereClause),
    ])
    return { rows, total: countRows[0]?.total ?? 0 }
  }

  async create(data: Pick<ContentPageInput, 'slug' | 'title' | 'lead' | 'body' | 'seoTitle' | 'seoDescription'>) {
    const rows = await this.db
      .insert(contentPages)
      .values({
        slug: data.slug,
        title: data.title,
        lead: data.lead,
        body: data.body,
        seoTitle: data.seoTitle,
        seoDescription: data.seoDescription,
        status: 'draft',
      })
      .returning()
    const created = rows[0]
    if (!created) throw new Error('Content page was not created')
    return created
  }

  async update(
    id: string,
    data: Pick<ContentPageInput, 'slug' | 'title' | 'lead' | 'body' | 'seoTitle' | 'seoDescription'>,
  ) {
    const rows = await this.db
      .update(contentPages)
      .set({
        slug: data.slug,
        title: data.title,
        lead: data.lead,
        body: data.body,
        seoTitle: data.seoTitle,
        seoDescription: data.seoDescription,
        updatedAt: new Date(),
      })
      .where(eq(contentPages.id, id))
      .returning()
    return rows[0] ?? null
  }

  async publish(id: string, existingPublishedAt: Date | null) {
    const now = new Date()
    const rows = await this.db
      .update(contentPages)
      .set({
        status: 'published',
        publishedAt: existingPublishedAt ?? now,
        updatedAt: now,
      })
      .where(eq(contentPages.id, id))
      .returning()
    return rows[0] ?? null
  }

  async unpublish(id: string) {
    const rows = await this.db
      .update(contentPages)
      .set({ status: 'draft', updatedAt: new Date() })
      .where(eq(contentPages.id, id))
      .returning()
    return rows[0] ?? null
  }

  async hardDelete(id: string) {
    await this.db.delete(contentPages).where(eq(contentPages.id, id))
  }
}
