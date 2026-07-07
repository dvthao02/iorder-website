import type { OfferingInput, OfferingListQuery } from '@iorder/contracts'

import type { HookManager } from '../../shared/hooks/index.js'
import { OfferingCoverNotFoundError, OfferingNotFoundError, OfferingSlugExistsError } from './offerings.errors.js'
import { OFFERING_EVENTS } from './offerings.hooks.js'
import { serializeOffering, type OfferingsRepository } from './offerings.repository.js'

export class OfferingsService {
  constructor(
    private repository: OfferingsRepository,
    private hooks: HookManager,
  ) {}

  async list(query: OfferingListQuery) {
    const { rows, total } = await this.repository.list(query)
    const withUrls = await Promise.all(
      rows.map(async (o) => serializeOffering(o, await this.repository.resolveMediaUrl(o.coverMediaId))),
    )
    return { items: withUrls, total, page: query.page, limit: query.limit }
  }

  async getById(id: string) {
    const offering = await this.repository.findById(id)
    if (!offering) throw new OfferingNotFoundError()
    return { item: serializeOffering(offering, await this.repository.resolveMediaUrl(offering.coverMediaId)) }
  }

  async create(input: OfferingInput, editorId: string) {
    if (!(await this.repository.coverExists(input.coverMediaId))) throw new OfferingCoverNotFoundError()
    if (await this.repository.slugExistsForType(input.type, input.slug)) throw new OfferingSlugExistsError()

    const created = await this.repository.create(input)
    await this.repository.createRevision(created, editorId, 'Created')
    await this.repository.insertAuditLog({
      userId: editorId,
      action: 'offering.create',
      entityType: 'offering',
      entityId: created.id,
      afterData: serializeOffering(created),
    })

    await this.hooks.emit(OFFERING_EVENTS.CREATED, { offeringId: created.id })

    return {
      statusCode: 201,
      item: serializeOffering(created, await this.repository.resolveMediaUrl(created.coverMediaId)),
    }
  }

  async update(id: string, input: OfferingInput, editorId: string) {
    const existing = await this.repository.findById(id)
    if (!existing) throw new OfferingNotFoundError()
    if (!(await this.repository.coverExists(input.coverMediaId))) throw new OfferingCoverNotFoundError()
    if (input.slug !== existing.slug && (await this.repository.slugExistsForType(input.type, input.slug, id)))
      throw new OfferingSlugExistsError()

    const updated = await this.repository.update(id, input)
    if (!updated) throw new OfferingNotFoundError()

    await this.repository.createRevision(updated, editorId, 'Updated')
    await this.repository.insertAuditLog({
      userId: editorId,
      action: 'offering.update',
      entityType: 'offering',
      entityId: id,
      beforeData: serializeOffering(existing),
      afterData: serializeOffering(updated),
    })

    await this.hooks.emit(OFFERING_EVENTS.UPDATED, { offeringId: id })

    return { item: serializeOffering(updated, await this.repository.resolveMediaUrl(updated.coverMediaId)) }
  }

  async publish(id: string, editorId: string) {
    const existing = await this.repository.findById(id)
    if (!existing) throw new OfferingNotFoundError()

    const updated = await this.repository.publish(id, existing.publishedAt)
    if (!updated) throw new OfferingNotFoundError()

    await this.repository.createRevision(updated, editorId, 'Published')
    await this.repository.insertAuditLog({
      userId: editorId,
      action: 'offering.publish',
      entityType: 'offering',
      entityId: id,
    })
    await this.hooks.emit(OFFERING_EVENTS.PUBLISHED, { offeringId: id })

    return { item: serializeOffering(updated, await this.repository.resolveMediaUrl(updated.coverMediaId)) }
  }

  async archive(id: string, editorId: string) {
    const existing = await this.repository.findById(id)
    if (!existing) throw new OfferingNotFoundError()

    const updated = await this.repository.archive(id)
    if (!updated) throw new OfferingNotFoundError()

    await this.repository.insertAuditLog({
      userId: editorId,
      action: 'offering.archive',
      entityType: 'offering',
      entityId: id,
    })
    await this.hooks.emit(OFFERING_EVENTS.ARCHIVED, { offeringId: id })

    return { item: serializeOffering(updated, await this.repository.resolveMediaUrl(updated.coverMediaId)) }
  }

  // Gỡ xuất bản: đưa nội dung đã đăng về bản nháp (khác với archive/ẩn).
  async unpublish(id: string, editorId: string) {
    const existing = await this.repository.findById(id)
    if (!existing) throw new OfferingNotFoundError()

    const updated = await this.repository.unpublish(id)
    if (!updated) throw new OfferingNotFoundError()

    await this.repository.insertAuditLog({
      userId: editorId,
      action: 'offering.unpublish',
      entityType: 'offering',
      entityId: id,
    })
    await this.hooks.emit(OFFERING_EVENTS.UNPUBLISHED, { offeringId: id })

    return { item: serializeOffering(updated, await this.repository.resolveMediaUrl(updated.coverMediaId)) }
  }

  async delete(id: string, editorId: string) {
    const existing = await this.repository.findById(id)
    if (!existing) throw new OfferingNotFoundError()

    await this.repository.softDelete(id)
    await this.repository.insertAuditLog({
      userId: editorId,
      action: 'offering.delete',
      entityType: 'offering',
      entityId: id,
    })
    await this.hooks.emit(OFFERING_EVENTS.DELETED, { offeringId: id })
  }

  async listPublic(type?: OfferingInput['type']) {
    const rows = await this.repository.listPublic(type)
    const withUrls = await Promise.all(
      rows.map(async (o) => serializeOffering(o, await this.repository.resolveMediaUrl(o.coverMediaId))),
    )
    return { items: withUrls }
  }

  async getPublicByTypeAndSlug(type: OfferingInput['type'], slug: string) {
    const row = await this.repository.findPublicByTypeAndSlug(type, slug)
    if (!row) throw new OfferingNotFoundError()
    return { item: serializeOffering(row, await this.repository.resolveMediaUrl(row.coverMediaId)) }
  }
}
