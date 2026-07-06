import type { PartnerInput } from '@iorder/contracts'

import { PartnerLogoNotFoundError, PartnerNameExistsError, PartnerNotFoundError } from './partners.errors.js'
import { serializePartner, type PartnersRepository } from './partners.repository.js'

function isUniqueNameViolation(error: unknown) {
  return error instanceof Error && error.message.includes('partners_name_unique')
}

export class PartnersService {
  constructor(private repository: PartnersRepository) {}

  async list() {
    const rows = await this.repository.list()
    return { items: rows.map((row) => serializePartner(row.partner, row.logoUrl)), total: rows.length }
  }

  async create(input: PartnerInput, editorId: string) {
    if (!(await this.repository.logoExists(input.logoMediaId))) throw new PartnerLogoNotFoundError()

    try {
      const created = await this.repository.create(input)
      await this.repository.insertAuditLog({
        userId: editorId,
        action: 'partner.create',
        entityType: 'partner',
        entityId: created.id,
        afterData: serializePartner(created),
      })
      const withLogo = await this.repository.findById(created.id)
      return { statusCode: 201, item: serializePartner(created, withLogo?.logoUrl ?? null) }
    } catch (error) {
      if (isUniqueNameViolation(error)) throw new PartnerNameExistsError()
      throw error
    }
  }

  async update(id: string, input: PartnerInput, editorId: string) {
    const existing = await this.repository.findById(id)
    if (!existing) throw new PartnerNotFoundError()
    if (!(await this.repository.logoExists(input.logoMediaId))) throw new PartnerLogoNotFoundError()

    try {
      const updated = await this.repository.update(id, input)
      if (!updated) throw new PartnerNotFoundError()
      await this.repository.insertAuditLog({
        userId: editorId,
        action: 'partner.update',
        entityType: 'partner',
        entityId: updated.id,
        beforeData: serializePartner(existing.partner),
        afterData: serializePartner(updated),
      })
      const withLogo = await this.repository.findById(updated.id)
      return { item: serializePartner(updated, withLogo?.logoUrl ?? null) }
    } catch (error) {
      if (isUniqueNameViolation(error)) throw new PartnerNameExistsError()
      throw error
    }
  }

  async delete(id: string, editorId: string) {
    const existing = await this.repository.findById(id)
    if (!existing) throw new PartnerNotFoundError()

    await this.repository.delete(id)
    await this.repository.insertAuditLog({
      userId: editorId,
      action: 'partner.delete',
      entityType: 'partner',
      entityId: id,
      beforeData: serializePartner(existing.partner),
    })
  }

  async listPublic() {
    const rows = await this.repository.listPublic()
    return { items: rows.map((row) => serializePartner(row.partner, row.logoUrl)) }
  }
}
