import type { TestimonialInput } from '@iorder/contracts'
import type { CmsDatabase } from '@iorder/database'
import { auditLogs, mediaAssets, testimonials } from '@iorder/database'
import { asc, eq } from 'drizzle-orm'

export type TestimonialRecord = typeof testimonials.$inferSelect

export function serializeTestimonial(item: TestimonialRecord, avatarUrl: string | null = null) {
  return {
    id: item.id,
    authorName: item.authorName,
    authorRole: item.authorRole,
    company: item.company,
    quote: item.quote,
    rating: item.rating,
    avatarMediaId: item.avatarMediaId,
    avatarUrl,
    sortOrder: item.sortOrder,
    isEnabled: item.isEnabled,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }
}

export class TestimonialsRepository {
  constructor(private db: CmsDatabase) {}

  async avatarExists(id: string | null) {
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
      .select({ item: testimonials, avatarUrl: mediaAssets.publicUrl })
      .from(testimonials)
      .leftJoin(mediaAssets, eq(testimonials.avatarMediaId, mediaAssets.id))
      .where(eq(testimonials.id, id))
      .limit(1)
    return row ?? null
  }

  async list() {
    return this.db
      .select({ item: testimonials, avatarUrl: mediaAssets.publicUrl })
      .from(testimonials)
      .leftJoin(mediaAssets, eq(testimonials.avatarMediaId, mediaAssets.id))
      .orderBy(asc(testimonials.sortOrder), asc(testimonials.authorName))
  }

  async create(data: TestimonialInput) {
    const [created] = await this.db
      .insert(testimonials)
      .values({
        authorName: data.authorName,
        authorRole: data.authorRole,
        company: data.company,
        quote: data.quote,
        rating: data.rating,
        avatarMediaId: data.avatarMediaId,
        sortOrder: data.sortOrder,
        isEnabled: data.isEnabled,
      })
      .returning()
    if (!created) throw new Error('Testimonial was not created')
    return created
  }

  async update(id: string, data: TestimonialInput) {
    const [updated] = await this.db
      .update(testimonials)
      .set({
        authorName: data.authorName,
        authorRole: data.authorRole,
        company: data.company,
        quote: data.quote,
        rating: data.rating,
        avatarMediaId: data.avatarMediaId,
        sortOrder: data.sortOrder,
        isEnabled: data.isEnabled,
        updatedAt: new Date(),
      })
      .where(eq(testimonials.id, id))
      .returning()
    return updated ?? null
  }

  async delete(id: string) {
    await this.db.delete(testimonials).where(eq(testimonials.id, id))
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
      .select({ item: testimonials, avatarUrl: mediaAssets.publicUrl })
      .from(testimonials)
      .leftJoin(mediaAssets, eq(testimonials.avatarMediaId, mediaAssets.id))
      .where(eq(testimonials.isEnabled, true))
      .orderBy(asc(testimonials.sortOrder), asc(testimonials.authorName))
  }
}
