# CMS Local Development

## Prerequisites

- Node.js 24 or a compatible supported Node.js release.
- pnpm 9.15.9, matching the root `packageManager` field.
- PostgreSQL running locally or reachable through `DATABASE_URL`.

Docker is not required for this checkout. PostgreSQL 18 is installed and running on the current Windows host, but database credentials are not stored in the repository.

## Initial setup

1. Copy `.env.example` to `.env`.
2. Replace the example PostgreSQL credentials.
3. Set the PostgreSQL login for `psql`, for example `$env:PGUSER = 'admin_iorder'`.
4. Run `pnpm.cmd db:create` and enter the PostgreSQL password when prompted.
5. Run `pnpm.cmd db:migrate`.
6. Run `pnpm.cmd db:seed`.
7. Set `CMS_ADMIN_USERNAME`, `CMS_ADMIN_NAME`, and `CMS_ADMIN_PASSWORD` in the local environment or ignored `.env` file.
8. Run `pnpm.cmd cms:create-admin`.
9. During development, run `pnpm.cmd dev:all`; short API restarts are expected when watched source files change.
10. For stable manual CMS testing, run `pnpm.cmd build:all` once and then `pnpm.cmd serve:all`. This serves compiled builds without file watchers on ports 5173, 4000, and 5174.

## Validation

```powershell
pnpm.cmd build
pnpm.cmd typecheck:cms
pnpm.cmd build:cms
pnpm.cmd --filter @iorder/api test:smoke
pnpm.cmd test:auth
pnpm.cmd test:media
pnpm.cmd test:posts
pnpm.cmd test:homepage
```

## Database workflow

Edit schema files under `packages/database/src/schema`, then generate a migration:

```powershell
pnpm.cmd db:generate
```

Review the generated SQL before applying it. Never edit an already-applied migration; create a new migration instead.

The database creation and seed SQL files are located at:

```text
packages/database/scripts/00-create-database.sql
packages/database/scripts/01-seed-core.sql
packages/database/scripts/02-normalize-ownership.sql
```

## Authentication

- CMS passwords are hashed with Node.js `scrypt` before storage.
- CMS login uses a unique username; email is optional metadata and is not used for authentication.
- Browser sessions use signed, HttpOnly cookies.
- Only the SHA-256 session-token hash is stored in PostgreSQL.
- Login is limited to five attempts per minute per client.
- The `admin_iorder` PostgreSQL role is unrelated to CMS browser accounts.

## Media and documents

- Local files are stored under `storage/media` and served from `/media/`.
- Configure `MEDIA_STORAGE_PATH`, `MEDIA_PUBLIC_BASE_URL`, and `MEDIA_MAX_FILE_SIZE_MB` in `.env` when defaults are unsuitable.
- Allowed images: JPG, PNG, GIF, and WebP.
- Allowed documents: PDF, DOC, DOCX, XLS, XLSX, and ZIP.
- Upload validation checks extension, MIME type, file signature, and file size. Executable and unknown formats are rejected.
- The storage interface is intentionally replaceable by S3-compatible storage before production deployment.

## Scope boundary

The local CMS database is named `iorderCMS`. It contains public website content only. Do not add POS customers, products, inventory, orders, invoices, payments, or POS branch tables to this schema.

## Posts

- The first release supports `news` and `promotion` posts.
- The workflow is draft, published, then archived/hidden.
- Post bodies are stored as plain text in structured JSON for now; the public frontend must render them as text, not unsanitized HTML.
- Admin endpoints support list, create, update, publish, and archive. Public endpoints return published posts only.
- Each create, update, publish, and archive action records a revision and audit event.

## Import current homepage

Run `pnpm.cmd cms:import-homepage`. The command is idempotent for the homepage record, blocks, and seeded media storage keys.

The public website requests `/api/public/homepage` and keeps the previous static content as a controlled fallback when the API is unavailable. `PUBLIC_ORIGIN` must match the public Vite origin so browser CORS permits the request.

Run `pnpm.cmd cms:import-posts` to import the six existing static news articles and three cover images. The command updates records by slug, so rerunning it does not duplicate posts.
