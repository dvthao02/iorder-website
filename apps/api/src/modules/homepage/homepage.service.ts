import { homepageInputSchema, type HomepageInput } from '@iorder/contracts'

import type { HookManager } from '../../shared/hooks/index.js'
import { createHomepagePreviewToken } from '../../pages/preview-token.js'
import {
  ContentConflictError,
  HomepageDraftRequiredError,
  HomepageNotFoundError,
  MediaReferenceNotFoundError,
  RevisionIncompatibleError,
  RevisionNotFoundError,
} from './homepage.errors.js'
import { HOMEPAGE_EVENTS } from './homepage.hooks.js'
import {
  collectMediaIds,
  normalizeBlocks,
  serializeAsset,
  serializeHomepage,
  type HomepageRepository,
} from './homepage.repository.js'

const HOME_SLUG = 'home'

export class HomepageService {
  constructor(
    private repository: HomepageRepository,
    private hooks: HookManager,
    private slug: string = HOME_SLUG,
  ) {}

  async getHomepage() {
    const homepage = await this.repository.findBySlug(this.slug)
    return homepage ? serializeHomepage(homepage.page, homepage.blocks) : null
  }

  async getHomepageWithMedia() {
    const homepage = await this.repository.findBySlug(this.slug)
    if (!homepage) throw new HomepageNotFoundError()
    return this.responseWithMedia(homepage)
  }

  async autosave(input: HomepageInput, baseVersion: number) {
    if (!(await this.repository.mediaReferencesExist(input.blocks))) throw new MediaReferenceNotFoundError()

    const result = await this.repository.save(input, this.slug, baseVersion)
    if (result.conflict) {
      throw new ContentConflictError(result.current?.page.draftVersion ?? 0)
    }

    await this.hooks.emit(HOMEPAGE_EVENTS.AUTOSAVED, {
      pageId: result.current.page.id,
      version: result.current.page.draftVersion,
    })

    return {
      item: serializeHomepage(result.current.page, result.current.blocks),
      autosavedAt: new Date().toISOString(),
    }
  }

  async save(input: HomepageInput, editorId: string) {
    if (!(await this.repository.mediaReferencesExist(input.blocks))) throw new MediaReferenceNotFoundError()

    const before = await this.repository.findBySlug(this.slug)
    const result = await this.repository.save(input, this.slug)
    if (result.conflict) throw new ContentConflictError(result.current?.page.draftVersion ?? 0)

    await this.repository.addRevision(result.current.page, result.current.blocks, editorId, false)
    await this.repository.insertAuditLog({
      userId: editorId,
      action: 'homepage.save',
      entityType: 'page',
      entityId: result.current.page.id,
      beforeData: before ? serializeHomepage(before.page, before.blocks) : null,
      afterData: serializeHomepage(result.current.page, result.current.blocks),
    })

    return { item: serializeHomepage(result.current.page, result.current.blocks) }
  }

  async createCheckpoint(baseVersion: number, editorId: string, changeNote?: string | null) {
    const current = await this.repository.findBySlug(this.slug)
    if (!current) throw new HomepageNotFoundError()
    if (current.page.draftVersion !== baseVersion) throw new ContentConflictError(current.page.draftVersion)

    const revision = await this.repository.addRevision(current.page, current.blocks, editorId, false, changeNote)
    await this.repository.insertAuditLog({
      userId: editorId,
      action: 'homepage.checkpoint',
      entityType: 'page',
      entityId: current.page.id,
    })

    return { item: serializeHomepage(current.page, current.blocks), revisionId: revision?.id }
  }

  async publish(baseVersion: number | null, editorId: string, changeNote?: string | null) {
    const current = await this.repository.findBySlug(this.slug)
    if (!current || current.blocks.length === 0) throw new HomepageDraftRequiredError()
    if (baseVersion !== null && current.page.draftVersion !== baseVersion)
      throw new ContentConflictError(current.page.draftVersion)

    const serialized = serializeHomepage(current.page, current.blocks)
    if (!(await this.repository.mediaReferencesExist(serialized.blocks))) throw new MediaReferenceNotFoundError()

    const publishedPage = await this.repository.publish(current.page.id)
    if (!publishedPage) throw new HomepageNotFoundError()

    await this.repository.addRevision(publishedPage, current.blocks, editorId, true, changeNote)
    await this.repository.insertAuditLog({
      userId: editorId,
      action: 'homepage.publish',
      entityType: 'page',
      entityId: publishedPage.id,
    })

    await this.hooks.emit(HOMEPAGE_EVENTS.PUBLISHED, {
      pageId: publishedPage.id,
      version: publishedPage.draftVersion,
      editorId,
    })

    return { item: serializeHomepage(publishedPage, current.blocks) }
  }

  async listRevisions() {
    const homepage = await this.repository.findBySlug(this.slug)
    if (!homepage) throw new HomepageNotFoundError()
    return { items: await this.repository.listRevisions(homepage.page.id) }
  }

  async getRevision(version: number) {
    const homepage = await this.repository.findBySlug(this.slug)
    if (!homepage) throw new HomepageNotFoundError()
    const row = await this.repository.findRevisionByVersion(homepage.page.id, version)
    if (!row) throw new RevisionNotFoundError()
    return { item: row }
  }

  async restoreRevision(version: number, baseVersion: number, editorId: string) {
    const homepage = await this.repository.findBySlug(this.slug)
    if (!homepage) throw new HomepageNotFoundError()
    if (homepage.page.draftVersion !== baseVersion) throw new ContentConflictError(homepage.page.draftVersion)

    const row = await this.repository.findRevisionByVersion(homepage.page.id, version)
    if (!row) throw new RevisionNotFoundError()

    const restoredInput = homepageInputSchema.safeParse(row.snapshot)
    if (!restoredInput.success) throw new RevisionIncompatibleError()
    if (!(await this.repository.mediaReferencesExist(restoredInput.data.blocks)))
      throw new MediaReferenceNotFoundError()

    const result = await this.repository.save(restoredInput.data, this.slug, baseVersion)
    if (result.conflict) throw new ContentConflictError(result.current?.page.draftVersion ?? 0)

    const draftPage = await this.repository.markDraft(result.current.page.id)
    if (!draftPage) throw new HomepageNotFoundError()

    await this.repository.addRevision(
      draftPage,
      result.current.blocks,
      editorId,
      false,
      `Khôi phục phiên bản ${version}`,
    )
    await this.repository.insertAuditLog({
      userId: editorId,
      action: 'homepage.restore',
      entityType: 'page',
      entityId: draftPage.id,
      afterData: { restoredVersion: version },
    })

    await this.hooks.emit(HOMEPAGE_EVENTS.RESTORED, { pageId: draftPage.id, version })

    return { item: serializeHomepage(draftPage, result.current.blocks) }
  }

  async createPreviewToken(previewSecret: string, publicOrigin: string) {
    const homepage = await this.repository.findBySlug(this.slug)
    if (!homepage) throw new HomepageNotFoundError()
    const { token, expiresAt } = createHomepagePreviewToken(previewSecret)
    const previewUrl = new URL('/', publicOrigin)
    previewUrl.searchParams.set('cmsPreview', token)
    return { token, previewUrl: previewUrl.toString(), expiresAt: expiresAt.toISOString() }
  }

  async getPreviewData() {
    const homepage = await this.repository.findBySlug(this.slug)
    if (!homepage) throw new HomepageNotFoundError()
    return this.responseWithMedia(homepage)
  }

  async getPublicHomepage() {
    const homepage = await this.repository.findBySlug(this.slug)
    if (!homepage) throw new HomepageNotFoundError()

    const revision = await this.repository.findLatestPublishedSnapshot(homepage.page.id)
    if (!revision) return null

    const parsedSnapshot = homepageInputSchema.safeParse(revision.snapshot)
    const snapshot = parsedSnapshot.success
      ? { ...(revision.snapshot as Record<string, unknown>), blocks: normalizeBlocks(parsedSnapshot.data.blocks) }
      : (revision.snapshot as ReturnType<typeof serializeHomepage>)
    const blocks = (snapshot as ReturnType<typeof serializeHomepage>).blocks
    const mediaIds = collectMediaIds(blocks)
    const assets = await this.repository.findAssetsByIds(mediaIds)

    return { item: snapshot, media: assets.map(serializeAsset) }
  }

  private async responseWithMedia(homepage: NonNullable<Awaited<ReturnType<HomepageRepository['findBySlug']>>>) {
    const item = serializeHomepage(homepage.page, homepage.blocks)
    const mediaIds = collectMediaIds(item.blocks)
    const assets = await this.repository.findAssetsByIds(mediaIds)
    return { item, media: assets.map(serializeAsset) }
  }
}
