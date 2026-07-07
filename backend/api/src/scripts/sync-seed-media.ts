import { copyFile, mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createDatabase, mediaAssets } from '@iorder/database'
import { config } from 'dotenv'
import { eq } from 'drizzle-orm'

import { readEnv } from '../env.js'

const here = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(here, '../../../../')

config({ path: resolve(repositoryRoot, '.env') })

const env = readEnv()
const storageRoot = resolve(env.MEDIA_STORAGE_PATH)
const publicBaseUrl = env.MEDIA_PUBLIC_BASE_URL.replace(/\/$/, '')
const database = createDatabase(env.DATABASE_URL)

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

try {
  let copied = 0
  let urlsUpdated = 0

  for (const [storageKey, sourcePath] of seedMediaFiles) {
    const source = resolve(repositoryRoot, sourcePath)
    const destination = resolve(storageRoot, storageKey)
    const publicUrl = `${publicBaseUrl}/${storageKey}`

    await mkdir(dirname(destination), { recursive: true })
    await copyFile(source, destination)
    copied += 1

    const updated = await database.db
      .update(mediaAssets)
      .set({ publicUrl, updatedAt: new Date() })
      .where(eq(mediaAssets.storageKey, storageKey))
      .returning({ id: mediaAssets.id })
    urlsUpdated += updated.length
  }

  process.stdout.write(`Synced ${copied} seed media files to ${storageRoot}; repaired ${urlsUpdated} media URLs.\n`)
} finally {
  await database.close()
}
