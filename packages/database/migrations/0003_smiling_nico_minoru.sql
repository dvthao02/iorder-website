ALTER TABLE "users" ALTER COLUMN "email" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "username" varchar(80);--> statement-breakpoint
UPDATE "users"
SET "username" = CASE
  WHEN "email" = 'admin@iorder.local' THEN 'admin'
  ELSE left(coalesce(nullif(split_part("email", '@', 1), ''), 'user'), 60) || '-' || left("id"::text, 8)
END;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "username" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "users_username_unique" ON "users" USING btree ("username");
