UPDATE "public"."page_blocks" SET "type" = 'home_hero'               WHERE "type" = 'hero';--> statement-breakpoint
UPDATE "public"."page_blocks" SET "type" = 'home_features'           WHERE "type" = 'feature_grid';--> statement-breakpoint
UPDATE "public"."page_blocks" SET "type" = 'home_industries'         WHERE "type" = 'industry_grid';--> statement-breakpoint
UPDATE "public"."page_blocks" SET "type" = 'home_process'            WHERE "type" = 'deployment';--> statement-breakpoint
UPDATE "public"."page_blocks" SET "type" = 'home_ecosystem_services' WHERE "type" = 'ecosystem';--> statement-breakpoint
UPDATE "public"."page_blocks" SET "type" = 'home_featured_posts'     WHERE "type" = 'article_list';--> statement-breakpoint
UPDATE "public"."page_blocks" SET "type" = 'home_cta'                WHERE "type" = 'cta';--> statement-breakpoint
DELETE FROM "public"."page_blocks" WHERE "type" IN ('rich_text', 'partner_list');
