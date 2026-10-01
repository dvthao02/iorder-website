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

-- Dữ liệu khởi tạo cho catalog Thiết bị bán hàng. Ảnh bìa được để trống để
-- biên tập viên chọn từ Media Library sau khi upload ảnh sản phẩm thật.
INSERT INTO sales_equipment (
  category, name, slug, model_code, price_vnd, warranty_months, summary,
  specification_groups, status, sort_order, is_featured, published_at
)
SELECT
  seed.category::sales_equipment_category,
  seed.name,
  seed.slug,
  seed.model_code,
  seed.price_vnd,
  seed.warranty_months,
  seed.summary,
  seed.specification_groups::jsonb,
  'published'::content_status,
  seed.sort_order,
  seed.is_featured,
  now()
FROM (
  VALUES
    ('pos', 'Máy POS iOrder IOD86', 'may-pos-iod86', 'IOD86', 6990000::bigint, 12, 'Máy POS để bàn, phù hợp cửa hàng và chuỗi bán lẻ.', '[{"title":"Màn hình","items":["Màn hình chính 15.6 inch", "Màn hình phụ hiển thị QR"]},{"title":"Hiệu năng","items":["CPU RK3568", "RAM 4GB, bộ nhớ 64GB"]},{"title":"Kết nối","items":["Wi‑Fi, Bluetooth, Ethernet", "2 USB Type A, USB Type C"]}]', 0, true),
    ('pos', 'Máy POS iOrder Mini', 'may-pos-iorder-mini', 'POS-MINI', 5890000::bigint, 12, 'Thiết bị POS nhỏ gọn cho quầy thanh toán cần tối ưu diện tích.', '[{"title":"Màn hình","items":["Màn hình cảm ứng 10.1 inch", "Độ phân giải HD"]},{"title":"Hiệu năng","items":["Android 13", "RAM 4GB, bộ nhớ 32GB"]}]', 1, true),
    ('printer', 'Máy in hóa đơn iOrder TP80', 'may-in-hoa-don-tp80', 'TP80', 2690000::bigint, 12, 'Máy in nhiệt khổ 80mm, kết nối nhanh cho quầy bán hàng.', '[{"title":"In ấn","items":["Khổ giấy 80mm", "Tốc độ in lên đến 250mm/s"]},{"title":"Kết nối","items":["USB, LAN", "Tương thích iOrder POS"]}]', 2, false),
    ('scanner', 'Máy quét mã vạch iOrder ScanPro', 'may-quet-ma-vach-scanpro', 'SCAN-PRO', 1290000::bigint, 12, 'Máy quét 1D/2D cho thanh toán và kiểm kho nhanh.', '[{"title":"Quét mã","items":["Hỗ trợ mã vạch 1D/2D", "Đọc mã trên màn hình điện thoại"]},{"title":"Kết nối","items":["USB Plug and Play", "Thiết kế cầm tay bền bỉ"]}]', 3, false),
    ('cash_drawer', 'Két đựng tiền iOrder CD410', 'ket-dung-tien-cd410', 'CD410', 990000::bigint, 12, 'Két tiền chắc chắn cho quầy thu ngân, kết nối trực tiếp với máy in hóa đơn.', '[{"title":"Kích thước","items":["410 × 415 × 100mm", "5 ngăn tiền giấy, 8 ngăn tiền xu"]},{"title":"Kết nối","items":["Cổng RJ11", "Tương thích máy in hóa đơn"]}]', 4, false)
) AS seed(category, name, slug, model_code, price_vnd, warranty_months, summary, specification_groups, sort_order, is_featured)
WHERE NOT EXISTS (
  SELECT 1 FROM sales_equipment WHERE sales_equipment.slug = seed.slug AND sales_equipment.deleted_at IS NULL
);
