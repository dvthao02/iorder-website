import { z } from 'zod'

import { contentIdSchema, managedContentStatusSchema, slugSchema } from './content.js'

export const managedPostTypeSchema = z.enum(['news', 'promotion'])
// Giữ tên export cũ để không phá import hiện có — nguồn duy nhất ở content.ts.
export const managedPostStatusSchema = managedContentStatusSchema

export const postInputSchema = z.object({
  type: managedPostTypeSchema,
  title: z.string().trim().min(1).max(220),
  slug: slugSchema,
  excerpt: z.string().trim().max(600).nullable().default(null),
  body: z.string().trim().min(1).max(200_000),
  category: z.string().trim().max(120).nullable().default(null),
  checklist: z.array(z.string().trim().min(1).max(300)).max(20).default([]),
  coverMediaId: contentIdSchema.nullable().default(null),
  seoTitle: z.string().trim().max(70).nullable().default(null),
  seoDescription: z.string().trim().max(180).nullable().default(null),
  canonicalUrl: z.string().url().nullable().default(null),
  promotionStartAt: z.coerce.date().nullable().default(null),
  promotionEndAt: z.coerce.date().nullable().default(null),
  scheduledAt: z.coerce.date().nullable().default(null),
  ctaLabel: z.string().trim().max(80).nullable().default(null),
  ctaUrl: z.string().url().nullable().default(null),
  badgeText: z.string().trim().max(60).nullable().default(null),
  categoryIds: z.array(contentIdSchema).max(20).default([]),
  tags: z.array(z.string().trim().min(1).max(60)).max(30).default([]),
})

// ── Chuyên mục & Thẻ (taxonomy) ──────────────────────────────────────────────
export const categoryRefSchema = z.object({ id: contentIdSchema, name: z.string(), slug: z.string() })
export const tagRefSchema = categoryRefSchema

export const categoryInputSchema = z.object({
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().max(2000).nullable().default(null),
  parentId: contentIdSchema.nullable().default(null),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
})

export const categoryResponseSchema = z.object({
  id: contentIdSchema,
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  parentId: contentIdSchema.nullable(),
  sortOrder: z.number(),
  postCount: z.number().int().nonnegative(),
})

export const postListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  type: managedPostTypeSchema.optional(),
  status: managedPostStatusSchema.optional(),
  search: z.string().trim().max(120).optional(),
  category: z.string().trim().max(180).optional(),
})

export const postResponseSchema = z.object({
  id: contentIdSchema,
  type: managedPostTypeSchema,
  title: z.string(),
  slug: z.string(),
  excerpt: z.string().nullable(),
  body: z.string(),
  category: z.string().nullable(),
  checklist: z.array(z.string()),
  status: managedPostStatusSchema,
  coverMediaId: contentIdSchema.nullable(),
  coverUrl: z.string().url().nullable(),
  seoTitle: z.string().nullable(),
  seoDescription: z.string().nullable(),
  canonicalUrl: z.string().nullable(),
  promotionStartAt: z.string().datetime().nullable(),
  promotionEndAt: z.string().datetime().nullable(),
  scheduledAt: z.string().datetime().nullable(),
  authorId: contentIdSchema.nullable(),
  authorName: z.string().nullable(),
  ctaLabel: z.string().nullable(),
  ctaUrl: z.string().nullable(),
  badgeText: z.string().nullable(),
  viewCount: z.number().int().nonnegative(),
  categories: z.array(categoryRefSchema),
  tags: z.array(tagRefSchema),
  publishedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

// ── Lịch sử phiên bản (revisions) ───────────────────────────────────────────
export const postRevisionSummarySchema = z.object({
  version: z.number().int().positive(),
  editorName: z.string().nullable(),
  changeNote: z.string().nullable(),
  createdAt: z.string().datetime(),
})

export const postRevisionDetailSchema = postRevisionSummarySchema.extend({
  snapshot: postResponseSchema,
})

export type PostInput = z.infer<typeof postInputSchema>
export type PostListQuery = z.infer<typeof postListQuerySchema>
export type PostResponse = z.infer<typeof postResponseSchema>
export type CategoryInput = z.infer<typeof categoryInputSchema>
export type CategoryResponse = z.infer<typeof categoryResponseSchema>
export type CategoryRef = z.infer<typeof categoryRefSchema>
export type TagRef = z.infer<typeof tagRefSchema>
export type PostRevisionSummary = z.infer<typeof postRevisionSummarySchema>
export type PostRevisionDetail = z.infer<typeof postRevisionDetailSchema>
