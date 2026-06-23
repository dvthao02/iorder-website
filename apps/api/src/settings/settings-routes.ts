import { siteProfileInputSchema } from '@iorder/contracts'
import type { CmsDatabase } from '@iorder/database'
import { auditLogs, mediaAssets, siteProfile, siteSettings } from '@iorder/database'
import { asc, eq } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'

import { createAuthGuard, requireCmsUser } from '../auth/auth-guard.js'

const EXTERNAL_LINKS_KEY = 'external_links'
const APPEARANCE_KEY = 'appearance'

const DEFAULT_APPEARANCE = {
  primaryColor: '#0b8edc',
  accentColor: '#6366f1',
  darkMode: false,
}

const DEFAULT_EXTERNAL_LINKS = {
  appLogin: null,
  trial: null,
  facebook: null,
  zalo: null,
  youtube: null,
  appStore: null,
  googlePlay: null,
  addressMap: null,
}

async function getProfile(db: CmsDatabase) {
  const [profile] = await db.select().from(siteProfile).where(eq(siteProfile.profileKey, 'default')).limit(1)
  return profile ?? null
}

async function resolveLogoUrl(db: CmsDatabase, logoMediaId: string | null): Promise<string | null> {
  if (!logoMediaId) return null
  const [asset] = await db.select({ publicUrl: mediaAssets.publicUrl }).from(mediaAssets).where(eq(mediaAssets.id, logoMediaId)).limit(1)
  return asset?.publicUrl ?? null
}

async function getExternalLinks(db: CmsDatabase) {
  const [row] = await db.select({ value: siteSettings.value }).from(siteSettings).where(eq(siteSettings.key, EXTERNAL_LINKS_KEY)).limit(1)
  return (row?.value ?? DEFAULT_EXTERNAL_LINKS) as typeof DEFAULT_EXTERNAL_LINKS
}

async function getAppearance(db: CmsDatabase) {
  const [row] = await db.select({ value: siteSettings.value }).from(siteSettings).where(eq(siteSettings.key, APPEARANCE_KEY)).limit(1)
  return { ...DEFAULT_APPEARANCE, ...(row?.value as Partial<typeof DEFAULT_APPEARANCE> ?? {}) }
}

export function registerSettingsRoutes(app: FastifyInstance, { db }: { db: CmsDatabase }) {
  const authGuard = createAuthGuard(db)

  // ── Public: get combined settings ─────────────────────────────────────────
  app.get('/api/public/settings', async () => {
    const [profile, externalLinks, appearance] = await Promise.all([getProfile(db), getExternalLinks(db), getAppearance(db)])
    const logoUrl = profile ? await resolveLogoUrl(db, profile.logoMediaId) : null
    return {
      profile: profile
        ? {
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
        : null,
      externalLinks,
      appearance,
    }
  })

  // ── Admin: get site profile ───────────────────────────────────────────────
  app.get('/api/admin/settings/profile', { preHandler: [authGuard] }, async (request) => {
    requireCmsUser(request)
    const profile = await getProfile(db)
    if (!profile) return { item: null }
    const logoUrl = await resolveLogoUrl(db, profile.logoMediaId)
    return {
      item: {
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
      },
    }
  })

  // ── Admin: update site profile ────────────────────────────────────────────
  app.put('/api/admin/settings/profile', { preHandler: [authGuard] }, async (request, reply) => {
    const user = requireCmsUser(request)
    const body = siteProfileInputSchema.safeParse(request.body)
    if (!body.success) return reply.code(400).send({ error: 'VALIDATION_ERROR', issues: body.error.issues })
    const input = body.data

    const existing = await getProfile(db)
    let saved: typeof existing & {}

    if (existing) {
      const rows = await db.update(siteProfile).set({ ...input, updatedAt: new Date() }).where(eq(siteProfile.profileKey, 'default')).returning()
      saved = rows[0]!
    } else {
      const rows = await db.insert(siteProfile).values({ profileKey: 'default', ...input }).returning()
      saved = rows[0]!
    }

    await db.insert(auditLogs).values({ userId: user.id, action: 'settings.profile.update', entityType: 'site_profile', entityId: saved.id })

    const logoUrl = await resolveLogoUrl(db, saved.logoMediaId)
    return {
      item: {
        id: saved.id,
        companyName: saved.companyName,
        legalName: saved.legalName,
        hotline: saved.hotline,
        supportEmail: saved.supportEmail,
        salesEmail: saved.salesEmail,
        address: saved.address,
        workingHours: saved.workingHours,
        logoMediaId: saved.logoMediaId,
        logoUrl,
        updatedAt: saved.updatedAt.toISOString(),
      },
    }
  })

  // ── Admin: get external links ─────────────────────────────────────────────
  app.get('/api/admin/settings/external-links', { preHandler: [authGuard] }, async (request) => {
    requireCmsUser(request)
    return { item: await getExternalLinks(db) }
  })

  // ── Admin: update external links ──────────────────────────────────────────
  app.put('/api/admin/settings/external-links', { preHandler: [authGuard] }, async (request, reply) => {
    const user = requireCmsUser(request)
    const body = request.body as Record<string, string | null>
    const value = { ...DEFAULT_EXTERNAL_LINKS, ...body }

    const [existing] = await db.select({ id: siteSettings.id }).from(siteSettings).where(eq(siteSettings.key, EXTERNAL_LINKS_KEY)).limit(1)
    if (existing) {
      await db.update(siteSettings).set({ value, updatedBy: user.id, updatedAt: new Date() }).where(eq(siteSettings.key, EXTERNAL_LINKS_KEY))
    } else {
      await db.insert(siteSettings).values({ key: EXTERNAL_LINKS_KEY, value, description: 'External links (app, social, stores)', updatedBy: user.id })
    }

    await db.insert(auditLogs).values({ userId: user.id, action: 'settings.external_links.update', entityType: 'site_settings' })
    return { item: value }
  })

  // ── Admin: get appearance ─────────────────────────────────────────────────
  app.get('/api/admin/settings/appearance', { preHandler: [authGuard] }, async (request) => {
    requireCmsUser(request)
    return { item: await getAppearance(db) }
  })

  // ── Admin: update appearance ──────────────────────────────────────────────
  app.put('/api/admin/settings/appearance', { preHandler: [authGuard] }, async (request, reply) => {
    const user = requireCmsUser(request)
    const body = request.body as Partial<typeof DEFAULT_APPEARANCE>
    const value = { ...DEFAULT_APPEARANCE, ...body }

    const [existing] = await db.select({ id: siteSettings.id }).from(siteSettings).where(eq(siteSettings.key, APPEARANCE_KEY)).limit(1)
    if (existing) {
      await db.update(siteSettings).set({ value, updatedBy: user.id, updatedAt: new Date() }).where(eq(siteSettings.key, APPEARANCE_KEY))
    } else {
      await db.insert(siteSettings).values({ key: APPEARANCE_KEY, value, description: 'Site appearance (colors, dark mode)', updatedBy: user.id })
    }
    await db.insert(auditLogs).values({ userId: user.id, action: 'settings.appearance.update', entityType: 'site_settings' })
    return { item: value }
  })

  // ── Admin: list all settings ──────────────────────────────────────────────
  app.get('/api/admin/settings', { preHandler: [authGuard] }, async (request) => {
    requireCmsUser(request)
    const rows = await db.select().from(siteSettings).orderBy(asc(siteSettings.key))
    return { items: rows }
  })
}
