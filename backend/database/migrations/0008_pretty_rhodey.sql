ALTER TABLE "offerings" ADD COLUMN "draft_version" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "pages" ADD COLUMN "draft_version" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "draft_version" integer DEFAULT 0 NOT NULL;