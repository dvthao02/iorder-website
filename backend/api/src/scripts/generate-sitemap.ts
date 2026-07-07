import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createDatabase } from '@iorder/database'
import { config } from 'dotenv'

import { buildRobotsTxt, buildSitemapXml } from '../seo/seo-routes.js'

// Sinh sitemap.xml + robots.txt tĩnh (fallback) từ DB → luôn khớp dữ liệu thật.
// Ghi vào frontend/web/dist (build output), KHÔNG đụng file seed đã commit.
// Không làm vỡ build: thiếu DB / chưa build web → bỏ qua, giữ bản tĩnh sẵn có.
const currentDirectory = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(currentDirectory, '../../../../.env') })

const repoRoot = resolve(currentDirectory, '../../../..')
const outDir = resolve(repoRoot, 'frontend/web/dist')
const publicOrigin = process.env.PUBLIC_ORIGIN ?? 'https://iorder.vn'
const databaseUrl = process.env.DATABASE_URL

async function main() {
  if (!databaseUrl) {
    console.warn('[sitemap] Bỏ qua: thiếu DATABASE_URL (giữ bản tĩnh đã có).')
    return
  }
  if (!existsSync(outDir)) {
    console.warn(`[sitemap] Bỏ qua: chưa có ${outDir} (hãy build web trước).`)
    return
  }
  const connection = createDatabase(databaseUrl)
  try {
    const sitemap = await buildSitemapXml(connection.db, publicOrigin)
    const robots = buildRobotsTxt(publicOrigin)
    await mkdir(outDir, { recursive: true })
    await writeFile(resolve(outDir, 'sitemap.xml'), sitemap, 'utf8')
    await writeFile(resolve(outDir, 'robots.txt'), robots, 'utf8')
    console.log(`[sitemap] Đã sinh sitemap.xml & robots.txt cho ${publicOrigin}`)
  } finally {
    await connection.close()
  }
}

main().catch((error) => {
  console.warn('[sitemap] Bỏ qua do lỗi (giữ bản tĩnh):', error instanceof Error ? error.message : error)
  process.exitCode = 0
})
