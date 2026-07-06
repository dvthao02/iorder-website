import { z } from 'zod'

import { contentIdSchema } from './content.js'

export const mediaKindSchema = z.enum(['image', 'document'])

export const mediaMetadataInputSchema = z.object({
  altText: z.string().trim().max(500).nullable().default(null),
  caption: z.string().trim().max(2000).nullable().default(null),
})

export const mediaListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(24),
  kind: mediaKindSchema.optional(),
  search: z.string().trim().max(120).optional(),
})

export const mediaAssetSchema = z.object({
  id: contentIdSchema,
  publicUrl: z.string().url(),
  originalName: z.string(),
  mimeType: z.string(),
  fileSize: z.number().int().nonnegative(),
  width: z.number().int().positive().nullable(),
  height: z.number().int().positive().nullable(),
  altText: z.string().nullable(),
  caption: z.string().nullable(),
  createdAt: z.string().datetime(),
})

export const mediaListResponseSchema = z.object({
  items: z.array(mediaAssetSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
})

export const mediaUsageSchema = z.object({
  entityType: z.enum(['homepage_section', 'post', 'offering', 'partner', 'testimonial', 'site_profile']),
  entityId: contentIdSchema,
  label: z.string(),
  location: z.string(),
})

export type MediaAsset = z.infer<typeof mediaAssetSchema>
export type MediaKind = z.infer<typeof mediaKindSchema>
export type MediaListQuery = z.infer<typeof mediaListQuerySchema>
export type MediaListResponse = z.infer<typeof mediaListResponseSchema>
export type MediaMetadataInput = z.infer<typeof mediaMetadataInputSchema>
export type MediaUsage = z.infer<typeof mediaUsageSchema>
