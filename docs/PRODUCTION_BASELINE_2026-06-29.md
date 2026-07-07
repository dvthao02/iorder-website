# Production Baseline - 2026-06-29

Tài liệu này ghi lại các thay đổi đã thực hiện để đưa repo `webiorder` từ cấu trúc phát triển sang production baseline.

## Mục Tiêu

- Tách rõ public website, CMS nội bộ, API, database và shared contracts.
- Không deploy dựa vào build artifact đã commit sẵn.
- Có CI/CD, staging, production gate, observability, backup/restore và runbook.
- Giữ phạm vi CMS là công cụ quản trị nội dung website nội bộ, không mở rộng sang CRM/POS/public-user system.

## 1. Cấu Trúc Repo

Đã chuyển public website khỏi root vào `frontend/web`.

```text
frontend/web       Public website React/Vite
frontend/admin     Internal CMS React/Vite/TypeScript
backend/api        Fastify API
backend/contracts  Shared Zod schemas/types
backend/database   Drizzle schema, migration, seed, backup/restore
```

Các thay đổi chính:

- Root `package.json` đổi thành workspace orchestrator `@iorder/workspace`.
- Thêm `frontend/web/package.json`.
- Root không còn giữ `src/`, `public/`, `dist/`, `scripts/` của web.
- API static serving đổi sang `frontend/web/dist` và `frontend/admin/dist`.
- CMS import scripts đổi path asset/static data sang `frontend/web/src`.
- `frontend/web/dist/`, `frontend/admin/dist/`, `backups/` được ignore.

## 2. Production Build Gate

Đã thêm các script production:

```bash
pnpm build:production
pnpm verify
pnpm test:api
```

`pnpm verify` chạy:

- `pnpm lint`
- `pnpm typecheck:cms`
- `pnpm build:production`
- `pnpm test:api`

`build:production` build đủ:

- `backend/contracts`
- `backend/database`
- `backend/api`
- `frontend/web`
- `frontend/admin`

## 3. CI/CD

Đã thêm:

```text
.github/workflows/ci.yml
.github/workflows/deploy.yml
```

CI:

- Chạy trên Ubuntu.
- Có PostgreSQL service.
- Chạy `pnpm install --frozen-lockfile`.
- Chạy `pnpm db:migrate`.
- Chạy `pnpm db:seed`.
- Chạy `pnpm verify`.

Deploy:

- Staging deploy trước.
- Production deploy sau staging.
- Dùng GitHub Environments: `staging`, `production`.
- Dùng Railway CLI container.

GitHub cần cấu hình:

```text
Secrets:
RAILWAY_STAGING_TOKEN
RAILWAY_PRODUCTION_TOKEN

Variables:
RAILWAY_SERVICE_ID
```

Production environment nên bật manual approval và giới hạn branch `main`.

## 4. Deploy Build From Source

Đã đổi deploy từ "commit dist sẵn" sang "build từ source".

Các file liên quan:

```text
railway.json
nixpacks.toml
deploy/Dockerfile
deploy/docker-compose.yml
deploy/.env.production.example
```

Railway/Nixpacks hiện dùng:

```bash
pnpm build:production
```

Dockerfile cũng build bằng:

```bash
pnpm build:production
```

## 5. Observability

Đã thêm Sentry optional-by-env cho:

- `backend/api`
- `frontend/web`
- `frontend/admin`

Các file chính:

```text
backend/api/src/observability/sentry.ts
frontend/web/src/observability/sentry.jsx
frontend/admin/src/observability/sentry.tsx
frontend/web/vite.config.js
frontend/admin/vite.config.ts
```

API:

- Thêm `x-request-id`.
- Log request id theo Fastify request id.
- Sentry Fastify error handler bật khi có `SENTRY_DSN`.
- Cookie/authorization headers bị loại khỏi event trước khi gửi Sentry.

Frontend/admin:

- Có ErrorBoundary.
- Sentry browser tracing bật khi có `VITE_SENTRY_DSN`.
- Sourcemap upload chỉ bật khi có `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`.

Env mới trong `.env.example`:

```text
SENTRY_DSN
SENTRY_ENVIRONMENT
SENTRY_RELEASE
SENTRY_TRACES_SAMPLE_RATE
VITE_SENTRY_DSN
VITE_SENTRY_ENVIRONMENT
VITE_SENTRY_RELEASE
VITE_SENTRY_TRACES_SAMPLE_RATE
SENTRY_AUTH_TOKEN
SENTRY_ORG
SENTRY_PROJECT
```

## 6. Database Backup/Restore

Đã thêm:

```bash
pnpm db:backup
pnpm db:restore
```

Các file chính:

```text
backend/database/src/backup.ts
backend/database/src/restore.ts
docs/PRODUCTION_RUNBOOK.md
```

Backup:

- Dùng `pg_dump --format=custom`.
- Output mặc định vào `backups/`.
- `backups/` đã được ignore.

Restore:

- Dùng `pg_restore`.
- Bắt buộc có `ALLOW_DATABASE_RESTORE=yes`.
- Bắt buộc truyền `BACKUP_FILE` hoặc positional argument.

## 7. Homepage Smoke Test

Đã sửa `backend/api/src/homepage-smoke.ts` theo contract CMS hiện tại:

- `home_hero`
- `home_featured_posts`

Test hiện kiểm tra:

- Draft homepage không public.
- Publish xong public API trả homepage.
- Draft mới không leak qua published snapshot.
- Revision được ghi lại.

## 8. Validation Đã Chạy

Đã chạy thành công:

```powershell
pnpm.cmd verify
pnpm.cmd db:backup
```

Kết quả:

- Lint: pass, còn 3 warning cũ ở public web.
- Typecheck CMS/API/packages: pass.
- Production build web/admin/api/packages: pass.
- API smoke tests: pass.
- DB backup: pass.

Warning còn lại:

- `frontend/web/src/components/Header.jsx`: unused `activeDropdown`.
- `frontend/web/src/pages/Home.jsx`: missing hook dependency `cmsFeaturedPosts`.
- `frontend/web/src/pages/IndustryDetail.jsx`: hook dependency/useMemo warning.
- Vite cảnh báo chunk lớn ở admin và web sau khi thêm Sentry.

## 9. Việc Cần Làm Trước Production Thật

- Stage toàn bộ move từ root sang `frontend/web` cẩn thận để Git nhận rename.
- Không stage build output trong `frontend/web/dist`, `frontend/admin/dist`, `backups`.
- Cấu hình GitHub Environments `staging` và `production`.
- Thêm Railway tokens và service id vào GitHub secrets/vars.
- Cấu hình Sentry DSN, release, auth token, org, project.
- Chạy CI remote trên GitHub sau khi push.
- Smoke staging bằng browser trước khi approve production.
