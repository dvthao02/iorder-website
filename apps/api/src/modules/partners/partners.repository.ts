import type { PartnerInput } from '@iorder/contracts'
import type { CmsDatabase } from '@iorder/database'
import { auditLogs, mediaAssets, partners } from '@iorder/database'
import { asc, eq } from 'drizzle-orm'

export type PartnerRecord = typeof partners.$inferSelect

export function serializePartner(partner: PartnerRecord, logoUrl: string | null = null) {
  return {
    id: partner.id,
    name: partner.name,
    kind: partner.kind,
    description: partner.description,
    websiteUrl: partner.websiteUrl,
    logoMediaId: partner.logoMediaId,
    logoUrl,
    sortOrder: partner.sortOrder,
    isEnabled: partner.isEnabled,
    createdAt: partner.createdAt.toISOString(),
    updatedAt: partner.updatedAt.toISOString(),
  }
}

export class PartnersRepository {
  constructor(private db: CmsDatabase) {}

  async logoExists(id: string | null) {
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
      .select({ partner: partners, logoUrl: mediaAssets.publicUrl })
      .from(partners)
      .leftJoin(mediaAssets, eq(partners.logoMediaId, mediaAssets.id))
      .where(eq(partners.id, id))
      .limit(1)
    return row ?? null
  }

  async list() {
    return this.db
      .select({ partner: partners, logoUrl: mediaAssets.publicUrl })
      .from(partners)
      .leftJoin(mediaAssets, eq(partners.logoMediaId, mediaAssets.id))
      .orderBy(asc(partners.sortOrder), asc(partners.name))
  }

  async create(data: PartnerInput) {
    const [created] = await this.db
      .insert(partners)
      .values({
        name: data.name,
        kind: data.kind,
        description: data.description,
        websiteUrl: data.websiteUrl,
        logoMediaId: data.logoMediaId,
        sortOrder: data.sortOrder,
        isEnabled: data.isEnabled,
      })
      .returning()
    if (!created) throw new Error('Partner was not created')
    return created
  }

  async update(id: string, data: PartnerInput) {
    const [updated] = await this.db
      .update(partners)
      .set({
        name: data.name,
        kind: data.kind,
        description: data.description,
        websiteUrl: data.websiteUrl,
        logoMediaId: data.logoMediaId,
        sortOrder: data.sortOrder,
        isEnabled: data.isEnabled,
        updatedAt: new Date(),
      })
      .where(eq(partners.id, id))
      .returning()
    return updated ?? null
  }

  async delete(id: string) {
    await this.db.delete(partners).where(eq(partners.id, id))
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
      .select({ partner: partners, logoUrl: mediaAssets.publicUrl })
      .from(partners)
      .leftJoin(mediaAssets, eq(partners.logoMediaId, mediaAssets.id))
      .where(eq(partners.isEnabled, true))
      .orderBy(asc(partners.sortOrder), asc(partners.name))
  }
}
