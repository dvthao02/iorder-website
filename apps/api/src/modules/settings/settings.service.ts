import type { SiteProfileInput } from '@iorder/contracts'

import {
  DEFAULT_APPEARANCE,
  DEFAULT_EXTERNAL_LINKS,
  serializeProfile,
  type SettingsRepository,
} from './settings.repository.js'

export class SettingsService {
  constructor(private repository: SettingsRepository) {}

  async getPublicSettings() {
    const [profile, externalLinks, appearance] = await Promise.all([
      this.repository.getProfile(),
      this.repository.getExternalLinks(),
      this.repository.getAppearance(),
    ])
    const logoUrl = profile ? await this.repository.resolveLogoUrl(profile.logoMediaId) : null
    return {
      profile: profile ? serializeProfile(profile, logoUrl) : null,
      externalLinks,
      appearance,
    }
  }

  async getProfile() {
    const profile = await this.repository.getProfile()
    if (!profile) return { item: null }
    const logoUrl = await this.repository.resolveLogoUrl(profile.logoMediaId)
    return { item: serializeProfile(profile, logoUrl) }
  }

  async updateProfile(input: SiteProfileInput, editorId: string) {
    const saved = await this.repository.saveProfile(input)
    await this.repository.insertAuditLog({
      userId: editorId,
      action: 'settings.profile.update',
      entityType: 'site_profile',
      entityId: saved.id,
    })
    const logoUrl = await this.repository.resolveLogoUrl(saved.logoMediaId)
    return { item: serializeProfile(saved, logoUrl) }
  }

  async getExternalLinks() {
    return { item: await this.repository.getExternalLinks() }
  }

  async updateExternalLinks(body: Record<string, string | null>, editorId: string) {
    const value = { ...DEFAULT_EXTERNAL_LINKS, ...body }
    await this.repository.saveExternalLinks(value, editorId)
    await this.repository.insertAuditLog({
      userId: editorId,
      action: 'settings.external_links.update',
      entityType: 'site_settings',
    })
    return { item: value }
  }

  async getAppearance() {
    return { item: await this.repository.getAppearance() }
  }

  async updateAppearance(body: Partial<typeof DEFAULT_APPEARANCE>, editorId: string) {
    const value = { ...DEFAULT_APPEARANCE, ...body }
    await this.repository.saveAppearance(value, editorId)
    await this.repository.insertAuditLog({
      userId: editorId,
      action: 'settings.appearance.update',
      entityType: 'site_settings',
    })
    return { item: value }
  }

  async listAll() {
    return { items: await this.repository.listAllSettings() }
  }
}
