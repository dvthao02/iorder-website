# Phase 1 Plan — Normalize Domain Contracts

Cập nhật: 2026-07-06. Căn cứ: `docs/BUSINESS_REBUILD_BLUEPRINT.md` §9 Phase 1, đã re-verify với code hiện tại (không dựa CODEX_REVIEW.md — tài liệu đó mô tả trạng thái trước khi các module navigation/settings/offerings/leads/content-pages/users/activity tồn tại).

Nguyên tắc thi công: mỗi lát theo thứ tự contracts → database → api → admin → web; mỗi lát kết thúc bằng check nêu rõ ở cuối lát; không đụng file ngoài phạm vi lát; worktree đang bẩn — không revert/stage file không liên quan.

---

## Hiện trạng đã verify (2026-07-06)

| Hạng mục         | Thực tế trong code                                                                                                                                                                                                                                                                          |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Status DB        | `content_status` enum = `draft, review, scheduled, published, archived`. `posts`/`offerings`/`pages` dùng enum này. `content_pages.status` = varchar(20) tự do.                                                                                                                             |
| Status contracts | `content.ts` có đủ 5; `posts.ts` và `offerings.ts` tự khai lại `['draft','published','archived']` (2 bản lặp); `content-pages.ts` chỉ `['draft','published']`. `review` không được dùng ở bất kỳ đâu; `scheduled` không dùng làm status (hẹn giờ chạy bằng `scheduledAt` + status `draft`). |
| Industry         | Web ĐÃ fetch `fetchOffering('industry', slug)` ở `IndustryDetail.jsx` (CMS-ready), fallback `industrySolutions.js`. Admin `OfferingsManager.tsx` đã định nghĩa type `industry` (label/màu/route) nhưng `MANAGED_TYPES` chủ động lọc bỏ — chỉ thiếu lối vào.                                 |
| Permissions      | Guard hiện tại: content modules `['admin','editor']`; settings/navigation/users/activity `['admin']`; `author` tồn tại trong enum nhưng không có quyền nào. Guard là route-level, chưa phân biệt hành động (editor được cả delete).                                                         |
| Redirects        | Bảng `redirects` (sourcePath, destinationPath, statusCode, isEnabled) có schema + index, KHÔNG có contracts/routes/admin UI/web tiêu thụ. Redirect thực tế đang hardcode 2 nơi: object `aliases` trong `StaticPage.jsx` và route `/faq → /ho-tro/faq` client-side trong `App.jsx`.          |

---

## Quyết định 1 — Chuẩn hóa status model

**Quyết định đề xuất:**

- DB giữ nguyên enum 5 giá trị (superset, không cần migration phá hủy). `review` và `scheduled` ghi nhận là **reserved, chưa dùng** — service không được set 2 giá trị này cho đến khi có use case duyệt bài/scheduling-by-status.
- Contracts: tạo **một** schema dùng chung trong `content.ts`:
  `managedContentStatusSchema = z.enum(['draft','published','archived'])` — là tập status mà workflow hiện tại thực sự vận hành.
- `posts.ts`, `offerings.ts` đổi sang import schema chung (xóa 2 bản khai lặp). Không đổi hành vi.
- `content_pages`: migration đổi cột `status` varchar → `content_status` enum (dữ liệu hiện chỉ có 'draft'/'published' nên cast an toàn); contracts của content-pages nâng lên `managedContentStatusSchema` (thêm được `archived` — đồng bộ vòng đời với các module khác, admin UI thêm nút Lưu trữ ở lát sau).
- Quy ước chuyển trạng thái duy nhất cho mọi module publishable: `draft → published → (draft | archived)`, hẹn giờ = `scheduledAt` trên bản `draft`.

**Lát thi công:**

1. Lát 1a: contracts — thêm `managedContentStatusSchema`, refactor posts/offerings/content-pages import chung. Check: `pnpm --filter @iorder/contracts typecheck && build`, `pnpm test:unit:api`.
2. Lát 1b: migration `content_pages.status` → enum (`USING status::content_status`), cập nhật schema Drizzle. Check: `db:generate` diff đúng 1 thay đổi, `db:migrate` trên DB dev, smoke content-pages.
3. Lát 1c: content-pages service/admin thêm `archived` (archive/unarchive + badge). Check: unit test service, `pnpm verify`.

**Rủi ro:** dữ liệu content_pages có giá trị status lạ ngoài draft/published → migration cần bước kiểm tra trước khi cast (SELECT DISTINCT status).

---

## Quyết định 2 — Ranh giới `pages` vs `content_pages`

**Quyết định đề xuất: GIỮ CẢ HAI, không merge trong Phase 1**, với ranh giới thành văn:

|              | `pages` + `page_blocks` + `page_revisions`                                                                          | `content_pages`                                              |
| ------------ | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Dùng cho     | Trang dựng từ block có cấu trúc, cần revision/preview/autosave (hiện: homepage; tương lai: landing page chiến dịch) | Trang rich-text đơn giản: FAQ, chính sách, hướng dẫn, hỗ trợ |
| Nội dung     | JSON block validate bằng contracts                                                                                  | 1 body HTML từ Tiptap                                        |
| Vòng đời     | draft/checkpoint/publish/revision/restore                                                                           | draft/publish/archive (không revision)                       |
| Quy tắc chọn | Cần layout/section/appearance → pages                                                                               | Chỉ cần tiêu đề + đoạn văn → content_pages                   |

- Ghi ranh giới này vào `CMS_USE_CASES.md` §5 (thay câu "cần chuẩn hóa").
- Điều kiện tái xét (Phase 3+): nếu xuất hiện nhu cầu content_pages có revision hoặc block, thời điểm đó merge vào `pages` thay vì đắp thêm.

**Lát thi công:** chỉ cập nhật tài liệu (1 lát docs, không code). Check: không cần test.

---

## Quyết định 3 — Offering type `industry` cần admin screen: CÓ

Căn cứ: trang public `/nganh-hang/:slug` ĐÃ ưu tiên đọc CMS (`fetchOffering('industry', ...)`) — nghĩa là ngay bây giờ đã có đường dữ liệu công khai mà admin không có cách nào tạo/sửa nội dung cho nó. Đây là "bảng điều khiển thiếu nút" chứ không phải tính năng mới.

**Lát thi công:**

1. Lát 3a: admin — bỏ lọc `industry` khỏi `MANAGED_TYPES` trong `OfferingsManager.tsx`, thêm sidebar item `{ key: 'industries', slug: 'nganh-hang', label: 'Ngành hàng', icon: Factory, group: 'site' }` (sau Dịch vụ). Không cần thay đổi contracts/API — offerings đã hỗ trợ type industry đầy đủ. Check: `pnpm verify`; test tay tạo + publish 1 industry → `/nganh-hang/<slug>` render nguồn CMS.
2. Lát 3b (tách riêng, có thể lùi sang Phase 4): seed script migrate dữ liệu `industrySolutions.js` (126 dòng) vào offerings type industry, idempotent theo slug. Check: chạy seed, so khớp field-by-field 1 ngành với bản tĩnh (parity), giữ fallback tĩnh.

**Rủi ro:** shape `content` JSON của offering industry phải khớp những gì `IndustryDetail.jsx` đọc — lát 3b phải map cẩn thận, có checklist field.

---

## Quyết định 4 — Permission matrix admin/editor/author

**Ma trận đề xuất (chuẩn business, code hoá dần):**

| Module / hành động                                                 | author | editor | admin |
| ------------------------------------------------------------------ | ------ | ------ | ----- |
| Posts, Offerings, Content pages: create/update draft               | ✅     | ✅     | ✅    |
| Posts, Offerings, Content pages: publish/unpublish/archive/restore | ❌     | ✅     | ✅    |
| Posts, Offerings, Content pages: delete                            | ❌     | ✅     | ✅    |
| Homepage (pages): edit draft/checkpoint                            | ❌     | ✅     | ✅    |
| Homepage: publish                                                  | ❌     | ✅     | ✅    |
| Media: upload/update                                               | ✅     | ✅     | ✅    |
| Media: delete                                                      | ❌     | ✅     | ✅    |
| Partners, Testimonials, Downloads, Categories                      | ❌     | ✅     | ✅    |
| Leads: xem + đổi trạng thái                                        | ❌     | ✅     | ✅    |
| Navigation, Settings, Redirects                                    | ❌     | ❌     | ✅    |
| Users, Activity                                                    | ❌     | ❌     | ✅    |

- `author` = vai "cộng tác viên viết bài": chỉ soạn nháp + upload media, không đụng nút publish. Nếu business chưa cần vai này, ma trận vẫn đứng — chỉ là chưa cấp user author nào.
- Kỹ thuật: guard hiện tại là route-level → đủ cho hàng Navigation/Settings/Users; các hàng phân biệt **hành động** (draft vs publish vs delete) cần guard theo route con (publish/delete routes nhận mảng role hẹp hơn). Không cần bảng permission trong DB — 3 role cố định, hardcode ma trận trong 1 file `backend/api/src/auth/permissions.ts` làm nguồn duy nhất, guard đọc từ đó.

**Lát thi công:**

1. Lát 4a: docs — chốt ma trận vào `CMS_USE_CASES.md` §1. Check: review.
2. Lát 4b (Phase 2 theo blueprint, ghi ở đây để nối mạch): tạo `permissions.ts` + áp guard hẹp cho các route publish/delete; unit test 403 cho author. Check: `pnpm test:unit:api` + E2E login từng role.

Phase 1 chỉ làm 4a (quyết định), 4b thuộc Phase 2 "role-aware guards" đúng như blueprint.

---

## Quyết định 5 — Redirects: CÓ cần contracts/API/admin UI

Căn cứ: nhu cầu đã phát sinh thật — 2 redirect đang hardcode (aliases trong `StaticPage.jsx`, `/faq` trong `App.jsx`), và Phase 4 (migrate slug hàng loạt) chắc chắn sinh thêm. Bảng DB có sẵn.

**Phạm vi đề xuất:**

- Contracts: `redirects.ts` — `redirectSchema` (sourcePath bắt đầu bằng `/`, destinationPath `/` hoặc URL đầy đủ, statusCode enum 301|302, isEnabled), input + list query. Validate chống vòng lặp đơn giản: source ≠ destination.
- API module `modules/redirects/` đủ chuẩn (repository/service/errors/routes/index + test + audit log): CRUD admin (`['admin']`), public `GET /api/public/redirects` trả danh sách enabled (cache header ngắn).
- Admin UI: KHÔNG thêm mục sidebar — thêm tab "Chuyển hướng" trong trang Cài đặt website (cạnh Người dùng/Hoạt động), bảng source → destination + toggle + statusCode.
- Web (SPA): fetch danh sách redirects 1 lần khi boot (cache module), component route-guard match pathname → `<Navigate replace>`. Ghi chú rõ: redirect SPA là client-side (đủ cho UX + Google xử lý được canonical); redirect HTTP thật ở tầng deploy (nginx/Railway) là việc vận hành, ngoài phạm vi repo — ghi vào PRODUCTION_RUNBOOK khi Phase 5.
- Sau khi chạy: migrate 2 redirect hardcode vào DB (seed), xóa hardcode.

**Lát thi công:**

1. Lát 5a: contracts + module API + test. Check: `pnpm test:unit:api`, structural test tự quét module mới phải pass không cần KNOWN_VIOLATIONS.
2. Lát 5b: admin tab Chuyển hướng. Check: `pnpm verify` + test tay CRUD.
3. Lát 5c: web tiêu thụ + seed 2 redirect cũ + gỡ hardcode. Check: E2E `/faq` vẫn về `/ho-tro/faq`; tắt API → route vẫn render (fallback: không redirect, không vỡ trang).

---

## Thứ tự thi công tổng Phase 1

| #   | Lát                                      | Tầng đụng                 | Check kết lát                |
| --- | ---------------------------------------- | ------------------------- | ---------------------------- |
| 1   | 1a Status contracts chung                | contracts, api (import)   | typecheck + unit api         |
| 2   | 1b Migration content_pages enum          | database                  | db:generate/migrate + smoke  |
| 3   | 1c content-pages archive                 | api, admin                | unit + verify                |
| 4   | 2 Docs ranh giới pages/content_pages     | docs                      | review                       |
| 5   | 3a Industry admin screen                 | admin                     | verify + test tay parity đọc |
| 6   | 4a Docs permission matrix                | docs                      | review                       |
| 7   | 5a Redirects contracts + API             | contracts, db(đã có), api | unit + structural test       |
| 8   | 5b Redirects admin tab                   | admin                     | verify + test tay            |
| 9   | 5c Redirects web + seed + gỡ hardcode    | web, db seed              | E2E redirect                 |
| 10  | Cập nhật CMS_USE_CASES.md + đóng Phase 1 | docs                      | pnpm verify toàn bộ          |

Mỗi lát là 1 commit riêng. Blocker đã biết: sandbox agent không chạy được pnpm/tsc/vitest (node_modules Windows) — mọi check chạy trên máy dev, agent phải khai báo rõ phần chưa chạy được trong báo cáo bàn giao.

## Điểm cần chủ repo phê duyệt trước khi code

1. Chấp nhận `review`/`scheduled` là reserved (không xóa khỏi enum DB)?
2. Đồng ý content_pages có thêm `archived`?
3. Đồng ý KHÔNG merge pages/content_pages trong Phase 1?
4. Duyệt ma trận quyền (đặc biệt: editor được delete? author có cần ngay?)
5. Đồng ý redirects đặt trong tab Cài đặt thay vì mục sidebar riêng?
