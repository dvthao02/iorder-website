# Production Runbook

## Release Gate

Before deploying, the repository must pass:

```bash
pnpm verify
```

This runs frontend lint, CMS/API type-checking, full production builds, and API smoke tests.

## Required Production Variables

Set these per Railway environment:

```ini
NODE_ENV=production
API_HOST=0.0.0.0
API_PORT=${{PORT}}
ADMIN_ORIGIN=https://your-admin-origin.example
PUBLIC_ORIGIN=https://your-public-origin.example
DATABASE_URL=postgresql://...
SESSION_SECRET=replace-with-strong-secret
CMS_PREVIEW_SECRET=replace-with-strong-secret
# Object storage: the bucket is public-read only for immutable media objects.
MEDIA_STORAGE_DRIVER=minio
MEDIA_STORAGE_PATH=/app/storage/media
MEDIA_PUBLIC_BASE_URL=https://media.your-domain.example/iorder-media
MEDIA_S3_ENDPOINT=minio.internal
MEDIA_S3_PORT=9000
MEDIA_S3_USE_SSL=true
MEDIA_S3_ACCESS_KEY=replace-with-minio-service-access-key
MEDIA_S3_SECRET_KEY=replace-with-minio-service-secret-key
MEDIA_S3_BUCKET=iorder-media
HOMEPAGE_SLUG=home
TRUST_PROXY=true
SENTRY_DSN=https://...
SENTRY_ENVIRONMENT=production
SENTRY_RELEASE=<git-sha-or-release>
SENTRY_TRACES_SAMPLE_RATE=0.05
VITE_SENTRY_DSN=https://...
VITE_SENTRY_ENVIRONMENT=production
VITE_SENTRY_RELEASE=<git-sha-or-release>
VITE_SENTRY_TRACES_SAMPLE_RATE=0.05
```

Source map upload also needs CI/deploy secrets:

```ini
SENTRY_AUTH_TOKEN=...
SENTRY_ORG=...
SENTRY_PROJECT=...
```

GitHub deployment secrets:

```ini
RAILWAY_STAGING_TOKEN=...
RAILWAY_PRODUCTION_TOKEN=...
```

GitHub deployment variable:

```ini
RAILWAY_SERVICE_ID=...
```

## Deployment Flow

1. Merge to `main`.
2. GitHub Actions runs `CI`.
3. `Deploy` uploads to Railway `staging`.
4. Verify staging `/ready`, login, homepage, media upload, and post publish/archive.
5. `Deploy` proceeds to `production` through the GitHub `production` environment.

Configure GitHub Environments:

- `staging`: no manual approval required.
- `production`: require manual reviewer approval and restrict deployment branch to `main`.

## Database Migration Policy

Back up the database and media store before a schema change. Railway runs the migration before switching traffic to the new deployment:

```bash
pnpm db:backup
```

For production, run the backup against the production `DATABASE_URL` and store the generated `backups/*.dump` outside the application container. Do not run `db:seed`, `bootstrap:core`, or `content:import:legacy` during a routine deploy: CMS content is owned by the production database.

Drizzle migrations in this project are forward-only. If a migration is logically wrong, prefer a corrective follow-up migration. Use full restore only for catastrophic migration failures or accidental destructive changes.

## Media Migration

Before changing `MEDIA_PUBLIC_BASE_URL`, back up both the database and old local media volume. Deploy the API with MinIO configured, then run the one-time copy job against the old media path:

```bash
pnpm media:migrate-local
```

The job preserves each `storageKey`, uploads it to the configured bucket, and updates only `media_assets.public_url`. Verify representative image URLs and the CMS library before retiring the old volume.

## Restore Procedure

Restore is intentionally guarded:

```bash
ALLOW_DATABASE_RESTORE=yes BACKUP_FILE=backups/iordercms-YYYY-MM-DD.dump pnpm db:restore
```

After restore:

```bash
pnpm db:migrate
pnpm db:seed
pnpm test:api
```

## Rollback

Application rollback:

1. Roll back to the previous Railway deployment from the Railway dashboard.
2. Confirm `/health`, `/ready`, and `/api/public/health`.
3. Smoke CMS login and homepage.

Database rollback:

1. Prefer corrective forward migration.
2. If data is corrupted, restore the latest pre-migration backup.
3. Re-run smoke tests before reopening CMS editing.

## Observability Checks

After each production deploy:

- Confirm Sentry release receives events for API and frontend projects.
- Confirm API responses include `x-request-id`.
- Confirm Railway logs have request IDs for failed requests.
- Confirm no `SESSION_SECRET`, cookies, or authorization headers are present in Sentry events.
