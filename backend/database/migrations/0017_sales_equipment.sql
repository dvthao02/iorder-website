CREATE TYPE "public"."sales_equipment_category" AS ENUM('pos', 'printer', 'scanner', 'cash_drawer', 'accessory');
--> statement-breakpoint
CREATE TABLE "sales_equipment" (
  "id" uuid PRIMARY KEY DEFAULT public.uuid_v7() NOT NULL,
  "category" "sales_equipment_category" NOT NULL,
  "name" varchar(220) NOT NULL,
  "slug" varchar(180) NOT NULL,
  "model_code" varchar(80),
  "cover_media_id" uuid,
  "price_vnd" bigint NOT NULL,
  "warranty_months" integer DEFAULT 12 NOT NULL,
  "summary" text,
  "specification_groups" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "status" "content_status" DEFAULT 'draft' NOT NULL,
  "draft_version" integer DEFAULT 0 NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "is_featured" boolean DEFAULT false NOT NULL,
  "seo_title" varchar(70),
  "seo_description" varchar(180),
  "canonical_url" text,
  "published_at" timestamp with time zone,
  "deleted_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sales_equipment" ADD CONSTRAINT "sales_equipment_cover_media_id_media_assets_id_fk" FOREIGN KEY ("cover_media_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "sales_equipment_active_slug_unique" ON "sales_equipment" USING btree ("slug") WHERE "sales_equipment"."deleted_at" is null;
--> statement-breakpoint
CREATE INDEX "sales_equipment_category_status_sort_index" ON "sales_equipment" USING btree ("category", "status", "sort_order");
--> statement-breakpoint
CREATE TABLE "sales_equipment_revisions" (
  "id" uuid PRIMARY KEY DEFAULT public.uuid_v7() NOT NULL,
  "sales_equipment_id" uuid NOT NULL,
  "editor_id" uuid,
  "version_number" integer NOT NULL,
  "content_snapshot" jsonb NOT NULL,
  "change_note" varchar(500),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sales_equipment_revisions" ADD CONSTRAINT "sales_equipment_revisions_sales_equipment_id_sales_equipment_id_fk" FOREIGN KEY ("sales_equipment_id") REFERENCES "public"."sales_equipment"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "sales_equipment_revisions" ADD CONSTRAINT "sales_equipment_revisions_editor_id_users_id_fk" FOREIGN KEY ("editor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "sales_equipment_revisions_version_unique" ON "sales_equipment_revisions" USING btree ("sales_equipment_id", "version_number");
