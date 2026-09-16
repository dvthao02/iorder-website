# iOrder — Website & CMS

Monorepo gồm **website công khai** (React + Vite), **CMS quản trị nội dung** (React) và **API** (Fastify + PostgreSQL). CMS độc lập hoàn toàn với hệ thống POS.

## Cấu trúc

```text
frontend/web       Website công khai (trang người dùng)
frontend/admin     CMS quản trị nội dung
backend/api        API (Fastify)
backend/contracts  API contract dùng chung qua @iorder/contracts (Zod)
backend/database   Schema + migration (Drizzle ORM)
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
pnpm db:migrate               # tạo/cập nhật schema
pnpm bootstrap:core            # tạo roles và tài khoản admin đầu tiên
pnpm content:import:legacy     # tùy chọn: nhập nội dung tĩnh cũ vào CMS một lần
```

## 4. Chạy local — chạy cả 3 cùng lúc

```powershell
pnpm dev:all
```

Lệnh này khởi động đồng thời **web (5173)** + **api (4000)** + **admin (5174)**. Nhờ proxy, truy cập tất cả qua **một cổng 5173** giống production:

| URL                         | Phục vụ                    |
| --------------------------- | -------------------------- |
| http://127.0.0.1:5173/      | Website (trang người dùng) |
| http://127.0.0.1:5173/admin | CMS quản trị               |
| http://127.0.0.1:5173/api   | API                        |

> Đăng nhập CMS bằng `CMS_ADMIN_USERNAME` / `CMS_ADMIN_PASSWORD` đã đặt ở `.env`.

### Chạy riêng từng phần (nếu cần)

```powershell
pnpm dev          # chỉ website   → http://127.0.0.1:5173
pnpm dev:api      # chỉ API        → http://127.0.0.1:4000
pnpm dev:admin    # chỉ admin       → http://127.0.0.1:5174/admin
```

## 5. Build production

```powershell
pnpm build        # build API, website và CMS
pnpm build:cms    # build contracts + database + api + admin
pnpm build:all    # build full production artifacts
pnpm verify       # lint + typecheck + production build + API smoke tests
```

## Lệnh hữu ích

```powershell
pnpm lint                 # kiểm tra code frontend/backend
pnpm cms:create-admin     # tạo / đổi mật khẩu admin (theo .env)
pnpm cms:import-homepage  # nhập nội dung trang chủ vào CMS
pnpm cms:import-posts     # nhập bài viết
pnpm cms:import-offerings # nhập phần mềm/giải pháp/dịch vụ
pnpm bootstrap:core       # setup roles + admin cho môi trường mới
pnpm content:import:legacy # import nội dung legacy, chỉ chạy thủ công một lần
pnpm db:generate          # sinh migration từ thay đổi schema
pnpm db:migrate           # áp dụng migration
pnpm typecheck:cms        # type-check toàn bộ package CMS
pnpm verify               # production gate chạy giống CI
```

## Deploy

- **Railway**: cấu hình ở `railway.json` + `deploy/Dockerfile`. Mỗi deploy chỉ chạy migration; không seed hoặc import nội dung CMS.
- **Docker / VPS** (tùy chọn): các file trong `deploy/` (`Dockerfile`, `docker-compose.yml`, `.env.production.example`).
  Docker build toàn bộ monorepo, chạy PostgreSQL, MinIO, migrate schema và tạo CMS admin khi khởi động lần đầu:
  ```powershell
  Copy-Item deploy/.env.docker.example deploy/.env.docker
  docker compose --env-file deploy/.env.docker -f deploy/docker-compose.yml up --build -d
  ```
  Lệnh này tạo volume local riêng (`iorder_local_*`), không đụng dữ liệu Docker cũ. Muốn dùng lại volume cũ, đặt đúng `POSTGRES_PASSWORD` và `VOLUME_PREFIX` của môi trường đó.
  Mở website tại `http://127.0.0.1:4000`, CMS tại `http://127.0.0.1:4000/admin`, và MinIO Console tại `http://127.0.0.1:9001`. Ảnh mới được lưu trong bucket `iorder-media`, ở volume `iorder_local_minio_data`. Xem log bằng `docker compose --env-file deploy/.env.docker -f deploy/docker-compose.yml logs -f api minio`.
  Chỉ khi cần nhập dữ liệu tĩnh cũ vào CMS mới chạy:
  ```powershell
  docker compose --env-file deploy/.env.docker -f deploy/docker-compose.yml run --rm api pnpm content:import:legacy
  ```
  Để chuyển ảnh đã có trong volume local sang MinIO sau khi đã sao lưu volume:
  ```powershell
  docker compose --env-file deploy/.env.docker -f deploy/docker-compose.yml run --rm api pnpm media:migrate-local
  ```
- Kiến trúc và quy ước: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
- Production runbook: [docs/PRODUCTION_RUNBOOK.md](docs/PRODUCTION_RUNBOOK.md).

## Tài khoản & ghi chú

- Ảnh upload dùng MinIO/S3-compatible khi `MEDIA_STORAGE_DRIVER=minio`; local storage chỉ là chế độ tương thích tạm thời.
- Ảnh chia sẻ mạng xã hội: `frontend/web/public/og-image.png`; favicon: `frontend/web/public/favicon.png`.
- Tạo lại ảnh OG: `pnpm make-og-image`.
