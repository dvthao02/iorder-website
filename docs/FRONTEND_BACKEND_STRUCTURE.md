# Frontend / Backend Structure

Từ 2026-07-07, repo được tách theo ownership ở top-level để tránh xử lý lẫn frontend và backend.

## Layout chuẩn

```text
frontend/
  web/       Public website React/Vite, chạy port 5173
  admin/     Internal CMS React/Vite, chạy port 5174

backend/
  api/        Fastify REST API, chạy port 3000 hoặc API_PORT trong .env
  contracts/  Zod schema và TypeScript type cho API contract
  database/   Drizzle schema, migration, seed, backup/restore
```

## Ranh giới xử lý

- Frontend chỉ chứa UI, routing, client fetch, assets và presentation state.
- Backend chứa API runtime, business rules, database access, migrations, smoke scripts và source-of-truth contract.
- `backend/contracts` là contract API dùng chung qua package `@iorder/contracts`; frontend được import package này nhưng không tự định nghĩa lại schema.
- `backend/database` không được import trực tiếp từ frontend. Chỉ `backend/api` được dùng `@iorder/database`.
- Thay đổi API shape phải đi theo thứ tự: `backend/contracts` -> `backend/api` -> `frontend/admin` hoặc `frontend/web`.

## Package ownership

| Package             | Folder              | Owner                      |
| ------------------- | ------------------- | -------------------------- |
| `@iorder/web`       | `frontend/web`      | Frontend public site       |
| `@iorder/admin`     | `frontend/admin`    | Frontend internal CMS      |
| `@iorder/api`       | `backend/api`       | Backend API                |
| `@iorder/contracts` | `backend/contracts` | Backend-owned API contract |
| `@iorder/database`  | `backend/database`  | Backend database layer     |

## Commands

Các lệnh root vẫn giữ nguyên vì package names không đổi:

```powershell
pnpm dev:web
pnpm dev:admin
pnpm dev:api
pnpm dev:all
pnpm build:production
pnpm verify
```

Khi thêm module CMS mới, không tạo folder song song ngoài layout trên. Backend module đặt dưới `backend/api/src/modules/<name>/`; contract đặt trong `backend/contracts/src/`; UI quản trị đặt trong `frontend/admin/src/`; public read UI đặt trong `frontend/web/src/` nếu cần.
