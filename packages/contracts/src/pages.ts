import { z } from 'zod'

import { contentIdSchema } from './content.js'
import { mediaAssetSchema } from './media.js'

export const HOMEPAGE_SECTION_ORDER = [
  'home_hero',
  'home_stats',
  'home_industries',
  'home_features',
  'home_testimonials',
  'home_ecosystem_services',
  'home_process',
  'home_featured_posts',
  'home_faq',
  'home_cta',
] as const

export type HomepageSectionType = (typeof HOMEPAGE_SECTION_ORDER)[number]

export const SECTION_BACKGROUND_COLORS = [
  '#ffffff',
  '#f6fbff',
  '#eaf6ff',
  '#0a1628',
  '#0f2236',
] as const

export const DEFAULT_SECTION_APPEARANCE = {
  backgroundMediaId: null,
  mobileBackgroundMediaId: null,
  backgroundColor: null,
  backgroundFit: 'cover',
  focalPointX: 50,
  focalPointY: 50,
  overlay: 'none',
} as const

export const sectionAppearanceSchema = z.object({
  backgroundMediaId: contentIdSchema.nullable().default(null),
  mobileBackgroundMediaId: contentIdSchema.nullable().default(null),
  backgroundColor: z.enum(SECTION_BACKGROUND_COLORS).nullable().default(null),
  backgroundFit: z.enum(['cover', 'contain']).default('cover'),
  focalPointX: z.number().int().min(0).max(100).default(50),
  focalPointY: z.number().int().min(0).max(100).default(50),
  overlay: z.enum(['none', 'light', 'dark-soft', 'dark-medium']).default('none'),
}).default(DEFAULT_SECTION_APPEARANCE)

const optionalText = (max: number) => z.string().trim().max(max).nullable().default(null)
const contentUrlSchema = z.string().trim().min(1).max(1000).refine(
  (value) => value.startsWith('/') || /^(https?:|mailto:|tel:)/.test(value),
  'URL must be an internal path, HTTP URL, email, or phone link',
)

const iconKeySchema = z.enum(['store', 'utensils', 'shield', 'smartphone', 'server', 'headphones', 'check'])
const linkItemSchema = z.object({
  title: z.string().trim().min(1).max(180),
  href: contentUrlSchema,
})

// ─── home_hero ────────────────────────────────────────────────────────────────
const homeHeroBlockSchema = z.object({
  type: z.literal('home_hero'),
  isEnabled: z.boolean().default(true),
  appearance: sectionAppearanceSchema,
  data: z.object({
    eyebrow: optionalText(120),
    title: z.string().trim().min(1).max(220),
    description: z.string().trim().min(1).max(1200),
    imageMediaId: contentIdSchema.nullable().default(null),
    primaryLabel: z.string().trim().min(1).max(80),
    primaryUrl: contentUrlSchema,
    secondaryLabel: optionalText(80),
    secondaryUrl: contentUrlSchema.nullable().default(null),
    points: z.array(z.string().trim().min(1).max(120)).max(8).default([]),
    slides: z.array(z.object({
      title: z.string().trim().min(1).max(220),
      description: z.string().trim().min(1).max(1200),
      imageMediaId: contentIdSchema,
    })).max(6).default([]),
  }),
})

// ─── home_stats ───────────────────────────────────────────────────────────────
const homeStatsBlockSchema = z.object({
  type: z.literal('home_stats'),
  isEnabled: z.boolean().default(true),
  appearance: sectionAppearanceSchema,
  data: z.object({
    stats: z.array(z.object({
      value: z.string().trim().min(1).max(80),
      label: z.string().trim().min(1).max(120),
      note: optionalText(120),
    })).max(8).default([]),
    partnersHeading: optionalText(180),
    partners: z.array(z.object({
      name: z.string().trim().min(1).max(180),
      mediaId: contentIdSchema,
      websiteUrl: z.string().url().nullable().default(null),
    })).max(40).default([]),
  }),
})

// ─── home_features ────────────────────────────────────────────────────────────
const homeFeaturesBlockSchema = z.object({
  type: z.literal('home_features'),
  isEnabled: z.boolean().default(true),
  appearance: sectionAppearanceSchema,
  data: z.object({
    eyebrow: optionalText(120),
    heading: z.string().trim().min(1).max(220),
    intro: optionalText(1200),
    items: z.array(z.object({
      title: z.string().trim().min(1).max(180),
      description: z.string().trim().min(1).max(1000),
      href: contentUrlSchema.nullable().default(null),
    })).min(1).max(12),
  }),
})

// ─── home_industries ──────────────────────────────────────────────────────────
const homeIndustriesBlockSchema = z.object({
  type: z.literal('home_industries'),
  isEnabled: z.boolean().default(true),
  appearance: sectionAppearanceSchema,
  data: z.object({
    eyebrow: optionalText(120),
    heading: z.string().trim().min(1).max(220),
    intro: optionalText(1200),
    groups: z.array(z.object({
      title: z.string().trim().min(1).max(180),
      iconKey: iconKeySchema.default('store'),
      items: z.array(z.object({
        title: z.string().trim().min(1).max(180),
        description: z.string().trim().min(1).max(1000),
        href: contentUrlSchema,
      })).min(1).max(12),
    })).min(1).max(6),
  }),
})

// ─── home_ecosystem_services ──────────────────────────────────────────────────
const homeEcosystemServicesBlockSchema = z.object({
  type: z.literal('home_ecosystem_services'),
  isEnabled: z.boolean().default(true),
  appearance: sectionAppearanceSchema,
  data: z.object({
    eyebrow: optionalText(120),
    heading: z.string().trim().min(1).max(220),
    intro: optionalText(1200),
    groups: z.array(z.object({
      iconKey: iconKeySchema.default('check'),
      label: z.string().trim().min(1).max(120),
      title: z.string().trim().min(1).max(180),
      description: z.string().trim().min(1).max(1200),
      href: contentUrlSchema,
      items: z.array(linkItemSchema).max(20),
    })).min(1).max(8),
  }),
})

// ─── home_process ─────────────────────────────────────────────────────────────
const homeProcessBlockSchema = z.object({
  type: z.literal('home_process'),
  isEnabled: z.boolean().default(true),
  appearance: sectionAppearanceSchema,
  data: z.object({
    eyebrow: optionalText(120),
    heading: z.string().trim().min(1).max(220),
    intro: z.string().trim().min(1).max(1200),
    buttonLabel: z.string().trim().min(1).max(80),
    buttonUrl: contentUrlSchema,
    featureMediaId: contentIdSchema,
    steps: z.array(z.object({
      title: z.string().trim().min(1).max(180),
      description: z.string().trim().min(1).max(1000),
    })).min(1).max(8),
    models: z.array(z.object({
      title: z.string().trim().min(1).max(180),
      description: z.string().trim().min(1).max(1000),
      mediaId: contentIdSchema,
    })).max(6),
  }),
})

// ─── home_testimonials ────────────────────────────────────────────────────────
const homeTestimonialsBlockSchema = z.object({
  type: z.literal('home_testimonials'),
  isEnabled: z.boolean().default(true),
  appearance: sectionAppearanceSchema,
  data: z.object({
    eyebrow: optionalText(120),
    heading: z.string().trim().min(1).max(220),
    items: z.array(z.object({
      quote: z.string().trim().min(1).max(1200),
      name: z.string().trim().min(1).max(180),
      role: optionalText(180),
      company: optionalText(180),
      avatarMediaId: contentIdSchema.nullable().default(null),
    })).max(12).default([]),
  }),
})

// ─── home_featured_posts ──────────────────────────────────────────────────────
const homeFeaturedPostsBlockSchema = z.object({
  type: z.literal('home_featured_posts'),
  isEnabled: z.boolean().default(true),
  appearance: sectionAppearanceSchema,
  data: z.object({
    eyebrow: optionalText(120),
    heading: z.string().trim().min(1).max(220),
    intro: optionalText(1200),
    postType: z.enum(['all', 'news', 'promotion']).default('all'),
    limit: z.number().int().min(1).max(12).default(3),
    allLabel: z.string().trim().min(1).max(80).default('Xem tất cả bài viết'),
    allUrl: contentUrlSchema.default('/tin-tuc'),
  }),
})

// ─── home_faq ─────────────────────────────────────────────────────────────────
const homeFaqBlockSchema = z.object({
  type: z.literal('home_faq'),
  isEnabled: z.boolean().default(true),
  appearance: sectionAppearanceSchema,
  data: z.object({
    eyebrow: optionalText(120),
    heading: z.string().trim().min(1).max(220),
    items: z.array(z.object({
      question: z.string().trim().min(1).max(300),
      answer: z.string().trim().min(1).max(3000),
    })).min(1).max(20),
  }),
})

// ─── home_cta ─────────────────────────────────────────────────────────────────
const homeCtaBlockSchema = z.object({
  type: z.literal('home_cta'),
  isEnabled: z.boolean().default(true),
  appearance: sectionAppearanceSchema,
  data: z.object({
    title: z.string().trim().min(1).max(220),
    description: z.string().trim().min(1).max(1200),
    buttonLabel: z.string().trim().min(1).max(80),
    buttonUrl: contentUrlSchema,
  }),
})

// ─── union + input ─────────────────────────────────────────────────────────────
export const homepageBlockSchema = z.discriminatedUnion('type', [
  homeHeroBlockSchema,
  homeStatsBlockSchema,
  homeFeaturesBlockSchema,
  homeIndustriesBlockSchema,
  homeEcosystemServicesBlockSchema,
  homeProcessBlockSchema,
  homeTestimonialsBlockSchema,
  homeFeaturedPostsBlockSchema,
  homeFaqBlockSchema,
  homeCtaBlockSchema,
])

const homepageInputObjectSchema = z.object({
  title: z.string().trim().min(1).max(220).default('Trang chủ'),
  seoTitle: optionalText(70),
  seoDescription: optionalText(180),
  canonicalUrl: z.string().url().nullable().default(null),
  blocks: z.array(homepageBlockSchema).max(30),
})

export const homepageInputSchema = homepageInputObjectSchema.superRefine((input, context) => {
  const seen = new Set<string>()
  input.blocks.forEach((block, index) => {
    if (seen.has(block.type)) context.addIssue({ code: 'custom', path: ['blocks', index, 'type'], message: 'Each homepage block type can only appear once' })
    seen.add(block.type)
  })
})

export const homepageResponseSchema = homepageInputObjectSchema.extend({
  id: contentIdSchema,
  status: z.enum(['draft', 'published', 'archived']),
  draftVersion: z.number().int().nonnegative(),
  publishedAt: z.string().datetime().nullable(),
  updatedAt: z.string().datetime(),
})

export const homepageAutosaveInputSchema = z.object({
  data: homepageInputSchema,
  baseVersion: z.number().int().nonnegative(),
})

export const homepageVersionInputSchema = z.object({
  baseVersion: z.number().int().nonnegative(),
  changeNote: z.string().trim().max(500).nullable().default(null),
})

export const homepageRevisionSummarySchema = z.object({
  id: contentIdSchema,
  versionNumber: z.number().int().positive(),
  changeNote: z.string().nullable(),
  isPublished: z.boolean(),
  editorName: z.string().nullable(),
  createdAt: z.string().datetime(),
})

export const homepageRevisionDetailSchema = homepageRevisionSummarySchema.extend({
  snapshot: homepageResponseSchema,
})

export const homepagePreviewSessionSchema = z.object({
  token: z.string().min(1),
  previewUrl: z.string().url(),
  expiresAt: z.string().datetime(),
})

export const publicHomepageResponseSchema = z.object({
  item: homepageResponseSchema,
  media: z.array(mediaAssetSchema),
})

export type HomepageBlock = z.infer<typeof homepageBlockSchema>
export type HomepageInput = z.infer<typeof homepageInputSchema>
export type HomepageResponse = z.infer<typeof homepageResponseSchema>
export type HomepageAutosaveInput = z.infer<typeof homepageAutosaveInputSchema>
export type HomepageVersionInput = z.infer<typeof homepageVersionInputSchema>
export type HomepageRevisionSummary = z.infer<typeof homepageRevisionSummarySchema>
export type HomepageRevisionDetail = z.infer<typeof homepageRevisionDetailSchema>
export type HomepagePreviewSession = z.infer<typeof homepagePreviewSessionSchema>
export type SectionAppearance = z.infer<typeof sectionAppearanceSchema>
