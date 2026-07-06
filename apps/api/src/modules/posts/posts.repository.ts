import type { PostInput, PostListQuery } from '@iorder/contracts'
import type { CmsDatabase } from '@iorder/database'
import {
  auditLogs,
  categories,
  mediaAssets,
  postCategories,
  postRevisions,
  postTags,
  posts,
  tags,
  users,
} from '@iorder/database'
import { and, count, desc, eq, ilike, inArray, isNull, lte, max, ne, or, sql } from 'drizzle-orm'

import { slugify } from '../categories/categories.repository.js'

export type PostRecord = typeof posts.$inferSelect
export type TaxRef = { id: string; name: string; slug: string }
export type PostTaxonomy = { categories: TaxRef[]; tags: TaxRef[] }
export const EMPTY_TAXONOMY: PostTaxonomy = { categories: [], tags: [] }

function postBody(post: PostRecord) {
  const body = (post.contentJson as { body?: unknown }).body
  return typeof body === 'string' ? body : ''
}

function postMetadata(post: PostRecord) {
  const content = post.contentJson as { category?: unknown; checklist?: unknown }
  return {
    category: typeof content.category === 'string' ? content.category : null,
    checklist: Array.isArray(content.checklist)
      ? content.checklist.filter((item): item is string => typeof item === 'string')
      : [],
  }
}

export function serializePost(
  post: PostRecord,
  coverUrl: string | null = null,
  taxonomy: PostTaxonomy = EMPTY_TAXONOMY,
  authorName: string | null = null,
) {
  return {
    id: post.id,
    type: post.type,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    body: postBody(post),
    ...postMetadata(post),
    status: post.status,
    coverMediaId: post.coverMediaId,
    coverUrl,
    seoTitle: post.seoTitle,
    seoDescription: post.seoDescription,
    canonicalUrl: post.canonicalUrl,
    promotionStartAt: post.promotionStartAt?.toISOString() ?? null,
    promotionEndAt: post.promotionEndAt?.toISOString() ?? null,
    scheduledAt: post.scheduledAt?.toISOString() ?? null,
    authorId: post.authorId,
    authorName,
    ctaLabel: post.ctaLabel,
    ctaUrl: post.ctaUrl,
    badgeText: post.badgeText,
    viewCount: post.viewCount,
    categories: taxonomy.categories,
    tags: taxonomy.tags,
    publishedAt: post.publishedAt?.toISOString() ?? null,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
  }
}

export class PostsRepository {
  constructor(private db: CmsDatabase) {}

  // Lấy chuyên mục + thẻ cho nhiều bài (tránh N+1).
  async loadTaxonomy(postIds: string[]) {
    const map = new Map<string, PostTaxonomy>()
    if (postIds.length === 0) return map
    for (const id of postIds) map.set(id, { categories: [], tags: [] })
    const [catRows, tagRows] = await Promise.all([
      this.db
        .select({ postId: postCategories.postId, id: categories.id, name: categories.name, slug: categories.slug })
        .from(postCategories)
        .innerJoin(categories, eq(categories.id, postCategories.categoryId))
        .where(inArray(postCategories.postId, postIds)),
      this.db
        .select({ postId: postTags.postId, id: tags.id, name: tags.name, slug: tags.slug })
        .from(postTags)
        .innerJoin(tags, eq(tags.id, postTags.tagId))
        .where(inArray(postTags.postId, postIds)),
    ])
    for (const row of catRows) map.get(row.postId)?.categories.push({ id: row.id, name: row.name, slug: row.slug })
    for (const row of tagRows) map.get(row.postId)?.tags.push({ id: row.id, name: row.name, slug: row.slug })
    return map
  }

  async taxonomyFor(postId: string): Promise<PostTaxonomy> {
    return (await this.loadTaxonomy([postId])).get(postId) ?? { categories: [], tags: [] }
  }

  async syncCategories(postId: string, categoryIds: string[]) {
    await this.db.delete(postCategories).where(eq(postCategories.postId, postId))
    if (categoryIds.length === 0) return
    const valid = await this.db
      .select({ id: categories.id })
      .from(categories)
      .where(inArray(categories.id, categoryIds))
    if (valid.length) await this.db.insert(postCategories).values(valid.map((row) => ({ postId, categoryId: row.id })))
  }

  async syncTags(postId: string, tagNames: string[]) {
    await this.db.delete(postTags).where(eq(postTags.postId, postId))
    const names = [...new Set(tagNames.map((name) => name.trim()).filter(Boolean))]
    if (names.length === 0) return
    const ids: string[] = []
    for (const name of names) {
      const slug = slugify(name) || name.toLowerCase()
      const [existing] = await this.db.select({ id: tags.id }).from(tags).where(eq(tags.slug, slug)).limit(1)
      if (existing) {
        ids.push(existing.id)
        continue
      }
      const [created] = await this.db.insert(tags).values({ name, slug }).returning({ id: tags.id })
      if (created) ids.push(created.id)
    }
    if (ids.length) await this.db.insert(postTags).values(ids.map((tagId) => ({ postId, tagId })))
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

  async slugExists(slug: string, excludedId?: string) {
    const filters = [eq(posts.slug, slug), isNull(posts.deletedAt)]
    if (excludedId) filters.push(ne(posts.id, excludedId))
    const [post] = await this.db
      .select({ id: posts.id })
      .from(posts)
      .where(and(...filters))
      .limit(1)
    return Boolean(post)
  }

  async createRevision(post: PostRecord, editorId: string | null, changeNote: string) {
    const [current] = await this.db
      .select({ version: max(postRevisions.versionNumber) })
      .from(postRevisions)
      .where(eq(postRevisions.postId, post.id))

    await this.db.insert(postRevisions).values({
      postId: post.id,
      editorId,
      versionNumber: (current?.version ?? 0) + 1,
      title: post.title,
      contentSnapshot: serializePost(post),
      changeNote,
    })
  }

  async insertAuditLog(entry: {
    userId: string | null
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
      .select({ post: posts, coverUrl: mediaAssets.publicUrl, authorName: users.fullName })
      .from(posts)
      .leftJoin(mediaAssets, eq(posts.coverMediaId, mediaAssets.id))
      .leftJoin(users, eq(posts.authorId, users.id))
      .where(and(eq(posts.id, id), isNull(posts.deletedAt)))
      .limit(1)
    return row ?? null
  }

  async list(query: PostListQuery) {
    const filters = [isNull(posts.deletedAt)]
    if (query.type) filters.push(eq(posts.type, query.type))
    if (query.status) filters.push(eq(posts.status, query.status))
    if (query.search) filters.push(ilike(posts.title, `%${query.search}%`))
    const where = and(...filters)
    const offset = (query.page - 1) * query.limit
    const [rows, totals] = await Promise.all([
      this.db
        .select({ post: posts, coverUrl: mediaAssets.publicUrl, authorName: users.fullName })
        .from(posts)
        .leftJoin(mediaAssets, eq(posts.coverMediaId, mediaAssets.id))
        .leftJoin(users, eq(posts.authorId, users.id))
        .where(where)
        .orderBy(desc(posts.updatedAt))
        .limit(query.limit)
        .offset(offset),
      this.db.select({ value: count() }).from(posts).where(where),
    ])
    return { rows, total: totals[0]?.value ?? 0 }
  }

  async create(
    data: Pick<
      PostInput,
      | 'coverMediaId'
      | 'type'
      | 'title'
      | 'slug'
      | 'excerpt'
      | 'body'
      | 'category'
      | 'checklist'
      | 'seoTitle'
      | 'seoDescription'
      | 'canonicalUrl'
      | 'promotionStartAt'
      | 'promotionEndAt'
      | 'scheduledAt'
      | 'ctaLabel'
      | 'ctaUrl'
      | 'badgeText'
    > & { authorId: string },
  ) {
    const [created] = await this.db
      .insert(posts)
      .values({
        authorId: data.authorId,
        coverMediaId: data.coverMediaId,
        type: data.type,
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt,
        contentJson: { body: data.body, category: data.category, checklist: data.checklist },
        status: 'draft',
        seoTitle: data.seoTitle,
        seoDescription: data.seoDescription,
        canonicalUrl: data.canonicalUrl,
        promotionStartAt: data.promotionStartAt,
        promotionEndAt: data.promotionEndAt,
        scheduledAt: data.scheduledAt,
        ctaLabel: data.ctaLabel,
        ctaUrl: data.ctaUrl,
        badgeText: data.badgeText,
      })
      .returning()
    if (!created) throw new Error('Post was not created')
    return created
  }

  async update(
    id: string,
    data: Pick<
      PostInput,
      | 'coverMediaId'
      | 'type'
      | 'title'
      | 'slug'
      | 'excerpt'
      | 'body'
      | 'category'
      | 'checklist'
      | 'seoTitle'
      | 'seoDescription'
      | 'canonicalUrl'
      | 'promotionStartAt'
      | 'promotionEndAt'
      | 'scheduledAt'
      | 'ctaLabel'
      | 'ctaUrl'
      | 'badgeText'
    >,
  ) {
    const [updated] = await this.db
      .update(posts)
      .set({
        coverMediaId: data.coverMediaId,
        type: data.type,
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt,
        contentJson: { body: data.body, category: data.category, checklist: data.checklist },
        seoTitle: data.seoTitle,
        seoDescription: data.seoDescription,
        canonicalUrl: data.canonicalUrl,
        promotionStartAt: data.promotionStartAt,
        promotionEndAt: data.promotionEndAt,
        scheduledAt: data.scheduledAt,
        ctaLabel: data.ctaLabel,
        ctaUrl: data.ctaUrl,
        badgeText: data.badgeText,
        updatedAt: new Date(),
      })
      .where(eq(posts.id, id))
      .returning()
    return updated ?? null
  }

  async softDelete(id: string) {
    await this.db.update(posts).set({ deletedAt: new Date(), updatedAt: new Date() }).where(eq(posts.id, id))
  }

  // Bài viết đã đến hạn hẹn giờ nhưng chưa publish: scheduledAt <= now, chưa publish, chưa xóa mềm.
  // Enum status hiện tại chỉ có draft/published/archived (không có giá trị 'scheduled'),
  // nên điều kiện quét dựa vào scheduledAt + status khác 'published'.
  async findDueScheduled(now: Date = new Date()) {
    return this.db
      .select()
      .from(posts)
      .where(
        and(
          isNull(posts.deletedAt),
          ne(posts.status, 'published'),
          lte(posts.scheduledAt, now),
          sql`${posts.scheduledAt} is not null`,
        ),
      )
      .orderBy(posts.scheduledAt)
  }

  async setStatus(id: string, status: 'draft' | 'published' | 'archived') {
    const [updated] = await this.db
      .update(posts)
      .set({
        status,
        ...(status === 'published' ? { publishedAt: new Date() } : {}),
        updatedAt: new Date(),
      })
      .where(eq(posts.id, id))
      .returning()
    return updated ?? null
  }

  // Danh sách tóm tắt các phiên bản (không kèm snapshot đầy đủ) — mới nhất trước.
  async listRevisions(postId: string) {
    const rows = await this.db
      .select({
        versionNumber: postRevisions.versionNumber,
        changeNote: postRevisions.changeNote,
        editorName: users.fullName,
        createdAt: postRevisions.createdAt,
      })
      .from(postRevisions)
      .leftJoin(users, eq(postRevisions.editorId, users.id))
      .where(eq(postRevisions.postId, postId))
      .orderBy(desc(postRevisions.versionNumber))
      .limit(50)
    return rows.map((row) => ({
      version: row.versionNumber,
      changeNote: row.changeNote,
      editorName: row.editorName,
      createdAt: row.createdAt.toISOString(),
    }))
  }

  async findRevisionByVersion(postId: string, version: number) {
    const [row] = await this.db
      .select({
        versionNumber: postRevisions.versionNumber,
        changeNote: postRevisions.changeNote,
        editorName: users.fullName,
        createdAt: postRevisions.createdAt,
        snapshot: postRevisions.contentSnapshot,
      })
      .from(postRevisions)
      .leftJoin(users, eq(postRevisions.editorId, users.id))
      .where(and(eq(postRevisions.postId, postId), eq(postRevisions.versionNumber, version)))
      .limit(1)
    if (!row) return null
    return {
      version: row.versionNumber,
      changeNote: row.changeNote,
      editorName: row.editorName,
      createdAt: row.createdAt.toISOString(),
      snapshot: row.snapshot,
    }
  }

  async incrementViewCount(id: string) {
    // Tăng ngầm, không chặn phản hồi; lỗi (nếu có) bỏ qua.
    void this.db
      .update(posts)
      .set({ viewCount: sql`${posts.viewCount} + 1` })
      .where(eq(posts.id, id))
      .then(undefined, () => {})
  }

  async listPublic(query: Pick<PostListQuery, 'type' | 'category' | 'page' | 'limit'>) {
    const filters = [eq(posts.status, 'published'), isNull(posts.deletedAt), lte(posts.publishedAt, new Date())]
    if (query.type) filters.push(eq(posts.type, query.type))
    if (query.category) {
      filters.push(
        inArray(
          posts.id,
          this.db
            .select({ id: postCategories.postId })
            .from(postCategories)
            .innerJoin(categories, eq(categories.id, postCategories.categoryId))
            .where(eq(categories.slug, query.category)),
        ),
      )
    }
    const offset = (query.page - 1) * query.limit
    const rows = await this.db
      .select({ post: posts, coverUrl: mediaAssets.publicUrl })
      .from(posts)
      .leftJoin(mediaAssets, eq(posts.coverMediaId, mediaAssets.id))
      .where(and(...filters))
      .orderBy(desc(posts.publishedAt))
      .limit(query.limit)
      .offset(offset)
    return rows
  }

  async findPublicBySlug(slug: string) {
    const [row] = await this.db
      .select({ post: posts, coverUrl: mediaAssets.publicUrl })
      .from(posts)
      .leftJoin(mediaAssets, eq(posts.coverMediaId, mediaAssets.id))
      .where(
        and(
          eq(posts.slug, slug),
          eq(posts.status, 'published'),
          isNull(posts.deletedAt),
          or(isNull(posts.publishedAt), lte(posts.publishedAt, new Date())),
        ),
      )
      .limit(1)
    return row ?? null
  }
}
