import { z } from 'zod'

import { contentIdSchema, offeringTypeSchema, slugSchema } from './content.js'

const optText = (max: number) => z.string().trim().max(max).nullable().default(null)
const faqPairSchema = z.tuple([z.string().trim().min(1).max(500), z.string().trim().min(1).max(2000)])

export const offeringContentSchema = z.object({
  description: z.string().trim().min(1).max(4000),
  tags: z.array(z.string().trim().min(1).max(120)).max(20).default([]),
  bestFor: z.string().trim().max(300).nullable().default(null),
  keyValue: z.string().trim().max(300).nullable().default(null),
  metrics: z.array(z.string().trim().min(1).max(180)).max(12).default([]),
  features: z.array(z.string().trim().min(1).max(500)).max(30).default([]),
  benefits: z.array(z.string().trim().min(1).max(500)).max(20).default([]),
  faq: z.array(faqPairSchema).max(20).default([]),
  items: z
    .array(
      z.object({
        title: z.string().trim().min(1).max(220),
        href: z.string().trim().min(1).max(500),
      }),
    )
    .max(30)
    .default([]),
  category: z.string().trim().max(120).nullable().default(null),
})

export const offeringInputSchema = z.object({
  type: offeringTypeSchema,
  title: z.string().trim().min(1).max(220),
  slug: slugSchema,
  summary: optText(600),
  icon: optText(120),
  coverMediaId: contentIdSchema.nullable().default(null),
  sortOrder: z.number().int().min(0).default(0),
  isFeatured: z.boolean().default(false),
  seoTitle: optText(70),
  seoDescription: optText(180),
  canonicalUrl: z.string().url().nullable().default(null),
  contentJson: offeringContentSchema,
})

export const offeringListQuerySchema = z.object({
  type: offeringTypeSchema.optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  search: z.string().trim().max(120).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
})

export const offeringResponseSchema = z.object({
  id: contentIdSchema,
  type: offeringTypeSchema,
  title: z.string(),
  slug: z.string(),
  summary: z.string().nullable(),
  icon: z.string().nullable(),
  coverMediaId: contentIdSchema.nullable(),
  coverUrl: z.string().url().nullable(),
  sortOrder: z.number().int(),
  isFeatured: z.boolean(),
  status: z.enum(['draft', 'published', 'archived']),
  seoTitle: z.string().nullable(),
  seoDescription: z.string().nullable(),
  canonicalUrl: z.string().nullable(),
  publishedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  contentJson: offeringContentSchema,
})

export type OfferingContent = z.infer<typeof offeringContentSchema>
export type OfferingInput = z.infer<typeof offeringInputSchema>
export type OfferingListQuery = z.infer<typeof offeringListQuerySchema>
export type OfferingResponse = z.infer<typeof offeringResponseSchema>
