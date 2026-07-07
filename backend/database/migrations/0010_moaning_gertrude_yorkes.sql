CREATE TYPE "public"."partner_kind" AS ENUM('partner', 'customer');--> statement-breakpoint
ALTER TABLE "partners" ADD COLUMN "kind" "partner_kind" DEFAULT 'partner' NOT NULL;