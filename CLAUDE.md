# webiorder — Project Context

## Architecture

Monorepo (pnpm workspaces):

```
apps/
  web/     — Public frontend (React 19 + Vite, port 5173)
  admin/   — Admin panel (React 19 + Vite, port 5174)
  api/     — REST API (Fastify 5 + TypeScript, port 3000)
packages/
  contracts/  — Shared Zod schemas & TypeScript types
  database/   — Drizzle ORM client + migrations
```

## Stack

| Layer      | Tech                                                       |
| ---------- | ---------------------------------------------------------- |
| Frontend   | React 19, React Router 7, lucide-react, Tiptap (rich text) |
| Backend    | Fastify 5, TypeScript (ESM), tsx                           |
| Database   | Drizzle ORM (PostgreSQL)                                   |
| Validation | Zod 4                                                      |
| Build      | Vite 8, pnpm workspaces                                    |
| Monitoring | Sentry (both frontend & backend)                           |

## Running the project

```bash
# API (port 3000)
pnpm --filter @iorder/api dev

# Admin (port 5174)
pnpm --filter @iorder/admin dev

# Web (port 5173)
pnpm --filter @iorder/web dev
```

## Module standard (bắt buộc cho mọi domain)

Một module trong `apps/api/src/modules/<name>/` đạt chuẩn khi có đủ:

- [ ] Schema trong `packages/contracts` trước khi viết API/UI (contracts-first)
- [ ] `repository / service / errors / routes / index` theo backend module pattern
- [ ] Audit log (`insertAuditLog`) cho MỌI mutation (create/update/delete/publish/…)
- [ ] Vòng đời nội dung: draft → publish → unpublish → archive (module nội dung)
- [ ] Revision + restore (nội dung do editor soạn: posts, homepage, offerings)
- [ ] Unit test service với repository mock (`*.service.test.ts` cạnh source)
- [ ] Lỗi trả về đúng 1 format qua `sendError` chung ở `shared/errors`: `{ error: CODE, details? }`
- [ ] Admin UI dùng `ContentEditorPage` + `toast`; TUYỆT ĐỐI không dùng `confirm()`

Quy tắc "chạm đâu nâng đó": khi sửa một module chưa đạt chuẩn vì lý do tính năng,
phải nâng nó đạt checklist trước khi thêm tính năng mới.

Nội dung chỉ sống trong CMS. Data tĩnh ở web chỉ được là fallback tạm,
đánh dấu `// REMOVE-BY: <mốc>` và có kế hoạch xóa.

## Key patterns

- **Contracts first**: All API shapes live in `packages/contracts/src/`. Add a Zod schema there before touching API or frontend.
- **No barrel files for routes**: each Fastify route file registers itself and imports from `@iorder/contracts` + `@iorder/database`.
- **Admin uses toast for feedback**: import from `./toast`, call `toast.success()` / `toast.error()` / `toast.warning()`.
- **All admin forms**: use inline save (no separate save page), show loading state on submit button.
- **Delete/archive**: always show `toast.warning()` with an undo-style message, not a blocking confirm dialog.

## Current feature state

- Auth: session-cookie login, admin-only routes
- Content: Posts, Offerings, Homepage, Navigation, Partners, Testimonials, Site Profile
- Media: upload, library browser, cover image picker
- Admin: all managers implemented with inline rich-text editor (Tiptap)

## Workspace imports

Always use workspace aliases:

```ts
import { XSchema } from '@iorder/contracts'
import { db } from '@iorder/database'
```

## Backend module pattern (apps/api/src/modules/&lt;name&gt;/)

Each domain (homepage, posts, offerings, media, partners, testimonials, navigation, categories, settings) is a self-contained module:

```
modules/<name>/
  <name>.repository.ts   — Drizzle queries only; exports the serializer(s) for that entity
  <name>.service.ts      — business logic, validation, throws domain errors, emits hook events
  <name>.errors.ts        — ApplicationError subclasses specific to this domain
  <name>.hooks.ts          — event name constants + registerXHooks(hooks) (only if the domain emits events)
  <name>-routes.ts         — thin Fastify adapter: parse input, call service, map errors to HTTP codes
  index.ts                 — re-exports the above
```

- Shared infra lives in `apps/api/src/shared/`: `ApplicationError` (+ subclasses) in `shared/errors/`, `HookManager` in `shared/hooks/`.
- Routes never touch Drizzle directly — always through the module's Service → Repository.
- Only add a `.hooks.ts` file when something in the system needs to react to that domain's events (cache invalidation, notifications). Plain CRUD modules with no subscribers don't need one.
