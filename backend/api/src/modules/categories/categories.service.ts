import type { CategoryInput } from '@iorder/contracts'

import { CategoryNotFoundError } from './categories.errors.js'
import { serializeCategory, slugify, type CategoriesRepository } from './categories.repository.js'

export class CategoriesService {
  constructor(private repository: CategoriesRepository) {}

  async list() {
    const rows = await this.repository.list()
    return { items: rows.map((row) => serializeCategory(row.category, row.postCount)) }
  }

  async create(input: CategoryInput, editorId: string) {
    const slug = await this.repository.uniqueSlug(slugify(input.name))
    const created = await this.repository.create(input, slug)
    await this.repository.insertAuditLog({
      userId: editorId,
      action: 'category.create',
      entityType: 'category',
      entityId: created.id,
      afterData: serializeCategory(created),
    })
    return { statusCode: 201, item: serializeCategory(created) }
  }

  async update(id: string, input: CategoryInput, editorId: string) {
    const existing = await this.repository.findById(id)
    if (!existing) throw new CategoryNotFoundError()

    const slug = await this.repository.uniqueSlug(slugify(input.name), id)
    const updated = await this.repository.update(id, input, slug)
    if (!updated) throw new CategoryNotFoundError()

    await this.repository.insertAuditLog({
      userId: editorId,
      action: 'category.update',
      entityType: 'category',
      entityId: updated.id,
      beforeData: serializeCategory(existing),
      afterData: serializeCategory(updated),
    })
    return { item: serializeCategory(updated) }
  }

  async delete(id: string, editorId: string) {
    const existing = await this.repository.findById(id)
    if (!existing) throw new CategoryNotFoundError()

    await this.repository.delete(id)
    await this.repository.insertAuditLog({
      userId: editorId,
      action: 'category.delete',
      entityType: 'category',
      entityId: id,
      beforeData: serializeCategory(existing),
    })
  }

  async listPublic() {
    const rows = await this.repository.listPublic()
    return { items: rows.map((row) => serializeCategory(row.category, row.postCount)) }
  }
}
