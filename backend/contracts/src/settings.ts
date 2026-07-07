import { z } from 'zod'

import { contentIdSchema } from './content.js'

export const siteProfileInputSchema = z.object({
  companyName: z.string().trim().min(1).max(220),
  legalName: z.string().trim().max(220).nullable().default(null),
  hotline: z.string().trim().max(60).nullable().default(null),
  supportEmail: z.string().trim().email().max(320).nullable().default(null),
  salesEmail: z.string().trim().email().max(320).nullable().default(null),
  address: z.string().trim().max(500).nullable().default(null),
  workingHours: z.string().trim().max(255).nullable().default(null),
  logoMediaId: contentIdSchema.nullable().default(null),
})

export const siteProfileResponseSchema = siteProfileInputSchema.extend({
  id: contentIdSchema,
  logoUrl: z.string().url().nullable(),
  updatedAt: z.string().datetime(),
})

export const externalLinksSchema = z.object({
  appLogin: z.string().url().nullable().default(null),
  trial: z.string().url().nullable().default(null),
  facebook: z.string().url().nullable().default(null),
  zalo: z.string().url().nullable().default(null),
  youtube: z.string().url().nullable().default(null),
  appStore: z.string().url().nullable().default(null),
  googlePlay: z.string().url().nullable().default(null),
  addressMap: z.string().url().nullable().default(null),
})

export const publicSettingsResponseSchema = z.object({
  profile: siteProfileResponseSchema,
  externalLinks: externalLinksSchema,
})

export type SiteProfileInput = z.infer<typeof siteProfileInputSchema>
export type SiteProfileResponse = z.infer<typeof siteProfileResponseSchema>
export type ExternalLinks = z.infer<typeof externalLinksSchema>
export type PublicSettingsResponse = z.infer<typeof publicSettingsResponseSchema>
