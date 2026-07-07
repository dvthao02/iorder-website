import { resolve } from 'node:path'
import { config } from 'dotenv'
import postgres from 'postgres'

config({ path: resolve(import.meta.dirname, '../../../.env') })

const sql = postgres(process.env.DATABASE_URL!)

const typeMap: Record<string, string> = {
  hero: 'home_hero',
  feature_grid: 'home_features',
  industry_grid: 'home_industries',
  deployment: 'home_process',
  ecosystem: 'home_ecosystem_services',
  article_list: 'home_featured_posts',
  cta: 'home_cta',
}
const removeTypes = new Set(['rich_text', 'partner_list'])

const revisions = await sql<{ id: string; snapshot: any }[]>`
  SELECT id, content_snapshot as snapshot FROM page_revisions
  WHERE content_snapshot ? 'blocks'
`

let updated = 0
for (const rev of revisions) {
  const blocks: any[] = rev.snapshot?.blocks ?? []
  const newBlocks = blocks
    .filter((b: any) => !removeTypes.has(b.type))
    .map((b: any) => ({ ...b, type: typeMap[b.type] ?? b.type }))
  const newSnapshot = { ...rev.snapshot, blocks: newBlocks }
  await sql`UPDATE page_revisions SET content_snapshot = ${sql.json(newSnapshot)} WHERE id = ${rev.id}`
  updated++
  console.log(`  ✓ revision ${rev.id}: ${blocks.length} → ${newBlocks.length} blocks`)
}

console.log(`\nUpdated ${updated} revision(s).`)
await sql.end()
