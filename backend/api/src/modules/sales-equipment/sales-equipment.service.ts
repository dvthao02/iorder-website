import type { SalesEquipmentInput, SalesEquipmentListQuery } from '@iorder/contracts'

import type { HookManager } from '../../shared/hooks/index.js'
import {
  SalesEquipmentCoverNotFoundError,
  SalesEquipmentNotFoundError,
  SalesEquipmentRevisionNotFoundError,
  SalesEquipmentSlugExistsError,
} from './sales-equipment.errors.js'
import { SALES_EQUIPMENT_EVENTS } from './sales-equipment.hooks.js'
import {
  serializeSalesEquipment,
  type SalesEquipmentRecord,
  type SalesEquipmentRepository,
} from './sales-equipment.repository.js'

export class SalesEquipmentService {
  constructor(
    private repository: SalesEquipmentRepository,
    private hooks: HookManager,
  ) {}

  private async serialize(item: SalesEquipmentRecord) {
    return serializeSalesEquipment(item, await this.repository.resolveCoverUrl(item.coverMediaId))
  }

  async list(query: SalesEquipmentListQuery) {
    const { rows, total } = await this.repository.list(query)
    return {
      items: await Promise.all(rows.map((item) => this.serialize(item))),
      total,
      page: query.page,
      limit: query.limit,
    }
  }

  async getById(id: string) {
    const item = await this.repository.findById(id)
    if (!item) throw new SalesEquipmentNotFoundError()
    return { item: await this.serialize(item) }
  }

  async create(input: SalesEquipmentInput, editorId: string) {
    if (!(await this.repository.coverExists(input.coverMediaId))) throw new SalesEquipmentCoverNotFoundError()
    if (await this.repository.slugExists(input.slug)) throw new SalesEquipmentSlugExistsError()
    const created = await this.repository.create(input)
    await this.repository.createRevision(created, editorId, 'Created')
    await this.repository.insertAuditLog({
      userId: editorId,
      action: 'sales_equipment.create',
      entityType: 'sales_equipment',
      entityId: created.id,
      afterData: serializeSalesEquipment(created),
    })
    await this.hooks.emit(SALES_EQUIPMENT_EVENTS.CREATED, { salesEquipmentId: created.id })
    return { statusCode: 201, item: await this.serialize(created) }
  }

  async update(id: string, input: SalesEquipmentInput, editorId: string) {
    const existing = await this.repository.findById(id)
    if (!existing) throw new SalesEquipmentNotFoundError()
    if (!(await this.repository.coverExists(input.coverMediaId))) throw new SalesEquipmentCoverNotFoundError()
    if (input.slug !== existing.slug && (await this.repository.slugExists(input.slug, id)))
      throw new SalesEquipmentSlugExistsError()
    const updated = await this.repository.update(id, input)
    if (!updated) throw new SalesEquipmentNotFoundError()
    await this.repository.createRevision(updated, editorId, 'Updated')
    await this.repository.insertAuditLog({
      userId: editorId,
      action: 'sales_equipment.update',
      entityType: 'sales_equipment',
      entityId: id,
      beforeData: serializeSalesEquipment(existing),
      afterData: serializeSalesEquipment(updated),
    })
    await this.hooks.emit(SALES_EQUIPMENT_EVENTS.UPDATED, { salesEquipmentId: id })
    return { item: await this.serialize(updated) }
  }

  async publish(id: string, editorId: string) {
    const existing = await this.repository.findById(id)
    if (!existing) throw new SalesEquipmentNotFoundError()
    const updated = await this.repository.setStatus(id, 'published', existing.publishedAt)
    if (!updated) throw new SalesEquipmentNotFoundError()
    await this.repository.createRevision(updated, editorId, 'Published')
    await this.repository.insertAuditLog({
      userId: editorId,
      action: 'sales_equipment.publish',
      entityType: 'sales_equipment',
      entityId: id,
    })
    await this.hooks.emit(SALES_EQUIPMENT_EVENTS.PUBLISHED, { salesEquipmentId: id })
    return { item: await this.serialize(updated) }
  }

  async archive(id: string, editorId: string) {
    if (!(await this.repository.findById(id))) throw new SalesEquipmentNotFoundError()
    const updated = await this.repository.setStatus(id, 'archived')
    if (!updated) throw new SalesEquipmentNotFoundError()
    await this.repository.insertAuditLog({
      userId: editorId,
      action: 'sales_equipment.archive',
      entityType: 'sales_equipment',
      entityId: id,
    })
    await this.hooks.emit(SALES_EQUIPMENT_EVENTS.ARCHIVED, { salesEquipmentId: id })
    return { item: await this.serialize(updated) }
  }

  async unpublish(id: string, editorId: string) {
    if (!(await this.repository.findById(id))) throw new SalesEquipmentNotFoundError()
    const updated = await this.repository.setStatus(id, 'draft')
    if (!updated) throw new SalesEquipmentNotFoundError()
    await this.repository.insertAuditLog({
      userId: editorId,
      action: 'sales_equipment.unpublish',
      entityType: 'sales_equipment',
      entityId: id,
    })
    await this.hooks.emit(SALES_EQUIPMENT_EVENTS.UNPUBLISHED, { salesEquipmentId: id })
    return { item: await this.serialize(updated) }
  }

  async delete(id: string, editorId: string) {
    const existing = await this.repository.findById(id)
    if (!existing) throw new SalesEquipmentNotFoundError()
    await this.repository.softDelete(id)
    await this.repository.insertAuditLog({
      userId: editorId,
      action: 'sales_equipment.delete',
      entityType: 'sales_equipment',
      entityId: id,
      beforeData: serializeSalesEquipment(existing),
    })
    await this.hooks.emit(SALES_EQUIPMENT_EVENTS.DELETED, { salesEquipmentId: id })
  }

  async listRevisions(id: string) {
    if (!(await this.repository.findById(id))) throw new SalesEquipmentNotFoundError()
    const revisions = await this.repository.listRevisions(id)
    return {
      items: revisions.map((revision) => ({
        versionNumber: revision.versionNumber,
        changeNote: revision.changeNote,
        createdAt: revision.createdAt.toISOString(),
      })),
    }
  }

  async restore(id: string, version: number, editorId: string) {
    if (!(await this.repository.findById(id))) throw new SalesEquipmentNotFoundError()
    const revision = await this.repository.findRevision(id, version)
    if (!revision) throw new SalesEquipmentRevisionNotFoundError()
    const snapshot = revision.contentSnapshot as SalesEquipmentInput
    if (!(await this.repository.coverExists(snapshot.coverMediaId))) throw new SalesEquipmentCoverNotFoundError()
    const restored = await this.repository.restore(id, snapshot)
    if (!restored) throw new SalesEquipmentNotFoundError()
    await this.repository.createRevision(restored, editorId, `Restored version ${version}`)
    await this.repository.insertAuditLog({
      userId: editorId,
      action: 'sales_equipment.restore',
      entityType: 'sales_equipment',
      entityId: id,
      afterData: serializeSalesEquipment(restored),
    })
    await this.hooks.emit(SALES_EQUIPMENT_EVENTS.RESTORED, { salesEquipmentId: id, version })
    return { item: await this.serialize(restored) }
  }

  async listPublic(category?: SalesEquipmentInput['category']) {
    const rows = await this.repository.listPublic(category)
    return { items: await Promise.all(rows.map((item) => this.serialize(item))) }
  }
}
