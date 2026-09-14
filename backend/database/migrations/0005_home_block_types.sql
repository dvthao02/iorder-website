CREATE TYPE "public"."page_block_type_new" AS ENUM('hero', 'rich_text', 'image', 'feature_grid', 'offering_list', 'partner_list', 'article_list', 'download_list', 'cta', 'faq', 'contact_info', 'industry_grid', 'deployment', 'ecosystem', 'home_hero', 'home_stats', 'home_features', 'home_industries', 'home_ecosystem_services', 'home_process', 'home_testimonials', 'home_featured_posts', 'home_faq', 'home_cta');--> statement-breakpoint
ALTER TABLE "public"."page_blocks" ALTER COLUMN "type" TYPE "public"."page_block_type_new" USING "type"::text::"public"."page_block_type_new";--> statement-breakpoint
DROP TYPE "public"."page_block_type";--> statement-breakpoint
ALTER TYPE "public"."page_block_type_new" RENAME TO "page_block_type";
