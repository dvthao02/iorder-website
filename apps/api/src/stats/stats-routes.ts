import { postgres } from '@iorder/database'
import type { FastifyInstance } from 'fastify'

// ── Cache ─────────────────────────────────────────────────────────────────────
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 phút

let cachedCount: number | null = null
let cacheExpiresAt = 0

// ── DB connections (lazy, one per URL) ────────────────────────────────────────
const pool: Map<string, ReturnType<typeof postgres>> = new Map()

function getSql(url: string) {
  if (!pool.has(url)) {
    pool.set(url, postgres(url, { max: 2, connect_timeout: 5, idle_timeout: 30 }))
  }
  return pool.get(url)!
}

// ── Query ─────────────────────────────────────────────────────────────────────
// Thay tên bảng/điều kiện cho phù hợp với schema database iOrder App của bạn.
async function queryStoreCount(sql: ReturnType<typeof postgres>): Promise<number> {
  const result = await sql`
    SELECT COUNT(*)::int AS count
    FROM stores
    WHERE is_active = TRUE
      AND deleted_at IS NULL
  `
  return result[0]?.count ?? 0
}

// ── Route registration ────────────────────────────────────────────────────────
export function registerStatsRoutes(app: FastifyInstance, { appDbUrls }: { appDbUrls: string | undefined }) {
  const urls = appDbUrls
    ? appDbUrls.split(',').map((u) => u.trim()).filter(Boolean)
    : []

  app.get('/api/public/stats', async (_request, reply) => {
    reply.header('Cache-Control', 'public, max-age=300')

    if (urls.length === 0) {
      return { storeCount: null }
    }

    const now = Date.now()
    if (cachedCount !== null && now < cacheExpiresAt) {
      return { storeCount: cachedCount }
    }

    try {
      const counts = await Promise.all(urls.map((url) => queryStoreCount(getSql(url))))
      const total = counts.reduce((sum, n) => sum + n, 0)
      cachedCount = total
      cacheExpiresAt = now + CACHE_TTL_MS
      return { storeCount: total }
    } catch (err) {
      app.log.warn({ err }, 'stats: failed to query store count from app DB')
      return { storeCount: cachedCount } // trả cache cũ nếu có, hoặc null
    }
  })
}
