-- UUIDv7 retains the UUID type while making newly-created primary keys roughly
-- time ordered. Existing UUIDv4 values remain valid and are intentionally left
-- unchanged.
--
-- This implementation only relies on gen_random_uuid(), which is already the
-- default generator used by this database. It therefore works on PostgreSQL
-- versions that do not yet provide a native uuidv7() function.
CREATE OR REPLACE FUNCTION public.uuid_v7()
RETURNS uuid
LANGUAGE plpgsql
VOLATILE
AS $$
DECLARE
  unix_ts_ms bigint := floor(extract(epoch FROM clock_timestamp()) * 1000)::bigint;
  bytes bytea := uuid_send(gen_random_uuid());
BEGIN
  bytes := set_byte(bytes, 0, ((unix_ts_ms >> 40) & 255)::integer);
  bytes := set_byte(bytes, 1, ((unix_ts_ms >> 32) & 255)::integer);
  bytes := set_byte(bytes, 2, ((unix_ts_ms >> 24) & 255)::integer);
  bytes := set_byte(bytes, 3, ((unix_ts_ms >> 16) & 255)::integer);
  bytes := set_byte(bytes, 4, ((unix_ts_ms >> 8) & 255)::integer);
  bytes := set_byte(bytes, 5, (unix_ts_ms & 255)::integer);
  -- UUID version: 7; RFC 9562 variant: 10xx.
  bytes := set_byte(bytes, 6, (get_byte(bytes, 6) & 15) | 112);
  bytes := set_byte(bytes, 8, (get_byte(bytes, 8) & 63) | 128);
  RETURN encode(bytes, 'hex')::uuid;
END;
$$;
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "id" SET DEFAULT public.uuid_v7();
--> statement-breakpoint
ALTER TABLE "roles" ALTER COLUMN "id" SET DEFAULT public.uuid_v7();
--> statement-breakpoint
ALTER TABLE "sessions" ALTER COLUMN "id" SET DEFAULT public.uuid_v7();
--> statement-breakpoint
ALTER TABLE "content_pages" ALTER COLUMN "id" SET DEFAULT public.uuid_v7();
--> statement-breakpoint
ALTER TABLE "posts" ALTER COLUMN "id" SET DEFAULT public.uuid_v7();
--> statement-breakpoint
ALTER TABLE "post_revisions" ALTER COLUMN "id" SET DEFAULT public.uuid_v7();
--> statement-breakpoint
ALTER TABLE "categories" ALTER COLUMN "id" SET DEFAULT public.uuid_v7();
--> statement-breakpoint
ALTER TABLE "tags" ALTER COLUMN "id" SET DEFAULT public.uuid_v7();
--> statement-breakpoint
ALTER TABLE "offerings" ALTER COLUMN "id" SET DEFAULT public.uuid_v7();
--> statement-breakpoint
ALTER TABLE "offering_revisions" ALTER COLUMN "id" SET DEFAULT public.uuid_v7();
--> statement-breakpoint
ALTER TABLE "partners" ALTER COLUMN "id" SET DEFAULT public.uuid_v7();
--> statement-breakpoint
ALTER TABLE "media_assets" ALTER COLUMN "id" SET DEFAULT public.uuid_v7();
--> statement-breakpoint
ALTER TABLE "menus" ALTER COLUMN "id" SET DEFAULT public.uuid_v7();
--> statement-breakpoint
ALTER TABLE "menu_items" ALTER COLUMN "id" SET DEFAULT public.uuid_v7();
--> statement-breakpoint
ALTER TABLE "link_groups" ALTER COLUMN "id" SET DEFAULT public.uuid_v7();
--> statement-breakpoint
ALTER TABLE "content_links" ALTER COLUMN "id" SET DEFAULT public.uuid_v7();
--> statement-breakpoint
ALTER TABLE "testimonials" ALTER COLUMN "id" SET DEFAULT public.uuid_v7();
--> statement-breakpoint
ALTER TABLE "pages" ALTER COLUMN "id" SET DEFAULT public.uuid_v7();
--> statement-breakpoint
ALTER TABLE "page_blocks" ALTER COLUMN "id" SET DEFAULT public.uuid_v7();
--> statement-breakpoint
ALTER TABLE "page_revisions" ALTER COLUMN "id" SET DEFAULT public.uuid_v7();
--> statement-breakpoint
ALTER TABLE "contact_leads" ALTER COLUMN "id" SET DEFAULT public.uuid_v7();
--> statement-breakpoint
ALTER TABLE "support_downloads" ALTER COLUMN "id" SET DEFAULT public.uuid_v7();
--> statement-breakpoint
ALTER TABLE "site_profile" ALTER COLUMN "id" SET DEFAULT public.uuid_v7();
--> statement-breakpoint
ALTER TABLE "site_settings" ALTER COLUMN "id" SET DEFAULT public.uuid_v7();
--> statement-breakpoint
ALTER TABLE "redirects" ALTER COLUMN "id" SET DEFAULT public.uuid_v7();
--> statement-breakpoint
ALTER TABLE "audit_logs" ALTER COLUMN "id" SET DEFAULT public.uuid_v7();
