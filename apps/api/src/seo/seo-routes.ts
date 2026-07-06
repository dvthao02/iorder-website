import type { CmsDatabase } from '@iorder/database'
import { offerings, posts } from '@iorder/database'
import { and, eq, isNull, lte, or } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'

const OFFERING_PREFIX: Record<string, string> = {
  software: 'phan-mem',
  solution: 'giai-phap',
  service: 'dich-vu',
  industry: 'nganh-hang',
}

// Trang tĩnh quan trọng (đường dẫn cố định của website).
const STATIC_PATHS = ['/', '/tin-tuc', '/phan-mem', '/giai-phap', '/dich-vu', '/lien-he']

function xmlEscape(value: string) {
  return value.replace(
    /[<>&'"]/g,
    (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[char] as string,
  )
}

function normalizeOrigin(origin: string) {
  return origin.replace(/\/$/, '')
}

// Dùng chung cho route động và script sinh file tĩnh (fallback) → luôn khớp dữ liệu.
export async function buildSitemapXml(db: CmsDatabase, publicOrigin: string) {
  const origin = normalizeOrigin(publicOrigin)
  const now = new Date()
  const [postRows, offeringRows] = await Promise.all([
    db
      .select({ slug: posts.slug, updatedAt: posts.updatedAt })
      .from(posts)
      .where(
        and(
          eq(posts.status, 'published'),
          isNull(posts.deletedAt),
          or(isNull(posts.publishedAt), lte(posts.publishedAt, now)),
        ),
      ),
    db
      .select({ type: offerings.type, slug: offerings.slug, updatedAt: offerings.updatedAt })
      .from(offerings)
      .where(and(eq(offerings.status, 'published'), isNull(offerings.deletedAt))),
  ])

  const urls: Array<{ loc: string; lastmod?: Date }> = []
  for (const path of STATIC_PATHS) urls.push({ loc: `${origin}${path}` })
  for (const row of postRows) urls.push({ loc: `${origin}/tin-tuc/${row.slug}`, lastmod: row.updatedAt })
  for (const row of offeringRows) {
    const prefix = OFFERING_PREFIX[row.type] ?? row.type
    urls.push({ loc: `${origin}/${prefix}/${row.slug}`, lastmod: row.updatedAt })
  }

  const body = urls
    .map((url) => {
      const lastmod = url.lastmod ? `<lastmod>${url.lastmod.toISOString()}</lastmod>` : ''
      return `<url><loc>${xmlEscape(url.loc)}</loc>${lastmod}</url>`
    })
    .join('')
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`
}

export function buildRobotsTxt(publicOrigin: string) {
  return `User-agent: *\nAllow: /\nDisallow: /admin\n\nSitemap: ${normalizeOrigin(publicOrigin)}/sitemap.xml\n`
}

export function registerSeoRoutes(app: FastifyInstance, options: { db: CmsDatabase; publicOrigin: string }) {
  app.get('/sitemap.xml', async (_request, reply) => {
    void reply.type('application/xml; charset=utf-8')
    void reply.header('cache-control', 'public, max-age=3600')
    return buildSitemapXml(options.db, options.publicOrigin)
  })

  app.get('/robots.txt', async (_request, reply) => {
    void reply.type('text/plain; charset=utf-8')
    return buildRobotsTxt(options.publicOrigin)
  })
}
