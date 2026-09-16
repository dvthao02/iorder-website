import { readFile } from 'node:fs/promises'
import { resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createDatabase, mediaAssets } from '@iorder/database'
import { config } from 'dotenv'
import { eq } from 'drizzle-orm'

import { readEnv } from '../env.js'
import { MinioMediaStorage } from '../media/media-storage.js'

const repositoryRoot = resolve(fileURLToPath(new URL('../../../../', import.meta.url)))
config({ path: resolve(repositoryRoot, '.env') })

const env = readEnv()
if (env.MEDIA_STORAGE_DRIVER !== 'minio') {
  throw new Error('Set MEDIA_STORAGE_DRIVER=minio before migrating local media.')
}

const storageRoot = resolve(env.MEDIA_STORAGE_PATH)
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

try {
  const assets = await database.db
    .select({ id: mediaAssets.id, storageKey: mediaAssets.storageKey, mimeType: mediaAssets.mimeType })
    .from(mediaAssets)
  let migrated = 0

  for (const asset of assets) {
    const source = resolve(storageRoot, asset.storageKey)
    if (!source.startsWith(`${storageRoot}${sep}`)) {
      throw new Error(`Invalid media storage key: ${asset.storageKey}`)
    }

    const stored = await storage.putAt(asset.storageKey, await readFile(source), asset.mimeType)
    await database.db
      .update(mediaAssets)
      .set({ publicUrl: stored.publicUrl, updatedAt: new Date() })
      .where(eq(mediaAssets.id, asset.id))
    migrated += 1
  }

  process.stdout.write(`Migrated ${migrated} media assets to MinIO bucket ${env.MEDIA_S3_BUCKET}.\n`)
} finally {
  await database.close()
}
