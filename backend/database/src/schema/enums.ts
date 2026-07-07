import { pgEnum } from 'drizzle-orm/pg-core'

export const userStatusEnum = pgEnum('user_status', ['active', 'disabled'])

export const contentStatusEnum = pgEnum('content_status', ['draft', 'review', 'scheduled', 'published', 'archived'])

export const postTypeEnum = pgEnum('post_type', ['news', 'promotion', 'case_study', 'announcement'])

export const offeringTypeEnum = pgEnum('offering_type', ['software', 'solution', 'service', 'industry'])

export const pageBlockTypeEnum = pgEnum('page_block_type', [
  // homepage blocks (canonical)
  'home_hero',
  'home_stats',
  'home_features',
  'home_industries',
  'home_ecosystem_services',
  'home_process',
  'home_testimonials',
  'home_featured_posts',
  'home_faq',
  'home_cta',
  // legacy / other page block types (kept for DB compatibility)
  'hero',
  'rich_text',
  'image',
  'feature_grid',
  'offering_list',
  'partner_list',
  'article_list',
  'download_list',
  'industry_grid',
  'deployment',
  'ecosystem',
  'cta',
  'faq',
  'contact_info',
])

export const partnerKindEnum = pgEnum('partner_kind', ['partner', 'customer'])

export const linkTypeEnum = pgEnum('link_type', ['internal', 'external', 'email', 'phone', 'download'])
