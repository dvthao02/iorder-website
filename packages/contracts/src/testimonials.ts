import { z } from 'zod'

import { contentIdSchema } from './content.js'

export const testimonialInputSchema = z.object({
  authorName: z.string().trim().min(1).max(180),
  authorRole: z.string().trim().max(180).nullable().default(null),
  company: z.string().trim().max(180).nullable().default(null),
  quote: z.string().trim().min(1).max(2000),
  rating: z.coerce.number().int().min(1).max(5).nullable().default(null),
  avatarMediaId: contentIdSchema.nullable().default(null),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
  isEnabled: z.boolean().default(true),
})

export const testimonialResponseSchema = z.object({
  id: contentIdSchema,
  authorName: z.string(),
  authorRole: z.string().nullable(),
  company: z.string().nullable(),
  quote: z.string(),
  rating: z.number().nullable(),
  avatarMediaId: contentIdSchema.nullable(),
  avatarUrl: z.string().url().nullable(),
  sortOrder: z.number(),
  isEnabled: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export type TestimonialInput = z.infer<typeof testimonialInputSchema>
export type TestimonialResponse = z.infer<typeof testimonialResponseSchema>
