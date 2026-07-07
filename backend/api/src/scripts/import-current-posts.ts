import { readFile, copyFile, mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createDatabase } from '@iorder/database'
import { auditLogs, mediaAssets, postRevisions, posts } from '@iorder/database'
import { config } from 'dotenv'
import { eq, max } from 'drizzle-orm'
import { imageSize } from 'image-size'

import { readEnv } from '../env.js'

interface StaticArticle {
  slug: string
  title: string
  excerpt: string
  category: string
  date: string
  imageAlt: string
  body: string[]
  checklist: string[]
}

const here = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(here, '../../../../')
config({ path: resolve(repositoryRoot, '.env') })
const env = readEnv()
const database = createDatabase(env.DATABASE_URL)
const storageRoot = resolve(repositoryRoot, 'backend/api', env.MEDIA_STORAGE_PATH)

function readStaticArticles(source: string): StaticArticle[] {
  const match = source.match(/export const newsArticles = (\[[\s\S]*?\n\])\n\nexport function/)
  if (!match?.[1]) throw new Error('Could not parse frontend/web/src/data/newsArticles.js')

  // The migration source is a repository-owned literal array; image imports are outside this captured expression.
  return Function(
    'newsImage1',
    'newsImage2',
    'newsImage3',
    `"use strict"; return (${match[1]})`,
  )(null, null, null) as StaticArticle[]
}

try {
  const source = await readFile(resolve(repositoryRoot, 'frontend/web/src/data/newsArticles.js'), 'utf8')
  const articles = readStaticArticles(source)
  const imageIds: string[] = []

  for (let index = 1; index <= 3; index += 1) {
    const sourcePath = resolve(repositoryRoot, `frontend/web/src/assets/news/news${index}.jpg`)
    const storageKey = `seed/posts/news${index}.jpg`
    const destination = resolve(storageRoot, storageKey)
    const buffer = await readFile(sourcePath)
    const dimensions = imageSize(buffer)
    await mkdir(dirname(destination), { recursive: true })
    await copyFile(sourcePath, destination)
    const [asset] = await database.db
      .insert(mediaAssets)
      .values({
        storageKey,
        publicUrl: `${env.MEDIA_PUBLIC_BASE_URL.replace(/\/$/, '')}/${storageKey}`,
        originalName: `news${index}.jpg`,
        mimeType: 'image/jpeg',
        fileSize: buffer.length,
        width: dimensions.width ?? null,
        height: dimensions.height ?? null,
        altText: `Ảnh bài viết iOrder ${index}`,
      })
      .onConflictDoUpdate({
        target: mediaAssets.storageKey,
        set: {
          fileSize: buffer.length,
          width: dimensions.width ?? null,
          height: dimensions.height ?? null,
          updatedAt: new Date(),
        },
      })
      .returning({ id: mediaAssets.id })
    if (!asset) throw new Error(`Could not import news image ${index}`)
    imageIds.push(asset.id)
  }

  for (let index = 0; index < articles.length; index += 1) {
    const article = articles[index]!
    const contentJson = { body: article.body.join('\n\n'), category: article.category, checklist: article.checklist }
    const publishedAt = new Date(`${article.date}T08:00:00+07:00`)
    const coverMediaId = imageIds[index % imageIds.length]!
    const [existing] = await database.db.select().from(posts).where(eq(posts.slug, article.slug)).limit(1)
    const values = {
      coverMediaId,
      type: 'news' as const,
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt,
      contentJson,
      status: 'published' as const,
      seoTitle: article.title.slice(0, 70),
      seoDescription: article.excerpt.slice(0, 180),
      publishedAt,
      updatedAt: new Date(),
      deletedAt: null,
    }
    const [post] = existing
      ? await database.db.update(posts).set(values).where(eq(posts.id, existing.id)).returning()
      : await database.db.insert(posts).values(values).returning()
    if (!post) throw new Error(`Could not import post ${article.slug}`)

    const [version] = await database.db
      .select({ value: max(postRevisions.versionNumber) })
      .from(postRevisions)
      .where(eq(postRevisions.postId, post.id))
    await database.db.insert(postRevisions).values({
      postId: post.id,
      versionNumber: (version?.value ?? 0) + 1,
      title: post.title,
      contentSnapshot: { ...values, id: post.id },
      changeNote: 'Imported current static article',
    })
  }

  await database.db
    .insert(auditLogs)
    .values({ action: 'posts.import', entityType: 'post_import', afterData: { count: articles.length } })
  process.stdout.write(`Imported ${articles.length} published posts and ${imageIds.length} news images.\n`)
} finally {
  await database.close()
}
