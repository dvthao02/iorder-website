import type { CategoryInput } from '@iorder/contracts'
import type { CmsDatabase } from '@iorder/database'
import { auditLogs, categories, postCategories, posts } from '@iorder/database'
import { and, asc, eq, isNull, ne, sql } from 'drizzle-orm'

export type CategoryRecord = typeof categories.$inferSelect

export function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function serializeCategory(category: CategoryRecord, postCount = 0) {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    parentId: category.parentId,
    sortOrder: category.sortOrder,
    postCount,
  }
}

export class CategoriesRepository {
  constructor(private db: CmsDatabase) {}

  async uniqueSlug(base: string, excludedId?: string) {
    const root = base || 'chuyen-muc'
    let slug = root
    let counter = 1
    // Lặp tới khi slug chưa tồn tại (bỏ qua chính bản ghi đang sửa).
    while (true) {
      const filters = excludedId
        ? and(eq(categories.slug, slug), ne(categories.id, excludedId))
        : eq(categories.slug, slug)
      const [existing] = await this.db.select({ id: categories.id }).from(categories).where(filters).limit(1)
      if (!existing) return slug
      counter += 1
      slug = `${root}-${counter}`
    }
  }

  async findById(id: string) {
    const [row] = await this.db.select().from(categories).where(eq(categories.id, id)).limit(1)
    return row ?? null
  }

  async list() {
    return this.db
      .select({ category: categories, postCount: sql<number>`count(${postCategories.postId})::int` })
      .from(categories)
      .leftJoin(postCategories, eq(postCategories.categoryId, categories.id))
      .groupBy(categories.id)
      .orderBy(asc(categories.sortOrder), asc(categories.name))
  }

  async create(data: CategoryInput, slug: string) {
    const [created] = await this.db
      .insert(categories)
      .values({
        name: data.name,
        slug,
        description: data.description,
        parentId: data.parentId,
        sortOrder: data.sortOrder,
      })
      .returning()
    if (!created) throw new Error('Category was not created')
    return created
  }

  async update(id: string, data: CategoryInput, slug: string) {
    const [updated] = await this.db
      .update(categories)
      .set({
        name: data.name,
        slug,
        description: data.description,
        parentId: data.parentId,
        sortOrder: data.sortOrder,
        updatedAt: new Date(),
      })
      .where(eq(categories.id, id))
      .returning()
    return updated ?? null
  }

  async delete(id: string) {
    await this.db.delete(categories).where(eq(categories.id, id))
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
      .select({ category: categories, postCount: sql<number>`count(${posts.id})::int` })
      .from(categories)
      .leftJoin(postCategories, eq(postCategories.categoryId, categories.id))
      .leftJoin(posts, and(eq(posts.id, postCategories.postId), eq(posts.status, 'published'), isNull(posts.deletedAt)))
      .groupBy(categories.id)
      .orderBy(asc(categories.sortOrder), asc(categories.name))
  }
}
