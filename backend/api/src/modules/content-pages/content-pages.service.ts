import type { ContentPageInput, ContentPageListQuery } from '@iorder/contracts'

import type { HookManager } from '../../shared/hooks/index.js'
import { CONTENT_PAGE_EVENTS } from './content-pages.hooks.js'
import { serializeContentPage, type ContentPagesRepository } from './content-pages.repository.js'
import { ContentPageNotFoundError, ContentPageSlugExistsError } from './content-pages.errors.js'

export class ContentPagesService {
  constructor(
    private repository: ContentPagesRepository,
    private hooks: HookManager,
  ) {}

  async list(query: ContentPageListQuery) {
    const { rows, total } = await this.repository.list(query)
    return { items: rows.map(serializeContentPage), total, page: query.page, limit: query.limit }
  }

  async getById(id: string) {
    const page = await this.repository.findById(id)
    if (!page) throw new ContentPageNotFoundError()
    return { item: serializeContentPage(page) }
  }

  async create(input: ContentPageInput, editorId: string) {
    if (await this.repository.slugExists(input.slug)) throw new ContentPageSlugExistsError()

    const created = await this.repository.create(input)
    await this.repository.insertAuditLog({
      userId: editorId,
      action: 'content_page.create',
      entityType: 'content_page',
      entityId: created.id,
      afterData: serializeContentPage(created),
    })

    await this.hooks.emit(CONTENT_PAGE_EVENTS.CREATED, { contentPageId: created.id })

    return { statusCode: 201, item: serializeContentPage(created) }
  }

  async update(id: string, input: ContentPageInput, editorId: string) {
    const existing = await this.repository.findById(id)
    if (!existing) throw new ContentPageNotFoundError()
    if (input.slug !== existing.slug && (await this.repository.slugExists(input.slug, id)))
      throw new ContentPageSlugExistsError()

    const updated = await this.repository.update(id, input)
    if (!updated) throw new ContentPageNotFoundError()

    await this.repository.insertAuditLog({
      userId: editorId,
      action: 'content_page.update',
      entityType: 'content_page',
      entityId: id,
      beforeData: serializeContentPage(existing),
      afterData: serializeContentPage(updated),
    })

    await this.hooks.emit(CONTENT_PAGE_EVENTS.UPDATED, { contentPageId: id })

    return { item: serializeContentPage(updated) }
  }

  async publish(id: string, editorId: string) {
    const existing = await this.repository.findById(id)
    if (!existing) throw new ContentPageNotFoundError()

    const updated = await this.repository.publish(id, existing.publishedAt)
    if (!updated) throw new ContentPageNotFoundError()

    await this.repository.insertAuditLog({
      userId: editorId,
      action: 'content_page.publish',
      entityType: 'content_page',
      entityId: id,
    })
    await this.hooks.emit(CONTENT_PAGE_EVENTS.PUBLISHED, { contentPageId: id })

    return { item: serializeContentPage(updated) }
  }

  async unpublish(id: string, editorId: string) {
    const existing = await this.repository.findById(id)
    if (!existing) throw new ContentPageNotFoundError()

    const updated = await this.repository.unpublish(id)
    if (!updated) throw new ContentPageNotFoundError()

    await this.repository.insertAuditLog({
      userId: editorId,
      action: 'content_page.unpublish',
      entityType: 'content_page',
      entityId: id,
    })
    await this.hooks.emit(CONTENT_PAGE_EVENTS.UNPUBLISHED, { contentPageId: id })

    return { item: serializeContentPage(updated) }
  }

  async delete(id: string, editorId: string) {
    const existing = await this.repository.findById(id)
    if (!existing) throw new ContentPageNotFoundError()

    await this.repository.insertAuditLog({
      userId: editorId,
      action: 'content_page.delete',
      entityType: 'content_page',
      entityId: id,
      beforeData: serializeContentPage(existing),
    })
    await this.repository.hardDelete(id)
    await this.hooks.emit(CONTENT_PAGE_EVENTS.DELETED, { contentPageId: id })
  }

  async getPublicBySlug(slug: string) {
    const page = await this.repository.findPublishedBySlug(slug)
    if (!page) throw new ContentPageNotFoundError()
    return { item: serializeContentPage(page) }
  }
}
