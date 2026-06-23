-- Run this file only after the Drizzle migrations have been applied to
-- iorderCMS. It is idempotent and can be executed again safely.

DO $$
BEGIN
  IF to_regclass('public.roles') IS NULL THEN
    RAISE EXCEPTION 'CMS schema is missing. Run pnpm.cmd db:migrate before db:seed.';
  END IF;
END
$$;

INSERT INTO roles (code, name)
VALUES
  ('admin', 'Quản trị viên'),
  ('editor', 'Biên tập viên'),
  ('author', 'Tác giả')
ON CONFLICT (code) DO UPDATE
SET
  name = EXCLUDED.name,
  updated_at = now();

INSERT INTO link_groups (code, name)
VALUES
  ('header_actions', 'Nút thao tác trên header'),
  ('footer_support', 'Liên kết hỗ trợ ở footer'),
  ('social_links', 'Mạng xã hội'),
  ('app_links', 'Liên kết ứng dụng iOrder'),
  ('contact_channels', 'Kênh liên hệ')
ON CONFLICT (code) DO UPDATE
SET
  name = EXCLUDED.name,
  updated_at = now();

INSERT INTO site_profile (profile_key, company_name)
VALUES ('default', 'iOrder')
ON CONFLICT (profile_key) DO UPDATE
SET
  company_name = EXCLUDED.company_name,
  updated_at = now();
