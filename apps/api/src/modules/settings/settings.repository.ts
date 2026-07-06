import type { SiteProfileInput } from '@iorder/contracts'
import type { CmsDatabase } from '@iorder/database'
import { auditLogs, mediaAssets, siteProfile, siteSettings } from '@iorder/database'
import { asc, eq } from 'drizzle-orm'

const EXTERNAL_LINKS_KEY = 'external_links'
const APPEARANCE_KEY = 'appearance'

export const DEFAULT_APPEARANCE = {
  primaryColor: '#0b8edc',
  accentColor: '#6366f1',
  darkMode: false,
}

export const DEFAULT_EXTERNAL_LINKS = {
  appLogin: null,
  trial: null,
  facebook: null,
  zalo: null,
  youtube: null,
  appStore: null,
  googlePlay: null,
  addressMap: null,
}

export function serializeProfile(profile: typeof siteProfile.$inferSelect, logoUrl: string | null) {
  return {
    id: profile.id,
    companyName: profile.companyName,
    legalName: profile.legalName,
    hotline: profile.hotline,
    supportEmail: profile.supportEmail,
    salesEmail: profile.salesEmail,
    address: profile.address,
    workingHours: profile.workingHours,
    logoMediaId: profile.logoMediaId,
    logoUrl,
    updatedAt: profile.updatedAt.toISOString(),
  }
}

export class SettingsRepository {
  constructor(private db: CmsDatabase) {}

  async getProfile() {
    const [profile] = await this.db.select().from(siteProfile).where(eq(siteProfile.profileKey, 'default')).limit(1)
    return profile ?? null
  }

  async resolveLogoUrl(logoMediaId: string | null): Promise<string | null> {
    if (!logoMediaId) return null
    const [asset] = await this.db
      .select({ publicUrl: mediaAssets.publicUrl })
      .from(mediaAssets)
      .where(eq(mediaAssets.id, logoMediaId))
      .limit(1)
    return asset?.publicUrl ?? null
  }

  async getExternalLinks() {
    const [row] = await this.db
      .select({ value: siteSettings.value })
      .from(siteSettings)
      .where(eq(siteSettings.key, EXTERNAL_LINKS_KEY))
      .limit(1)
    return (row?.value ?? DEFAULT_EXTERNAL_LINKS) as typeof DEFAULT_EXTERNAL_LINKS
  }

  async getAppearance() {
    const [row] = await this.db
      .select({ value: siteSettings.value })
      .from(siteSettings)
      .where(eq(siteSettings.key, APPEARANCE_KEY))
      .limit(1)
    return { ...DEFAULT_APPEARANCE, ...((row?.value as Partial<typeof DEFAULT_APPEARANCE>) ?? {}) }
  }

  async saveProfile(input: SiteProfileInput) {
    const existing = await this.getProfile()
    if (existing) {
      const [updated] = await this.db
        .update(siteProfile)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(siteProfile.profileKey, 'default'))
        .returning()
      return updated!
    }
    const [created] = await this.db
      .insert(siteProfile)
      .values({ profileKey: 'default', ...input })
      .returning()
    return created!
  }

  async saveExternalLinks(value: typeof DEFAULT_EXTERNAL_LINKS, editorId: string) {
    const [existing] = await this.db
      .select({ id: siteSettings.id })
      .from(siteSettings)
      .where(eq(siteSettings.key, EXTERNAL_LINKS_KEY))
      .limit(1)
    if (existing) {
      await this.db
        .update(siteSettings)
        .set({ value, updatedBy: editorId, updatedAt: new Date() })
        .where(eq(siteSettings.key, EXTERNAL_LINKS_KEY))
    } else {
      await this.db.insert(siteSettings).values({
        key: EXTERNAL_LINKS_KEY,
        value,
        description: 'External links (app, social, stores)',
        updatedBy: editorId,
      })
    }
  }

  async saveAppearance(value: typeof DEFAULT_APPEARANCE, editorId: string) {
    const [existing] = await this.db
      .select({ id: siteSettings.id })
      .from(siteSettings)
      .where(eq(siteSettings.key, APPEARANCE_KEY))
      .limit(1)
    if (existing) {
      await this.db
        .update(siteSettings)
        .set({ value, updatedBy: editorId, updatedAt: new Date() })
        .where(eq(siteSettings.key, APPEARANCE_KEY))
    } else {
      await this.db
        .insert(siteSettings)
        .values({ key: APPEARANCE_KEY, value, description: 'Site appearance (colors, dark mode)', updatedBy: editorId })
    }
  }

  async listAllSettings() {
    return this.db.select().from(siteSettings).orderBy(asc(siteSettings.key))
  }

  async insertAuditLog(entry: { userId: string; action: string; entityType: string; entityId?: string }) {
    await this.db.insert(auditLogs).values(entry)
  }
}
