import { postResponseSchema, type PostInput, type PostListQuery } from '@iorder/contracts'

import type { HookManager } from '../../shared/hooks/index.js'
import {
  CoverMediaNotFoundError,
  PostNotFoundError,
  RevisionIncompatibleError,
  RevisionNotFoundError,
  SlugExistsError,
} from './posts.errors.js'
import { POST_EVENTS } from './posts.hooks.js'
import { EMPTY_TAXONOMY, serializePost, type PostsRepository } from './posts.repository.js'

// Logger tối thiểu tương thích Fastify's app.log (pino) — service không phụ thuộc trực tiếp vào Fastify.
export type ServiceLogger = {
  error: (obj: unknown, msg?: string) => void
}

const noopLogger: ServiceLogger = { error: () => {} }

// userId dùng cho các thao tác hệ thống (không do một user CMS cụ thể thực hiện), ví dụ scheduler tự động publish.
export const SYSTEM_ACTOR_USER_ID = null

// Đếm lượt xem có chống trùng: cùng một người xem (IP + trình duyệt) trong 30 phút
// chỉ tính 1 lượt. Lưu tạm trong bộ nhớ tiến trình — đủ cho mục đích thống kê.
const VIEW_DEDUP_WINDOW_MS = 30 * 60 * 1000

export class PostsService {
  private recentViews = new Map<string, number>()

  constructor(
    private repository: PostsRepository,
    private hooks: HookManager,
  ) {}

  private shouldCountView(key: string) {
    const now = Date.now()
    const last = this.recentViews.get(key)
    if (last && now - last < VIEW_DEDUP_WINDOW_MS) return false
    this.recentViews.set(key, now)
    if (this.recentViews.size > 5000) {
      for (const [entryKey, timestamp] of this.recentViews) {
        if (now - timestamp > VIEW_DEDUP_WINDOW_MS) this.recentViews.delete(entryKey)
      }
    }
    return true
  }

  async list(query: PostListQuery) {
    const { rows, total } = await this.repository.list(query)
    const tax = await this.repository.loadTaxonomy(rows.map((row) => row.post.id))
    return {
      items: rows.map((row) => serializePost(row.post, row.coverUrl, tax.get(row.post.id), row.authorName)),
      total,
      page: query.page,
      limit: query.limit,
    }
  }

  async getById(id: string) {
    const row = await this.repository.findById(id)
    if (!row) throw new PostNotFoundError()
    return {
      item: serializePost(row.post, row.coverUrl, await this.repository.taxonomyFor(row.post.id), row.authorName),
    }
  }

  async create(input: PostInput, authorId: string) {
    if (await this.repository.slugExists(input.slug)) throw new SlugExistsError()
    if (!(await this.repository.coverExists(input.coverMediaId))) throw new CoverMediaNotFoundError()

    const created = await this.repository.create({
      authorId,
      coverMediaId: input.coverMediaId,
      type: input.type,
      title: input.title,
      slug: input.slug,
      excerpt: input.excerpt,
      body: input.body,
      category: input.category,
      checklist: input.checklist,
      seoTitle: input.seoTitle,
      seoDescription: input.seoDescription,
      canonicalUrl: input.canonicalUrl,
      promotionStartAt: input.promotionStartAt,
      promotionEndAt: input.promotionEndAt,
      scheduledAt: input.scheduledAt,
      ctaLabel: input.ctaLabel,
      ctaUrl: input.ctaUrl,
      badgeText: input.badgeText,
    })

    await this.repository.syncCategories(created.id, input.categoryIds)
    await this.repository.syncTags(created.id, input.tags)
    await this.repository.createRevision(created, authorId, 'Created draft')
    await this.repository.insertAuditLog({
      userId: authorId,
      action: 'post.create',
      entityType: 'post',
      entityId: created.id,
      afterData: serializePost(created),
    })

    await this.hooks.emit(POST_EVENTS.CREATED, { postId: created.id })

    const createdWithCover = await this.repository.findById(created.id)
    return {
      statusCode: 201,
      item: serializePost(
        created,
        createdWithCover?.coverUrl ?? null,
        await this.repository.taxonomyFor(created.id),
        createdWithCover?.authorName ?? null,
      ),
    }
  }

  async update(id: string, input: PostInput, editorId: string) {
    const existing = await this.repository.findById(id)
    if (!existing) throw new PostNotFoundError()
    if (await this.repository.slugExists(input.slug, id)) throw new SlugExistsError()
    if (!(await this.repository.coverExists(input.coverMediaId))) throw new CoverMediaNotFoundError()

    const updated = await this.repository.update(id, {
      coverMediaId: input.coverMediaId,
      type: input.type,
      title: input.title,
      slug: input.slug,
      excerpt: input.excerpt,
      body: input.body,
      category: input.category,
      checklist: input.checklist,
      seoTitle: input.seoTitle,
      seoDescription: input.seoDescription,
      canonicalUrl: input.canonicalUrl,
      promotionStartAt: input.promotionStartAt,
      promotionEndAt: input.promotionEndAt,
      scheduledAt: input.scheduledAt,
      ctaLabel: input.ctaLabel,
      ctaUrl: input.ctaUrl,
      badgeText: input.badgeText,
    })
    if (!updated) throw new PostNotFoundError()

    await this.repository.syncCategories(updated.id, input.categoryIds)
    await this.repository.syncTags(updated.id, input.tags)
    await this.repository.createRevision(updated, editorId, 'Updated content')
    await this.repository.insertAuditLog({
      userId: editorId,
      action: 'post.update',
      entityType: 'post',
      entityId: updated.id,
      beforeData: serializePost(existing.post),
      afterData: serializePost(updated),
    })

    await this.hooks.emit(POST_EVENTS.UPDATED, { postId: updated.id })

    const updatedWithCover = await this.repository.findById(updated.id)
    return {
      item: serializePost(
        updated,
        updatedWithCover?.coverUrl ?? null,
        await this.repository.taxonomyFor(updated.id),
        updatedWithCover?.authorName ?? null,
      ),
    }
  }

  async publish(id: string, editorId: string) {
    const existing = await this.repository.findById(id)
    if (!existing) throw new PostNotFoundError()
    const updated = await this.repository.setStatus(id, 'published')
    if (!updated) throw new PostNotFoundError()

    await this.repository.createRevision(updated, editorId, 'Published')
    await this.repository.insertAuditLog({
      userId: editorId,
      action: 'post.publish',
      entityType: 'post',
      entityId: updated.id,
    })
    await this.hooks.emit(POST_EVENTS.PUBLISHED, { postId: updated.id })

    return {
      item: serializePost(
        updated,
        existing.coverUrl,
        await this.repository.taxonomyFor(updated.id),
        existing.authorName,
      ),
    }
  }

  async archive(id: string, editorId: string) {
    const existing = await this.repository.findById(id)
    if (!existing) throw new PostNotFoundError()
    const updated = await this.repository.setStatus(id, 'archived')
    if (!updated) throw new PostNotFoundError()

    await this.repository.createRevision(updated, editorId, 'Archived')
    await this.repository.insertAuditLog({
      userId: editorId,
      action: 'post.archive',
      entityType: 'post',
      entityId: updated.id,
    })
    await this.hooks.emit(POST_EVENTS.ARCHIVED, { postId: updated.id })

    return {
      item: serializePost(
        updated,
        existing.coverUrl,
        await this.repository.taxonomyFor(updated.id),
        existing.authorName,
      ),
    }
  }

  // Gỡ xuất bản: đưa bài viết đã đăng về bản nháp (không xóa dữ liệu, khác với archive/ẩn).
  async unpublish(id: string, editorId: string) {
    const existing = await this.repository.findById(id)
    if (!existing) throw new PostNotFoundError()
    const updated = await this.repository.setStatus(id, 'draft')
    if (!updated) throw new PostNotFoundError()

    await this.repository.createRevision(updated, editorId, 'Unpublished')
    await this.repository.insertAuditLog({
      userId: editorId,
      action: 'post.unpublish',
      entityType: 'post',
      entityId: updated.id,
    })
    await this.hooks.emit(POST_EVENTS.UNPUBLISHED, { postId: updated.id })

    return {
      item: serializePost(
        updated,
        existing.coverUrl,
        await this.repository.taxonomyFor(updated.id),
        existing.authorName,
      ),
    }
  }

  async listRevisions(id: string) {
    const existing = await this.repository.findById(id)
    if (!existing) throw new PostNotFoundError()
    return { items: await this.repository.listRevisions(id) }
  }

  async getRevision(id: string, version: number) {
    const existing = await this.repository.findById(id)
    if (!existing) throw new PostNotFoundError()
    const row = await this.repository.findRevisionByVersion(id, version)
    if (!row) throw new RevisionNotFoundError()
    return { item: row }
  }

  // Khôi phục về nội dung của một phiên bản cũ dưới dạng bản nháp mới, tạo revision mới ghi lại thao tác.
  async restoreRevision(id: string, version: number, editorId: string) {
    const existing = await this.repository.findById(id)
    if (!existing) throw new PostNotFoundError()

    const row = await this.repository.findRevisionByVersion(id, version)
    if (!row) throw new RevisionNotFoundError()

    const parsedSnapshot = postResponseSchema.safeParse(row.snapshot)
    if (!parsedSnapshot.success) throw new RevisionIncompatibleError()
    const snapshot = parsedSnapshot.data

    if (!(await this.repository.coverExists(snapshot.coverMediaId))) throw new CoverMediaNotFoundError()

    const updated = await this.repository.update(id, {
      coverMediaId: snapshot.coverMediaId,
      type: snapshot.type,
      title: snapshot.title,
      slug: existing.post.slug,
      excerpt: snapshot.excerpt,
      body: snapshot.body,
      category: snapshot.category,
      checklist: snapshot.checklist,
      seoTitle: snapshot.seoTitle,
      seoDescription: snapshot.seoDescription,
      canonicalUrl: snapshot.canonicalUrl,
      promotionStartAt: snapshot.promotionStartAt ? new Date(snapshot.promotionStartAt) : null,
      promotionEndAt: snapshot.promotionEndAt ? new Date(snapshot.promotionEndAt) : null,
      // Không khôi phục scheduledAt đã qua: scheduler sẽ tự publish bản nháp vừa khôi phục trong 60s.
      // Chỉ giữ lại lịch hẹn nếu mốc thời gian vẫn ở tương lai.
      scheduledAt:
        snapshot.scheduledAt && new Date(snapshot.scheduledAt) > new Date() ? new Date(snapshot.scheduledAt) : null,
      ctaLabel: snapshot.ctaLabel,
      ctaUrl: snapshot.ctaUrl,
      badgeText: snapshot.badgeText,
    })
    if (!updated) throw new PostNotFoundError()

    const draftPost = await this.repository.setStatus(updated.id, 'draft')
    if (!draftPost) throw new PostNotFoundError()

    await this.repository.syncCategories(
      draftPost.id,
      snapshot.categories.map((category) => category.id),
    )
    await this.repository.syncTags(
      draftPost.id,
      snapshot.tags.map((tag) => tag.name),
    )
    await this.repository.createRevision(draftPost, editorId, `Khôi phục phiên bản ${version}`)
    await this.repository.insertAuditLog({
      userId: editorId,
      action: 'post.restore',
      entityType: 'post',
      entityId: draftPost.id,
      afterData: { restoredVersion: version },
    })
    await this.hooks.emit(POST_EVENTS.RESTORED, { postId: draftPost.id })

    return {
      item: serializePost(
        draftPost,
        existing.coverUrl,
        await this.repository.taxonomyFor(draftPost.id),
        existing.authorName,
      ),
    }
  }

  // Quét các bài viết đã đến hạn hẹn giờ (scheduledAt <= now) và tự động publish.
  // Dùng bởi scheduler nền (shared/scheduler/post-scheduler.ts) — cũng gọi được trực tiếp từ smoke test.
  // Mỗi bài được publish độc lập: một bài lỗi không được chặn các bài còn lại.
  async publishDueScheduled(logger: ServiceLogger = noopLogger) {
    const due = await this.repository.findDueScheduled()
    const published: ReturnType<typeof serializePost>[] = []

    for (const post of due) {
      try {
        const updated = await this.repository.setStatus(post.id, 'published')
        if (!updated) continue

        await this.repository.createRevision(updated, SYSTEM_ACTOR_USER_ID, 'Auto-published by scheduler')
        await this.repository.insertAuditLog({
          userId: SYSTEM_ACTOR_USER_ID,
          action: 'post.publish.scheduled',
          entityType: 'post',
          entityId: updated.id,
        })
        await this.hooks.emit(POST_EVENTS.PUBLISHED, { postId: updated.id })

        published.push(serializePost(updated))
      } catch (error) {
        logger.error({ err: error, postId: post.id }, 'Failed to auto-publish scheduled post')
      }
    }

    return { published, count: published.length }
  }

  async delete(id: string, editorId: string) {
    const existing = await this.repository.findById(id)
    if (!existing) throw new PostNotFoundError()

    await this.repository.softDelete(id)
    await this.repository.insertAuditLog({
      userId: editorId,
      action: 'post.delete',
      entityType: 'post',
      entityId: id,
    })
    await this.hooks.emit(POST_EVENTS.DELETED, { postId: id })
  }

  async listPublic(query: Pick<PostListQuery, 'type' | 'category' | 'page' | 'limit'>) {
    const rows = await this.repository.listPublic(query)
    const tax = await this.repository.loadTaxonomy(rows.map((row) => row.post.id))
    return {
      items: rows.map((row) => serializePost(row.post, row.coverUrl, tax.get(row.post.id) ?? EMPTY_TAXONOMY)),
      page: query.page,
      limit: query.limit,
    }
  }

  async getPublicBySlug(slug: string, viewerContext: { ip: string; userAgent: string }) {
    const row = await this.repository.findPublicBySlug(slug)
    if (!row) throw new PostNotFoundError()

    let viewCount = row.post.viewCount
    const viewerKey = `${row.post.id}|${viewerContext.ip}|${viewerContext.userAgent}`
    if (this.shouldCountView(viewerKey)) {
      viewCount += 1
      await this.repository.incrementViewCount(row.post.id)
    }
    return {
      item: serializePost({ ...row.post, viewCount }, row.coverUrl, await this.repository.taxonomyFor(row.post.id)),
    }
  }
}
