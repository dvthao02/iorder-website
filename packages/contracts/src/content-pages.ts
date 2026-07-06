import { z } from 'zod'

import { contentIdSchema } from './content.js'

export const contentPageStatusSchema = z.enum(['draft', 'published'])

export const contentPageSlugSchema = z
  .string()
  .trim()
  .min(1)
  .max(200)
  .regex(/^[a-z0-9-]+(\/[a-z0-9-]+)*$/, 'Slug must be lowercase segments separated by hyphens and slashes')

export const contentPageInputSchema = z.object({
  slug: contentPageSlugSchema,
  title: z.string().trim().min(2).max(220),
  lead: z.string().trim().max(2000).nullable().default(null),
  body: z.string().trim().min(1),
  seoTitle: z.string().trim().max(220).nullable().default(null),
  seoDescription: z.string().trim().max(320).nullable().default(null),
  status: contentPageStatusSchema.optional().default('draft'),
})

export const contentPageSchema = z.object({
  id: contentIdSchema,
  slug: contentPageSlugSchema,
  title: z.string(),
  lead: z.string().nullable(),
  body: z.string(),
  seoTitle: z.string().nullable(),
  seoDescription: z.string().nullable(),
  status: contentPageStatusSchema,
  publishedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export const contentPageListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: contentPageStatusSchema.optional(),
  search: z.string().trim().max(120).optional(),
})

export type ContentPageInput = z.infer<typeof contentPageInputSchema>
export type ContentPageResponse = z.infer<typeof contentPageSchema>
export type ContentPageListQuery = z.infer<typeof contentPageListQuerySchema>
export type ContentPageStatus = z.infer<typeof contentPageStatusSchema>
