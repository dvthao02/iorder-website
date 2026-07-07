CREATE TABLE "support_downloads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"file_media_id" uuid,
	"icon" varchar(60) NOT NULL,
	"title" varchar(220) NOT NULL,
	"description" text,
	"meta" varchar(160),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "support_downloads" ADD CONSTRAINT "support_downloads_file_media_id_media_assets_id_fk" FOREIGN KEY ("file_media_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "support_downloads_enabled_sort_index" ON "support_downloads" USING btree ("is_enabled","sort_order");