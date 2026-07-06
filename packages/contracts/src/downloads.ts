import { z } from 'zod'

import { contentIdSchema } from './content.js'

export const downloadIconSchema = z.enum([
  'download',
  'monitor-down',
  'printer',
  'file-spreadsheet',
  'file-text',
  'shield-check',
  'package',
  'smartphone',
])

export const downloadInputSchema = z.object({
  title: z.string().trim().min(1).max(220),
  description: z.string().trim().max(2000).nullable().default(null),
  meta: z.string().trim().max(160).nullable().default(null),
  icon: downloadIconSchema.default('download'),
  fileMediaId: contentIdSchema.nullable().default(null),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
  isEnabled: z.boolean().default(true),
})

export const downloadResponseSchema = z.object({
  id: contentIdSchema,
  title: z.string(),
  description: z.string().nullable(),
  meta: z.string().nullable(),
  icon: downloadIconSchema,
  fileMediaId: contentIdSchema.nullable(),
  fileUrl: z.string().url().nullable(),
  fileName: z.string().nullable(),
  sortOrder: z.number(),
  isEnabled: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export type DownloadIcon = z.infer<typeof downloadIconSchema>
export type DownloadInput = z.infer<typeof downloadInputSchema>
export type DownloadResponse = z.infer<typeof downloadResponseSchema>
