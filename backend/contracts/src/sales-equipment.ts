import { z } from 'zod'

import { contentIdSchema, managedContentStatusSchema, slugSchema } from './content.js'

const optionalText = (max: number) => z.string().trim().max(max).nullable().default(null)

export const salesEquipmentCategorySchema = z.enum(['pos', 'printer', 'scanner', 'cash_drawer', 'accessory'])

export const equipmentSpecificationGroupSchema = z.object({
  title: z.string().trim().min(1).max(120),
  items: z.array(z.string().trim().min(1).max(500)).min(1).max(12),
})

export const salesEquipmentInputSchema = z.object({
  category: salesEquipmentCategorySchema,
  name: z.string().trim().min(1).max(220),
  slug: slugSchema,
  modelCode: optionalText(80),
  coverMediaId: contentIdSchema.nullable().default(null),
  priceVnd: z.coerce.number().int().min(0).max(999_999_999_999),
  warrantyMonths: z.coerce.number().int().min(0).max(120).default(12),
  summary: optionalText(600),
  specificationGroups: z.array(equipmentSpecificationGroupSchema).max(6).default([]),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
  isFeatured: z.boolean().default(false),
  seoTitle: optionalText(70),
  seoDescription: optionalText(180),
  canonicalUrl: z.string().url().nullable().default(null),
})

export const salesEquipmentListQuerySchema = z.object({
  category: salesEquipmentCategorySchema.optional(),
  status: managedContentStatusSchema.optional(),
  search: z.string().trim().max(120).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
})

export const salesEquipmentResponseSchema = z.object({
  id: contentIdSchema,
  category: salesEquipmentCategorySchema,
  name: z.string(),
  slug: z.string(),
  modelCode: z.string().nullable(),
  coverMediaId: contentIdSchema.nullable(),
  coverUrl: z.string().url().nullable(),
  priceVnd: z.number().int(),
  warrantyMonths: z.number().int(),
  summary: z.string().nullable(),
  specificationGroups: z.array(equipmentSpecificationGroupSchema),
  sortOrder: z.number().int(),
  isFeatured: z.boolean(),
  status: managedContentStatusSchema,
  seoTitle: z.string().nullable(),
  seoDescription: z.string().nullable(),
  canonicalUrl: z.string().nullable(),
  publishedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export const salesEquipmentRevisionSummarySchema = z.object({
  versionNumber: z.number().int().min(1),
  changeNote: z.string().trim().min(1).max(500),
  createdAt: z.string().datetime(),
})

export type SalesEquipmentCategory = z.infer<typeof salesEquipmentCategorySchema>
export type EquipmentSpecificationGroup = z.infer<typeof equipmentSpecificationGroupSchema>
export type SalesEquipmentInput = z.infer<typeof salesEquipmentInputSchema>
export type SalesEquipmentListQuery = z.infer<typeof salesEquipmentListQuerySchema>
export type SalesEquipmentResponse = z.infer<typeof salesEquipmentResponseSchema>
export type SalesEquipmentRevisionSummary = z.infer<typeof salesEquipmentRevisionSummarySchema>
