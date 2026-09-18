import { z } from 'zod'

import { contentIdSchema, managedContentStatusSchema, offeringTypeSchema, slugSchema } from './content.js'

const optText = (max: number) => z.string().trim().max(max).nullable().default(null)
const faqPairSchema = z.tuple([z.string().trim().min(1).max(500), z.string().trim().min(1).max(2000)])

/**
 * Các khối nội dung có thể sắp xếp cho trang detail. Phần tử hình ảnh lưu
 * media id (thay vì URL tĩnh), để người biên tập thay ảnh trong Media Library.
 */
export const offeringSectionTypeSchema = z.enum([
  'hero',
  'richText',
  'stats',
  'featureGrid',
  'benefitList',
  'imageText',
  'imageShowcase',
  'process',
  'highlight',
  'steps',
  'comparison',
  'deviceShowcase',
  'gallery',
  'useCases',
  'testimonial',
  'faq',
  'cta',
  'spacer',
])

export const offeringSectionSchema = z.object({
  id: z.string().trim().min(1).max(80),
  type: offeringSectionTypeSchema,
  variant: z.string().trim().min(1).max(80).default('default'),
  background: z.enum(['white', 'soft-blue', 'gradient', 'navy']).default('white'),
  container: z.enum(['standard', 'wide', 'narrow']).default('standard'),
  alignment: z.enum(['left', 'center']).default('left'),
  spacing: z.enum(['compact', 'normal', 'spacious']).default('normal'),
  isVisible: z.boolean().default(true),
  eyebrow: optText(120),
  title: optText(220),
  body: optText(4000),
  imageMediaId: contentIdSchema.nullable().default(null),
  imageAlt: optText(220),
  ctaLabel: optText(120),
  ctaHref: z.string().trim().max(500).nullable().default(null),
  items: z
    .array(
      z.object({
        title: z.string().trim().min(1).max(220),
        description: z.string().trim().max(2000).nullable().default(null),
        href: z.string().trim().max(500).nullable().default(null),
      }),
    )
    .max(30)
    .default([]),
})

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
  sections: z.array(offeringSectionSchema).max(30).default([]),
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
  status: managedContentStatusSchema.optional(),
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
  sectionMediaUrls: z.record(contentIdSchema, z.string().url()).default({}),
  sortOrder: z.number().int(),
  isFeatured: z.boolean(),
  status: managedContentStatusSchema,
  seoTitle: z.string().nullable(),
  seoDescription: z.string().nullable(),
  canonicalUrl: z.string().nullable(),
  publishedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  contentJson: offeringContentSchema,
})

export type OfferingContent = z.infer<typeof offeringContentSchema>
export type OfferingSection = z.infer<typeof offeringSectionSchema>
export type OfferingInput = z.infer<typeof offeringInputSchema>
export type OfferingListQuery = z.infer<typeof offeringListQuerySchema>
export type OfferingResponse = z.infer<typeof offeringResponseSchema>
