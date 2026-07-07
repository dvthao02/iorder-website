import { resolve } from 'node:path'
import { config } from 'dotenv'
import postgres from 'postgres'

config({ path: resolve(import.meta.dirname, '../../../.env') })

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL is required')

const sql = postgres(databaseUrl)

const newValues = [
  'home_hero',
  'home_stats',
  'home_features',
  'home_industries',
  'home_ecosystem_services',
  'home_process',
  'home_testimonials',
  'home_featured_posts',
  'home_faq',
  'home_cta',
]

// Step 1: ADD VALUE outside any transaction (auto-commit each)
console.log('Step 1: Adding enum values...')
for (const value of newValues) {
  try {
    await sql.unsafe(`ALTER TYPE "public"."page_block_type" ADD VALUE IF NOT EXISTS '${value}'`)
    console.log(`  ✓ ${value}`)
  } catch (err) {
    console.error(`  ✗ ${value}:`, err)
  }
}

// Step 2: Migrate existing data in a transaction
console.log('\nStep 2: Migrating existing block data...')
await sql.begin(async (tx) => {
  const renames: [string, string][] = [
    ['hero', 'home_hero'],
    ['feature_grid', 'home_features'],
    ['industry_grid', 'home_industries'],
    ['deployment', 'home_process'],
    ['ecosystem', 'home_ecosystem_services'],
    ['article_list', 'home_featured_posts'],
    ['cta', 'home_cta'],
  ]
  for (const [from, to] of renames) {
    const result = await tx.unsafe(`UPDATE "public"."page_blocks" SET "type" = '${to}' WHERE "type" = '${from}'`)
    console.log(`  ✓ ${from} → ${to} (${result.count} rows)`)
  }
  const deleted = await tx.unsafe(`DELETE FROM "public"."page_blocks" WHERE "type" IN ('rich_text', 'partner_list')`)
  console.log(`  ✓ deleted rich_text + partner_list (${deleted.count} rows)`)
})

// Step 3: Mark migrations as applied in Drizzle's table
console.log('\nStep 3: Marking migrations as applied...')
await sql.unsafe(`
  INSERT INTO "drizzle"."__drizzle_migrations" (hash, created_at)
  SELECT hash, created_at FROM (VALUES
    ('0005_home_block_types',        1782200000000),
    ('0006_home_block_data_migration', 1782200000001)
  ) AS v(hash, created_at)
  WHERE NOT EXISTS (
    SELECT 1 FROM "drizzle"."__drizzle_migrations" WHERE hash = v.hash
  )
`)
console.log('  ✓ migration records inserted')

await sql.end()
console.log('\nDone.')
