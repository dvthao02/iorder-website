CREATE TYPE "public"."lead_status" AS ENUM('new', 'contacted', 'closed');--> statement-breakpoint
CREATE TABLE "contact_leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(180) NOT NULL,
	"phone" varchar(30) NOT NULL,
	"email" varchar(320),
	"business_model" varchar(120),
	"branches" varchar(60),
	"need" varchar(200),
	"message" text,
	"status" "lead_status" DEFAULT 'new' NOT NULL,
	"ip_hash" varchar(128),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"handled_at" timestamp with time zone,
	"handled_by" uuid
);
--> statement-breakpoint
ALTER TABLE "contact_leads" ADD CONSTRAINT "contact_leads_handled_by_users_id_fk" FOREIGN KEY ("handled_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "contact_leads_status_created_index" ON "contact_leads" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "contact_leads_created_index" ON "contact_leads" USING btree ("created_at");