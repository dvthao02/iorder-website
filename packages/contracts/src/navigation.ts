import { z } from 'zod'

import { contentIdSchema } from './content.js'

export const menuItemInputSchema = z.object({
  parentId: contentIdSchema.nullable().default(null),
  label: z.string().trim().min(1).max(180),
  url: z.string().trim().min(1).max(1000),
  target: z.enum(['_self', '_blank']).default('_self'),
  icon: z.string().trim().max(120).nullable().default(null),
  sortOrder: z.number().int().min(0).default(0),
  isEnabled: z.boolean().default(true),
})

export const menuItemResponseSchema = z.object({
  id: contentIdSchema,
  menuId: contentIdSchema,
  parentId: contentIdSchema.nullable(),
  label: z.string(),
  url: z.string(),
  target: z.string(),
  icon: z.string().nullable(),
  sortOrder: z.number().int(),
  isEnabled: z.boolean(),
  children: z.array(z.lazy((): z.ZodTypeAny => menuItemResponseSchema)).default([]),
})

export const menuResponseSchema = z.object({
  id: contentIdSchema,
  name: z.string(),
  location: z.string(),
  items: z.array(menuItemResponseSchema),
})

export const contentLinkInputSchema = z.object({
  groupId: contentIdSchema,
  label: z.string().trim().min(1).max(180),
  url: z.string().trim().min(1).max(1000),
  type: z.enum(['internal', 'external', 'email', 'phone', 'download']).default('external'),
  target: z.enum(['_self', '_blank']).default('_self'),
  icon: z.string().trim().max(120).nullable().default(null),
  sortOrder: z.number().int().min(0).default(0),
  isEnabled: z.boolean().default(true),
})

export const contentLinkResponseSchema = z.object({
  id: contentIdSchema,
  groupId: contentIdSchema,
  label: z.string(),
  url: z.string(),
  type: z.string(),
  target: z.string(),
  icon: z.string().nullable(),
  sortOrder: z.number().int(),
  isEnabled: z.boolean(),
})

export const linkGroupResponseSchema = z.object({
  id: contentIdSchema,
  code: z.string(),
  name: z.string(),
  links: z.array(contentLinkResponseSchema),
})

export type MenuItemInput = z.infer<typeof menuItemInputSchema>
export type MenuItemResponse = z.infer<typeof menuItemResponseSchema>
export type MenuResponse = z.infer<typeof menuResponseSchema>
export type ContentLinkInput = z.infer<typeof contentLinkInputSchema>
export type ContentLinkResponse = z.infer<typeof contentLinkResponseSchema>
export type LinkGroupResponse = z.infer<typeof linkGroupResponseSchema>
