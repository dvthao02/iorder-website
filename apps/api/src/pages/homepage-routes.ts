import { homepageInputSchema, type HomepageBlock, type HomepageInput } from '@iorder/contracts'
import type { CmsDatabase } from '@iorder/database'
import { auditLogs, mediaAssets, pageBlocks, pageRevisions, pages } from '@iorder/database'
import { and, desc, eq, inArray, isNull, max } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'

import { createAuthGuard, requireCmsUser } from '../auth/auth-guard.js'

const HOME_SLUG = 'home'

function serializeHomepage(
  page: typeof pages.$inferSelect,
  blocks: Array<typeof pageBlocks.$inferSelect>,
) {
  return {
    id: page.id,
    title: page.title,
    seoTitle: page.seoTitle,
    seoDescription: page.seoDescription,
    canonicalUrl: page.canonicalUrl,
    status: page.status === 'review' || page.status === 'scheduled' ? 'draft' as const : page.status,
    publishedAt: page.publishedAt?.toISOString() ?? null,
    updatedAt: page.updatedAt.toISOString(),
    blocks: blocks.map((block) => ({
      type: block.type,
      isEnabled: block.isEnabled,
      data: block.data,
    })) as HomepageBlock[],
  }
}

function collectMediaIds(blocks: HomepageBlock[]) {
  const ids = new Set<string>()

  for (const block of blocks) {
    if (block.type === 'home_hero') {
      if (block.data.imageMediaId) ids.add(block.data.imageMediaId)
      block.data.slides.forEach((slide) => ids.add(slide.imageMediaId))
    }
    if (block.type === 'home_stats') {
      block.data.partners.forEach((partner) => ids.add(partner.mediaId))
    }
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
) {
  const [current] = await db
    .select({ version: max(pageRevisions.versionNumber) })
    .from(pageRevisions)
    .where(eq(pageRevisions.pageId, page.id))

  await db.insert(pageRevisions).values({
    pageId: page.id,
    editorId,
    versionNumber: (current?.version ?? 0) + 1,
    contentSnapshot: serializeHomepage(page, blocks),
    changeNote: isPublished ? 'Published' : 'Saved draft',
    isPublished,
  })
}

async function saveHomepage(db: CmsDatabase, input: HomepageInput, slug: string) {
  let current = await findHomepage(db, slug)
  let page = current?.page

  if (!page) {
    const [created] = await db.insert(pages).values({
      title: input.title,
      slug,
      template: 'home',
      status: 'draft',
      seoTitle: input.seoTitle,
      seoDescription: input.seoDescription,
      canonicalUrl: input.canonicalUrl,
    }).returning()
    if (!created) throw new Error('Homepage was not created')
    page = created
  } else {
    const [updated] = await db.update(pages).set({
      title: input.title,
      seoTitle: input.seoTitle,
      seoDescription: input.seoDescription,
      canonicalUrl: input.canonicalUrl,
      updatedAt: new Date(),
    }).where(eq(pages.id, page.id)).returning()
    if (!updated) throw new Error('Homepage was not updated')
    page = updated
  }

  await db.delete(pageBlocks).where(eq(pageBlocks.pageId, page.id))
  if (input.blocks.length > 0) {
    await db.insert(pageBlocks).values(input.blocks.map((block, index) => ({
      pageId: page.id,
      type: block.type,
      sortOrder: index,
      data: block.data,
      isEnabled: block.isEnabled,
    })))
  }

  current = await findHomepage(db, slug)
  if (!current) throw new Error('Homepage could not be reloaded')
  return current
}

export function registerHomepageRoutes(app: FastifyInstance, options: { db: CmsDatabase; slug?: string }) {
  const adminGuard = createAuthGuard(options.db, ['admin'])
  const homepageSlug = options.slug ?? HOME_SLUG

  app.get('/api/admin/homepage', { preHandler: adminGuard }, async () => {
    const homepage = await findHomepage(options.db, homepageSlug)
    return { item: homepage ? serializeHomepage(homepage.page, homepage.blocks) : null }
  })

  app.put('/api/admin/homepage', { preHandler: adminGuard }, async (request, reply) => {
    const input = homepageInputSchema.safeParse(request.body)
    if (!input.success) return reply.code(400).send({ error: 'INVALID_HOMEPAGE', details: input.error.flatten() })
    if (!(await mediaReferencesExist(options.db, input.data.blocks))) return reply.code(400).send({ error: 'MEDIA_REFERENCE_NOT_FOUND' })

    const user = requireCmsUser(request)
    const before = await findHomepage(options.db, homepageSlug)
    const saved = await saveHomepage(options.db, input.data, homepageSlug)
    await addRevision(options.db, saved.page, saved.blocks, user.id, false)
    await options.db.insert(auditLogs).values({
      userId: user.id,
      action: 'homepage.save',
      entityType: 'page',
      entityId: saved.page.id,
      beforeData: before ? serializeHomepage(before.page, before.blocks) : null,
      afterData: serializeHomepage(saved.page, saved.blocks),
    })
    return { item: serializeHomepage(saved.page, saved.blocks) }
  })

  app.post('/api/admin/homepage/publish', { preHandler: adminGuard }, async (request, reply) => {
    const current = await findHomepage(options.db, homepageSlug)
    if (!current || current.blocks.length === 0) return reply.code(400).send({ error: 'HOMEPAGE_DRAFT_REQUIRED' })

    const [publishedPage] = await options.db.update(pages).set({
      status: 'published',
      publishedAt: new Date(),
      updatedAt: new Date(),
    }).where(eq(pages.id, current.page.id)).returning()
    if (!publishedPage) return reply.code(404).send({ error: 'HOMEPAGE_NOT_FOUND' })

    const user = requireCmsUser(request)
    await addRevision(options.db, publishedPage, current.blocks, user.id, true)
    await options.db.insert(auditLogs).values({ userId: user.id, action: 'homepage.publish', entityType: 'page', entityId: publishedPage.id })
    return { item: serializeHomepage(publishedPage, current.blocks) }
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

    const snapshot = revision.snapshot as ReturnType<typeof serializeHomepage>
    const mediaIds = collectMediaIds(snapshot.blocks)
    const assets = mediaIds.length > 0
      ? await options.db.select().from(mediaAssets).where(inArray(mediaAssets.id, mediaIds))
      : []

    return {
      item: snapshot,
      media: assets.map((asset) => ({
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
      })),
    }
  })
}
