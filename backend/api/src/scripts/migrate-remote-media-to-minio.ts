import { createDatabase, mediaAssets } from '@iorder/database'
import { config } from 'dotenv'
import { eq } from 'drizzle-orm'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { readEnv } from '../env.js'
import { MinioMediaStorage } from '../media/media-storage.js'

const repositoryRoot = resolve(fileURLToPath(new URL('../../../../', import.meta.url)))
config({ path: resolve(repositoryRoot, '.env') })

const env = readEnv()
if (env.MEDIA_STORAGE_DRIVER !== 'minio') {
  throw new Error('Set MEDIA_STORAGE_DRIVER=minio before migrating remote media.')
}

const database = createDatabase(env.DATABASE_URL)
const storage = new MinioMediaStorage({
  endpoint: env.MEDIA_S3_ENDPOINT!,
  port: env.MEDIA_S3_PORT!,
  useSSL: env.MEDIA_S3_USE_SSL,
  accessKey: env.MEDIA_S3_ACCESS_KEY!,
  secretKey: env.MEDIA_S3_SECRET_KEY!,
  bucket: env.MEDIA_S3_BUCKET!,
  publicBaseUrl: env.MEDIA_PUBLIC_BASE_URL,
})
const localPublicBaseUrl = env.MEDIA_PUBLIC_BASE_URL.replace(/\/$/, '')

try {
  const assets = await database.db
    .select({
      id: mediaAssets.id,
      storageKey: mediaAssets.storageKey,
      mimeType: mediaAssets.mimeType,
      publicUrl: mediaAssets.publicUrl,
    })
    .from(mediaAssets)
  let migrated = 0
  let skipped = 0

  for (const asset of assets) {
    if (asset.publicUrl.startsWith(`${localPublicBaseUrl}/`)) {
      skipped += 1
      continue
    }

    const sourceUrl = new URL(asset.publicUrl)
    if (sourceUrl.protocol !== 'http:' && sourceUrl.protocol !== 'https:') {
      throw new Error(`Unsupported media URL for ${asset.storageKey}: ${sourceUrl.protocol}`)
    }

    const response = await fetch(sourceUrl)
    if (!response.ok) {
      throw new Error(`Could not download ${asset.storageKey}: HTTP ${response.status}`)
    }

    const stored = await storage.putAt(asset.storageKey, Buffer.from(await response.arrayBuffer()), asset.mimeType)
    await database.db
      .update(mediaAssets)
      .set({ publicUrl: stored.publicUrl, updatedAt: new Date() })
      .where(eq(mediaAssets.id, asset.id))
    migrated += 1
  }

  process.stdout.write(`Migrated ${migrated} remote media assets to MinIO; skipped ${skipped} already-local assets.\n`)
} finally {
  await database.close()
}
