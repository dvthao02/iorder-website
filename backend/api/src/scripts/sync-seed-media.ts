import { readFile, stat } from 'node:fs/promises'
import { basename, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createDatabase, mediaAssets, salesEquipment } from '@iorder/database'
import { config } from 'dotenv'
import { eq } from 'drizzle-orm'

import { readEnv } from '../env.js'
import { LocalMediaStorage, MinioMediaStorage, type KeyedMediaStorage } from '../media/media-storage.js'

const here = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(here, '../../../../')

config({ path: resolve(repositoryRoot, '.env') })

const env = readEnv()
const storageRoot = resolve(env.MEDIA_STORAGE_PATH)
const database = createDatabase(env.DATABASE_URL)
const mediaStorage: KeyedMediaStorage =
  env.MEDIA_STORAGE_DRIVER === 'minio'
    ? new MinioMediaStorage({
        endpoint: env.MEDIA_S3_ENDPOINT!,
        port: env.MEDIA_S3_PORT!,
        useSSL: env.MEDIA_S3_USE_SSL,
        accessKey: env.MEDIA_S3_ACCESS_KEY!,
        secretKey: env.MEDIA_S3_SECRET_KEY!,
        bucket: env.MEDIA_S3_BUCKET!,
        publicBaseUrl: env.MEDIA_PUBLIC_BASE_URL,
      })
    : new LocalMediaStorage(storageRoot, env.MEDIA_PUBLIC_BASE_URL)

const seedMediaFiles = [
  ['seed/home/hero-1.png', 'frontend/web/src/assets/products/hero-img.png'],
  ['seed/home/hero-2.png', 'frontend/web/src/assets/products/hero-img2.png'],
  ['seed/home/hero-3.jpg', 'frontend/web/src/assets/products/hero-img3.jpg'],
  ['seed/home/deployment-phone.png', 'frontend/web/src/assets/products/mh-phone-iot.png'],
  ['seed/home/deployment-computer.png', 'frontend/web/src/assets/products/mh-mt-iot.png'],
  ['seed/home/deployment-pos.png', 'frontend/web/src/assets/products/mh-pos-iot.png'],
  ['seed/home/ttc.png', 'frontend/web/src/assets/partners/ttc.png'],
  ['seed/home/shopeefood.png', 'frontend/web/src/assets/partners/shopeefood.png'],
  ['seed/home/grabfood.png', 'frontend/web/src/assets/partners/grabfood.png'],
  ['seed/home/taxnet.png', 'frontend/web/src/assets/partners/taxnet.png'],
  ['seed/home/crm-online.png', 'frontend/web/src/assets/partners/crm_online.png'],
  ['seed/home/huit.png', 'frontend/web/src/assets/partners/huit.png'],
  ['seed/home/tan-an-phat.png', 'frontend/web/src/assets/partners/tan_an_phat.png'],
  ['seed/home/cmc.png', 'frontend/web/src/assets/partners/cmc.png'],
  ['seed/home/etelecom.png', 'frontend/web/src/assets/partners/etelecom.png'],
  ['seed/home/lac-viet.png', 'frontend/web/src/assets/partners/lac_viet.png'],
  ['seed/home/base.png', 'frontend/web/src/assets/partners/base.png'],
  ['seed/home/incard.png', 'frontend/web/src/assets/partners/in_card.png'],
  ['seed/home/mobifone.png', 'frontend/web/src/assets/partners/mobifone.png'],
  ['seed/home/bni.png', 'frontend/web/src/assets/partners/bni.png'],
  ['seed/home/vietnix.png', 'frontend/web/src/assets/partners/vietnix.png'],
  ['seed/home/vietsunco.png', 'frontend/web/src/assets/partners/vietsunco.png'],
  ['seed/posts/news1.jpg', 'frontend/web/src/assets/news/news1.jpg'],
  ['seed/posts/news2.jpg', 'frontend/web/src/assets/news/news2.jpg'],
  ['seed/posts/news3.jpg', 'frontend/web/src/assets/news/news3.jpg'],
] as const

// Các ảnh đã có trong source được đưa vào Media Library, thay vì để catalog
// Thiết bị phụ thuộc asset tĩnh. Mỗi entry có thể gắn ngay với một product seed.
const equipmentMediaFiles = [
  ['seed/equipment/iod86.png', 'frontend/web/src/assets/products/documentation/iorder-pos-terminal.png', 'may-pos-iod86'],
  ['seed/equipment/pos-mini.png', 'frontend/web/src/assets/products/documentation/iorder-pos-tablet-angle.png', 'may-pos-iorder-mini'],
  ['seed/equipment/printer.png', 'frontend/web/src/assets/products/hero-pos-fnb-cutout.png', 'may-in-hoa-don-tp80'],
  ['seed/equipment/scanner.png', 'frontend/web/src/assets/products/hero-pos-retail-cutout.png', 'may-quet-ma-vach-scanpro'],
  ['seed/equipment/cash-drawer.png', 'frontend/web/src/assets/products/documentation/iorder-pos-hardware-bundle.png', 'ket-dung-tien-cd410'],
] as const

try {
  let copied = 0
  let urlsUpdated = 0

  for (const [storageKey, sourcePath] of seedMediaFiles) {
    const source = resolve(repositoryRoot, sourcePath)
    const mimeType = storageKey.endsWith('.jpg') ? 'image/jpeg' : 'image/png'
    const { publicUrl } = await mediaStorage.putAt(storageKey, await readFile(source), mimeType)
    copied += 1

    const updated = await database.db
      .update(mediaAssets)
      .set({ publicUrl, updatedAt: new Date() })
      .where(eq(mediaAssets.storageKey, storageKey))
      .returning({ id: mediaAssets.id })
    urlsUpdated += updated.length
  }

  let equipmentLinked = 0
  for (const [storageKey, sourcePath, equipmentSlug] of equipmentMediaFiles) {
    const source = resolve(repositoryRoot, sourcePath)
    const sourceStats = await stat(source)
    const mimeType = storageKey.endsWith('.jpg') ? 'image/jpeg' : 'image/png'
    const { publicUrl } = await mediaStorage.putAt(storageKey, await readFile(source), mimeType)
    copied += 1

    const [existing] = await database.db
      .select({ id: mediaAssets.id })
      .from(mediaAssets)
      .where(eq(mediaAssets.storageKey, storageKey))
      .limit(1)
    const asset = existing
      ? (
          await database.db
            .update(mediaAssets)
            .set({ publicUrl, fileSize: sourceStats.size, updatedAt: new Date() })
            .where(eq(mediaAssets.id, existing.id))
            .returning({ id: mediaAssets.id })
        )[0]
      : (
          await database.db
            .insert(mediaAssets)
            .values({
              storageKey,
              publicUrl,
              originalName: basename(source),
              mimeType,
              fileSize: sourceStats.size,
              altText: `Thiết bị iOrder ${equipmentSlug}`,
            })
            .returning({ id: mediaAssets.id })
        )[0]
    if (!asset) throw new Error(`Could not create media asset for ${storageKey}`)

    const linked = await database.db
      .update(salesEquipment)
      .set({ coverMediaId: asset.id, updatedAt: new Date() })
      .where(eq(salesEquipment.slug, equipmentSlug))
      .returning({ id: salesEquipment.id })
    equipmentLinked += linked.length
  }

  process.stdout.write(
    `Synced ${copied} seed media files to ${env.MEDIA_STORAGE_DRIVER}; repaired ${urlsUpdated} media URLs; linked ${equipmentLinked} equipment covers.\n`,
  )
} finally {
  await database.close()
}
