import { z } from 'zod'

export const contentStatusSchema = z.enum([
  'draft',
  'review',
  'scheduled',
  'published',
  'archived',
])

export const postTypeSchema = z.enum([
  'news',
  'promotion',
  'case_study',
  'announcement',
])

export const offeringTypeSchema = z.enum([
  'software',
  'solution',
  'service',
  'industry',
])

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
