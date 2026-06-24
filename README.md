# iOrder — Website & CMS

Monorepo gồm **website công khai** (React + Vite), **CMS quản trị nội dung** (React) và **API** (Fastify + PostgreSQL). CMS độc lập hoàn toàn với hệ thống POS.

## Cấu trúc

```text
./                Website công khai (trang người dùng)
apps/admin        CMS quản trị nội dung
apps/api          API (Fastify)
packages/database Schema + migration (Drizzle ORM)
packages/contracts Kiểu dữ liệu dùng chung (Zod)
```

## Yêu cầu

- **Node.js 22+**
- **pnpm 9** (`corepack enable`)
- **PostgreSQL** đang chạy (mặc định cổng 5432)

## 1. Cài đặt

```powershell
pnpm install
```

## 2. Cấu hình môi trường

Copy `.env.example` → `.env` rồi điền kết nối PostgreSQL và các biến CMS:

```ini
DATABASE_URL=postgresql://admin_iorder:123@127.0.0.1:5432/iorderCMS
API_PORT=4000
SESSION_SECRET=chuoi-bi-mat-toi-thieu-32-ky-tu
CMS_ADMIN_USERNAME=admin
CMS_ADMIN_PASSWORD=123
CMS_ADMIN_NAME=Administrator
```

## 3. Chuẩn bị database (lần đầu)

```powershell
pnpm db:migrate          # tạo bảng
pnpm cms:create-admin    # tạo tài khoản admin từ biến CMS_ADMIN_* trong .env
```

## 4. Chạy local — chạy cả 3 cùng lúc

```powershell
pnpm dev:all
```

Lệnh này khởi động đồng thời **web (5173)** + **api (4000)** + **admin (5174)**. Nhờ proxy, truy cập tất cả qua **một cổng 5173** giống production:

| URL | Phục vụ |
|-----|---------|
| http://127.0.0.1:5173/ | Website (trang người dùng) |
| http://127.0.0.1:5173/admin | CMS quản trị |
| http://127.0.0.1:5173/api | API |

> Đăng nhập CMS bằng `CMS_ADMIN_USERNAME` / `CMS_ADMIN_PASSWORD` đã đặt ở `.env`.

### Chạy riêng từng phần (nếu cần)

```powershell
pnpm dev          # chỉ website   → http://127.0.0.1:5173
pnpm dev:api      # chỉ API        → http://127.0.0.1:4000
pnpm dev:admin    # chỉ admin       → http://127.0.0.1:5174/admin
```

## 5. Build production

```powershell
pnpm build        # build website  → dist/
pnpm build:cms    # build contracts + database + api + admin
# hoặc gộp:
pnpm build:all
```

## Lệnh hữu ích

```powershell
pnpm lint                 # kiểm tra code website (src/)
pnpm cms:create-admin     # tạo / đổi mật khẩu admin (theo .env)
pnpm cms:import-homepage  # nhập nội dung trang chủ vào CMS
pnpm cms:import-posts     # nhập bài viết
pnpm cms:import-offerings # nhập phần mềm/giải pháp/dịch vụ
pnpm db:generate          # sinh migration từ thay đổi schema
pnpm db:migrate           # áp dụng migration
pnpm typecheck:cms        # type-check toàn bộ package CMS
```

## Deploy

- **Railway** (đang dùng): cấu hình ở `railway.json` + `nixpacks.toml` tại gốc. Frontend `dist/` được build sẵn và commit; Railway chỉ build API.
- **Docker / VPS** (tùy chọn): các file trong `deploy/` (`Dockerfile`, `docker-compose.yml`, `.env.production.example`).
  ```bash
  cp deploy/.env.production.example deploy/.env.production   # điền giá trị thật
  docker compose -f deploy/docker-compose.yml --env-file deploy/.env.production up -d
  ```

## Tài khoản & ghi chú

- Ảnh upload lưu ở `storage/media/` (không commit vào git).
- Ảnh chia sẻ mạng xã hội: `public/og-image.png`; favicon: `public/favicon.png`.
- Tạo lại ảnh OG: xem hướng dẫn trong `scripts/make-og-image.mjs`.
