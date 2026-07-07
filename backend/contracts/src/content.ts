import { z } from 'zod'

export const contentStatusSchema = z.enum(['draft', 'review', 'scheduled', 'published', 'archived'])

// Tập status mà workflow hiện tại THỰC SỰ vận hành (Phase 1 — docs/PHASE1_PLAN.md, Quyết định 1).
// 'review' và 'scheduled' trong enum DB là reserved, chưa dùng: hẹn giờ chạy bằng scheduledAt + draft.
// Mọi module publishable (posts, offerings, content-pages) dùng chung schema này.
export const managedContentStatusSchema = z.enum(['draft', 'published', 'archived'])
export type ManagedContentStatus = z.infer<typeof managedContentStatusSchema>

export const postTypeSchema = z.enum(['news', 'promotion', 'case_study', 'announcement'])

export const offeringTypeSchema = z.enum(['software', 'solution', 'service', 'industry'])

export const pageBlockTypeSchema = z.enum([
  'hero',
  'rich_text',
  'image',
  'feature_grid',
  'offering_list',
  'partner_list',
  'article_list',
  'download_list',
  'industry_grid',
  'deployment',
  'ecosystem',
  'cta',
  'faq',
  'contact_info',
])

export const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(180)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must contain lowercase letters, numbers, and hyphens only')

export const contentIdSchema = z.string().uuid()

export type ContentStatus = z.infer<typeof contentStatusSchema>
export type PostType = z.infer<typeof postTypeSchema>
export type OfferingType = z.infer<typeof offeringTypeSchema>
export type PageBlockType = z.infer<typeof pageBlockTypeSchema>
