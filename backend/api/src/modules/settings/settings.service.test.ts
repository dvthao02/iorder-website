import { describe, expect, it, vi } from 'vitest'

import type { SettingsRepository } from './settings.repository.js'
import { SettingsService } from './settings.service.js'

const profile = {
  id: '00000000-0000-4000-8000-000000000040',
  profileKey: 'default',
  companyName: 'iOrder',
  legalName: null,
  hotline: '1900 0000',
  supportEmail: null,
  salesEmail: null,
  address: null,
  workingHours: null,
  logoMediaId: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
}
const profileInput = {
  companyName: profile.companyName,
  legalName: profile.legalName,
  hotline: profile.hotline,
  supportEmail: profile.supportEmail,
  salesEmail: profile.salesEmail,
  address: profile.address,
  workingHours: profile.workingHours,
  logoMediaId: profile.logoMediaId,
}

function makeRepository(overrides: Record<string, unknown> = {}) {
  return {
    getProfile: vi.fn().mockResolvedValue(profile),
    resolveLogoUrl: vi.fn().mockResolvedValue(null),
    saveProfile: vi.fn().mockResolvedValue(profile),
    getExternalLinks: vi.fn().mockResolvedValue({}),
    saveExternalLinks: vi.fn().mockResolvedValue(undefined),
    getAppearance: vi.fn().mockResolvedValue({}),
    saveAppearance: vi.fn().mockResolvedValue(undefined),
    listAllSettings: vi.fn().mockResolvedValue([]),
    insertAuditLog: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}

describe('SettingsService mutations', () => {
  it('writes an audit record after saving the website profile', async () => {
    const repository = makeRepository()
    const service = new SettingsService(repository as unknown as SettingsRepository)

    const result = await service.updateProfile(profileInput, 'editor-1')

    expect(result.item.companyName).toBe('iOrder')
    expect(repository.insertAuditLog).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'editor-1', action: 'settings.profile.update', entityId: profile.id,
    }))
  })

  it('merges partial appearance settings with safe defaults before saving', async () => {
    const repository = makeRepository()
    const service = new SettingsService(repository as unknown as SettingsRepository)

    await service.updateAppearance({ darkMode: true }, 'editor-1')

    expect(repository.saveAppearance).toHaveBeenCalledWith(expect.objectContaining({ darkMode: true, primaryColor: '#0b8edc' }), 'editor-1')
    expect(repository.insertAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: 'settings.appearance.update' }))
  })
})
