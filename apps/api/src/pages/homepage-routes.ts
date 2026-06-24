import {
  DEFAULT_SECTION_APPEARANCE,
  HOMEPAGE_SECTION_ORDER,
  homepageAutosaveInputSchema,
  homepageInputSchema,
  homepageVersionInputSchema,
  sectionAppearanceSchema,
  type HomepageBlock,
  type HomepageInput,
} from '@iorder/contracts'
import type { CmsDatabase } from '@iorder/database'
import { auditLogs, mediaAssets, pageBlocks, pageRevisions, pages, users } from '@iorder/database'
import { and, desc, eq, inArray, isNull, max, sql } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'

import { createAuthGuard, requireCmsUser } from '../auth/auth-guard.js'
import { createHomepagePreviewToken, verifyHomepagePreviewToken } from './preview-token.js'

const HOME_SLUG = 'home'
const sectionPosition = new Map(HOMEPAGE_SECTION_ORDER.map((type, index) => [type, index]))

function canonicalBlocks(blocks: HomepageBlock[]) {
  const byType = new Map(blocks.map((block) => [block.type, block]))
  return HOMEPAGE_SECTION_ORDER.map((type) => byType.get(type)).filter((block): block is HomepageBlock => Boolean(block))
}

function serializeHomepage(
  page: typeof pages.$inferSelect,
  blocks: Array<typeof pageBlocks.$inferSelect>,
) {
  const serialized = blocks
    .map((block) => ({
      type: block.type,
      isEnabled: block.isEnabled,
      appearance: sectionAppearanceSchema.parse(block.appearance ?? DEFAULT_SECTION_APPEARANCE),
      data: block.data,
    }) as HomepageBlock)
    .sort((left, right) => (sectionPosition.get(left.type) ?? 999) - (sectionPosition.get(right.type) ?? 999))

  return {
    id: page.id,
    title: page.title,
    seoTitle: page.seoTitle,
    seoDescription: page.seoDescription,
    canonicalUrl: page.canonicalUrl,
    status: page.status === 'review' || page.status === 'scheduled' ? 'draft' as const : page.status,
    draftVersion: page.draftVersion,
    publishedAt: page.publishedAt?.toISOString() ?? null,
    updatedAt: page.updatedAt.toISOString(),
    blocks: serialized,
  }
}

function collectMediaIds(blocks: HomepageBlock[]) {
  const ids = new Set<string>()

  for (const block of blocks) {
    if (block.appearance.backgroundMediaId) ids.add(block.appearance.backgroundMediaId)
    if (block.appearance.mobileBackgroundMediaId) ids.add(block.appearance.mobileBackgroundMediaId)
    if (block.type === 'home_hero') {
      if (block.data.imageMediaId) ids.add(block.data.imageMediaId)
      block.data.slides.forEach((slide) => ids.add(slide.imageMediaId))
    }
    if (block.type === 'home_stats') block.data.partners.forEach((partner) => ids.add(partner.mediaId))
    if (block.type === 'home_process') {
      ids.add(block.data.featureMediaId)
      block.data.models.forEach((model) => ids.add(model.mediaId))
    }
    if (block.type === 'home_testimonials') {
      block.data.items.forEach((item) => { if (item.avatarMediaId) ids.add(item.avatarMediaId) })
    }
  }

  return [...ids]
}

async function mediaReferencesExist(db: CmsDatabase, blocks: HomepageBlock[]) {
  const ids = collectMediaIds(blocks)
  if (ids.length === 0) return true
  const found = await db.select({ id: mediaAssets.id }).from(mediaAssets).where(inArray(mediaAssets.id, ids))
  return found.length === ids.length
}

async function findHomepage(db: CmsDatabase, slug = HOME_SLUG) {
  const [page] = await db
    .select()
    .from(pages)
    .where(and(eq(pages.slug, slug), isNull(pages.deletedAt)))
    .limit(1)

  if (!page) return null
  const blocks = await db.select().from(pageBlocks).where(eq(pageBlocks.pageId, page.id)).orderBy(pageBlocks.sortOrder)
  return { page, blocks }
}

async function addRevision(
  db: CmsDatabase,
  page: typeof pages.$inferSelect,
  blocks: Array<typeof pageBlocks.$inferSelect>,
  editorId: string,
  isPublished: boolean,
  changeNote?: string | null,
) {
  const [current] = await db
    .select({ version: max(pageRevisions.versionNumber) })
    .from(pageRevisions)
    .where(eq(pageRevisions.pageId, page.id))

  const [revision] = await db.insert(pageRevisions).values({
    pageId: page.id,
    editorId,
    versionNumber: (current?.version ?? 0) + 1,
    contentSnapshot: serializeHomepage(page, blocks),
    changeNote: changeNote ?? (isPublished ? 'Đã xuất bản' : 'Đã lưu phiên bản'),
    isPublished,
  }).returning()
  return revision
}

async function saveHomepage(
  db: CmsDatabase,
  rawInput: HomepageInput,
  slug: string,
  expectedVersion?: number,
) {
  const input = { ...rawInput, blocks: canonicalBlocks(rawInput.blocks) }
  let current = await findHomepage(db, slug)
  let page = current?.page

  if (!page) {
    if (expectedVersion !== undefined && expectedVersion !== 0) return { conflict: true as const, current: null }
    const [created] = await db.insert(pages).values({
      title: input.title,
      slug,
      template: 'home',
      status: 'draft',
      draftVersion: 1,
      seoTitle: input.seoTitle,
      seoDescription: input.seoDescription,
      canonicalUrl: input.canonicalUrl,
    }).returning()
    if (!created) throw new Error('Homepage was not created')
    page = created
  } else {
    const condition = expectedVersion === undefined
      ? eq(pages.id, page.id)
      : and(eq(pages.id, page.id), eq(pages.draftVersion, expectedVersion))
    const [updated] = await db.update(pages).set({
      title: input.title,
      seoTitle: input.seoTitle,
      seoDescription: input.seoDescription,
      canonicalUrl: input.canonicalUrl,
      draftVersion: sql`${pages.draftVersion} + 1`,
      updatedAt: new Date(),
    }).where(condition).returning()
    if (!updated) {
      current = await findHomepage(db, slug)
      return { conflict: true as const, current }
    }
    page = updated
  }

  await db.delete(pageBlocks).where(eq(pageBlocks.pageId, page.id))
  if (input.blocks.length > 0) {
    await db.insert(pageBlocks).values(input.blocks.map((block, index) => ({
      pageId: page.id,
      type: block.type,
      sortOrder: sectionPosition.get(block.type) ?? index,
      data: block.data,
      appearance: block.appearance,
      isEnabled: block.isEnabled,
    })))
  }

  current = await findHomepage(db, slug)
  if (!current) throw new Error('Homepage could not be reloaded')
  return { conflict: false as const, current }
}

function serializeAsset(asset: typeof mediaAssets.$inferSelect) {
  return {
    id: asset.id,
    publicUrl: asset.publicUrl,
    originalName: asset.originalName,
    mimeType: asset.mimeType,
    fileSize: asset.fileSize,
    width: asset.width,
    height: asset.height,
    altText: asset.altText,
    caption: asset.caption,
    createdAt: asset.createdAt.toISOString(),
  }
}

export function registerHomepageRoutes(app: FastifyInstance, options: {
  db: CmsDatabase
  slug?: string
  previewSecret: string
  publicOrigin: string
}) {
  const adminGuard = createAuthGuard(options.db, ['admin'])
  const homepageSlug = options.slug ?? HOME_SLUG

  const responseWithMedia = async (homepage: NonNullable<Awaited<ReturnType<typeof findHomepage>>>) => {
    const item = serializeHomepage(homepage.page, homepage.blocks)
    const mediaIds = collectMediaIds(item.blocks)
    const assets = mediaIds.length > 0
      ? await options.db.select().from(mediaAssets).where(inArray(mediaAssets.id, mediaIds))
      : []
    return { item, media: assets.map(serializeAsset) }
  }

  app.get('/api/admin/homepage', { preHandler: adminGuard }, async () => {
    const homepage = await findHomepage(options.db, homepageSlug)
    return { item: homepage ? serializeHomepage(homepage.page, homepage.blocks) : null }
  })

  app.put('/api/admin/homepage/autosave', { preHandler: adminGuard }, async (request, reply) => {
    const input = homepageAutosaveInputSchema.safeParse(request.body)
    if (!input.success) return reply.code(400).send({ error: 'INVALID_HOMEPAGE', details: input.error.flatten() })
    if (!(await mediaReferencesExist(options.db, input.data.data.blocks))) return reply.code(400).send({ error: 'MEDIA_REFERENCE_NOT_FOUND' })

    const result = await saveHomepage(options.db, input.data.data, homepageSlug, input.data.baseVersion)
    if (result.conflict) {
      return reply.code(409).send({
        error: 'CONTENT_CONFLICT',
        currentVersion: result.current?.page.draftVersion ?? 0,
        item: result.current ? serializeHomepage(result.current.page, result.current.blocks) : null,
      })
    }
    return { item: serializeHomepage(result.current.page, result.current.blocks), autosavedAt: new Date().toISOString() }
  })

  // Compatibility/manual save endpoint. Explicit saves create a revision.
  app.put('/api/admin/homepage', { preHandler: adminGuard }, async (request, reply) => {
    const input = homepageInputSchema.safeParse(request.body)
    if (!input.success) return reply.code(400).send({ error: 'INVALID_HOMEPAGE', details: input.error.flatten() })
    if (!(await mediaReferencesExist(options.db, input.data.blocks))) return reply.code(400).send({ error: 'MEDIA_REFERENCE_NOT_FOUND' })

    const user = requireCmsUser(request)
    const before = await findHomepage(options.db, homepageSlug)
    const result = await saveHomepage(options.db, input.data, homepageSlug)
    if (result.conflict) return reply.code(409).send({ error: 'CONTENT_CONFLICT' })
    await addRevision(options.db, result.current.page, result.current.blocks, user.id, false)
    await options.db.insert(auditLogs).values({
      userId: user.id,
      action: 'homepage.save',
      entityType: 'page',
      entityId: result.current.page.id,
      beforeData: before ? serializeHomepage(before.page, before.blocks) : null,
      afterData: serializeHomepage(result.current.page, result.current.blocks),
    })
    return { item: serializeHomepage(result.current.page, result.current.blocks) }
  })

  app.post('/api/admin/homepage/checkpoint', { preHandler: adminGuard }, async (request, reply) => {
    const input = homepageVersionInputSchema.safeParse(request.body)
    if (!input.success) return reply.code(400).send({ error: 'INVALID_VERSION_REQUEST' })
    const current = await findHomepage(options.db, homepageSlug)
    if (!current) return reply.code(404).send({ error: 'HOMEPAGE_NOT_FOUND' })
    if (current.page.draftVersion !== input.data.baseVersion) return reply.code(409).send({ error: 'CONTENT_CONFLICT', currentVersion: current.page.draftVersion })
    const user = requireCmsUser(request)
    const revision = await addRevision(options.db, current.page, current.blocks, user.id, false, input.data.changeNote)
    await options.db.insert(auditLogs).values({ userId: user.id, action: 'homepage.checkpoint', entityType: 'page', entityId: current.page.id })
    return { item: serializeHomepage(current.page, current.blocks), revisionId: revision?.id }
  })

  app.post('/api/admin/homepage/publish', { preHandler: adminGuard }, async (request, reply) => {
    const input = homepageVersionInputSchema.safeParse(request.body ?? { baseVersion: -1 })
    const current = await findHomepage(options.db, homepageSlug)
    if (!current || current.blocks.length === 0) return reply.code(400).send({ error: 'HOMEPAGE_DRAFT_REQUIRED' })
    if (input.success && current.page.draftVersion !== input.data.baseVersion) return reply.code(409).send({ error: 'CONTENT_CONFLICT', currentVersion: current.page.draftVersion })

    const serialized = serializeHomepage(current.page, current.blocks)
    if (!(await mediaReferencesExist(options.db, serialized.blocks))) return reply.code(400).send({ error: 'MEDIA_REFERENCE_NOT_FOUND' })

    const [publishedPage] = await options.db.update(pages).set({
      status: 'published',
      publishedAt: new Date(),
      updatedAt: new Date(),
    }).where(eq(pages.id, current.page.id)).returning()
    if (!publishedPage) return reply.code(404).send({ error: 'HOMEPAGE_NOT_FOUND' })

    const user = requireCmsUser(request)
    await addRevision(options.db, publishedPage, current.blocks, user.id, true, input.success ? input.data.changeNote : null)
    await options.db.insert(auditLogs).values({ userId: user.id, action: 'homepage.publish', entityType: 'page', entityId: publishedPage.id })
    return { item: serializeHomepage(publishedPage, current.blocks) }
  })

  app.get('/api/admin/homepage/revisions', { preHandler: adminGuard }, async (_request, reply) => {
    const homepage = await findHomepage(options.db, homepageSlug)
    if (!homepage) return reply.code(404).send({ error: 'HOMEPAGE_NOT_FOUND' })
    const rows = await options.db
      .select({
        id: pageRevisions.id,
        versionNumber: pageRevisions.versionNumber,
        changeNote: pageRevisions.changeNote,
        isPublished: pageRevisions.isPublished,
        editorName: users.fullName,
        createdAt: pageRevisions.createdAt,
      })
      .from(pageRevisions)
      .leftJoin(users, eq(pageRevisions.editorId, users.id))
      .where(eq(pageRevisions.pageId, homepage.page.id))
      .orderBy(desc(pageRevisions.versionNumber))
      .limit(50)
    return { items: rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() })) }
  })

  app.get('/api/admin/homepage/revisions/:version', { preHandler: adminGuard }, async (request, reply) => {
    const version = Number((request.params as { version: string }).version)
    if (!Number.isInteger(version) || version < 1) return reply.code(400).send({ error: 'INVALID_REVISION' })
    const homepage = await findHomepage(options.db, homepageSlug)
    if (!homepage) return reply.code(404).send({ error: 'HOMEPAGE_NOT_FOUND' })
    const [row] = await options.db
      .select({
        id: pageRevisions.id,
        versionNumber: pageRevisions.versionNumber,
        changeNote: pageRevisions.changeNote,
        isPublished: pageRevisions.isPublished,
        editorName: users.fullName,
        createdAt: pageRevisions.createdAt,
        snapshot: pageRevisions.contentSnapshot,
      })
      .from(pageRevisions)
      .leftJoin(users, eq(pageRevisions.editorId, users.id))
      .where(and(eq(pageRevisions.pageId, homepage.page.id), eq(pageRevisions.versionNumber, version)))
      .limit(1)
    if (!row) return reply.code(404).send({ error: 'REVISION_NOT_FOUND' })
    return { item: { ...row, createdAt: row.createdAt.toISOString() } }
  })

  app.post('/api/admin/homepage/revisions/:version/restore', { preHandler: adminGuard }, async (request, reply) => {
    const version = Number((request.params as { version: string }).version)
    const input = homepageVersionInputSchema.safeParse(request.body)
    if (!Number.isInteger(version) || version < 1 || !input.success) return reply.code(400).send({ error: 'INVALID_REVISION_REQUEST' })
    const homepage = await findHomepage(options.db, homepageSlug)
    if (!homepage) return reply.code(404).send({ error: 'HOMEPAGE_NOT_FOUND' })
    if (homepage.page.draftVersion !== input.data.baseVersion) return reply.code(409).send({ error: 'CONTENT_CONFLICT', currentVersion: homepage.page.draftVersion })
    const [row] = await options.db.select({ snapshot: pageRevisions.contentSnapshot }).from(pageRevisions)
      .where(and(eq(pageRevisions.pageId, homepage.page.id), eq(pageRevisions.versionNumber, version))).limit(1)
    if (!row) return reply.code(404).send({ error: 'REVISION_NOT_FOUND' })
    const restoredInput = homepageInputSchema.safeParse(row.snapshot)
    if (!restoredInput.success) return reply.code(409).send({ error: 'REVISION_INCOMPATIBLE' })
    if (!(await mediaReferencesExist(options.db, restoredInput.data.blocks))) return reply.code(400).send({ error: 'MEDIA_REFERENCE_NOT_FOUND' })

    const result = await saveHomepage(options.db, restoredInput.data, homepageSlug, input.data.baseVersion)
    if (result.conflict) return reply.code(409).send({ error: 'CONTENT_CONFLICT', currentVersion: result.current?.page.draftVersion ?? 0 })
    const [draftPage] = await options.db.update(pages).set({ status: 'draft', updatedAt: new Date() }).where(eq(pages.id, result.current.page.id)).returning()
    if (!draftPage) return reply.code(404).send({ error: 'HOMEPAGE_NOT_FOUND' })
    const user = requireCmsUser(request)
    await addRevision(options.db, draftPage, result.current.blocks, user.id, false, `Khôi phục phiên bản ${version}`)
    await options.db.insert(auditLogs).values({ userId: user.id, action: 'homepage.restore', entityType: 'page', entityId: draftPage.id, afterData: { restoredVersion: version } })
    return { item: serializeHomepage(draftPage, result.current.blocks) }
  })

  app.post('/api/admin/homepage/preview-token', { preHandler: adminGuard }, async (_request, reply) => {
    const homepage = await findHomepage(options.db, homepageSlug)
    if (!homepage) return reply.code(404).send({ error: 'HOMEPAGE_NOT_FOUND' })
    const { token, expiresAt } = createHomepagePreviewToken(options.previewSecret)
    const previewUrl = new URL('/', options.publicOrigin)
    previewUrl.searchParams.set('cmsPreview', token)
    return { token, previewUrl: previewUrl.toString(), expiresAt: expiresAt.toISOString() }
  })

  app.get('/api/public/homepage/preview', async (request, reply) => {
    const token = (request.query as { token?: string }).token ?? ''
    if (!verifyHomepagePreviewToken(token, options.previewSecret)) return reply.code(401).send({ error: 'INVALID_OR_EXPIRED_PREVIEW' })
    const homepage = await findHomepage(options.db, homepageSlug)
    if (!homepage) return reply.code(404).send({ error: 'HOMEPAGE_NOT_FOUND' })
    reply.header('Cache-Control', 'no-store, private')
    return responseWithMedia(homepage)
  })

  app.get('/api/public/homepage', async (_request, reply) => {
    const homepage = await findHomepage(options.db, homepageSlug)
    if (!homepage) return reply.code(404).send({ error: 'HOMEPAGE_NOT_FOUND' })

    const [revision] = await options.db
      .select({ snapshot: pageRevisions.contentSnapshot })
      .from(pageRevisions)
      .where(and(eq(pageRevisions.pageId, homepage.page.id), eq(pageRevisions.isPublished, true)))
      .orderBy(desc(pageRevisions.versionNumber))
      .limit(1)
    if (!revision) return reply.code(404).send({ error: 'HOMEPAGE_NOT_PUBLISHED' })

    const parsedSnapshot = homepageInputSchema.safeParse(revision.snapshot)
    const snapshot = parsedSnapshot.success
      ? { ...revision.snapshot as Record<string, unknown>, blocks: canonicalBlocks(parsedSnapshot.data.blocks) }
      : revision.snapshot as ReturnType<typeof serializeHomepage>
    const blocks = (snapshot as ReturnType<typeof serializeHomepage>).blocks
    const mediaIds = collectMediaIds(blocks)
    const assets = mediaIds.length > 0
      ? await options.db.select().from(mediaAssets).where(inArray(mediaAssets.id, mediaIds))
      : []

    return { item: snapshot, media: assets.map(serializeAsset) }
  })
}
