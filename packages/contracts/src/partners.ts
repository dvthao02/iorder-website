import { z } from 'zod'

import { contentIdSchema } from './content.js'

export const partnerKindSchema = z.enum(['partner', 'customer'])

export const partnerInputSchema = z.object({
  name: z.string().trim().min(1).max(180),
  kind: partnerKindSchema.default('partner'),
  description: z.string().trim().max(2000).nullable().default(null),
  websiteUrl: z.string().url().nullable().default(null),
  logoMediaId: contentIdSchema.nullable().default(null),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
  isEnabled: z.boolean().default(true),
})

export const partnerResponseSchema = z.object({
  id: contentIdSchema,
  name: z.string(),
  kind: partnerKindSchema,
  description: z.string().nullable(),
  websiteUrl: z.string().nullable(),
  logoMediaId: contentIdSchema.nullable(),
  logoUrl: z.string().url().nullable(),
  sortOrder: z.number(),
  isEnabled: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export type PartnerKind = z.infer<typeof partnerKindSchema>
export type PartnerInput = z.infer<typeof partnerInputSchema>
export type PartnerResponse = z.infer<typeof partnerResponseSchema>
