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
MEDIA_STORAGE_PATH=../../storage/media
MEDIA_PUBLIC_BASE_URL=https://your-domain.example/media
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
4. Verify staging health, login, homepage, media upload, and post publish/archive.
5. `Deploy` proceeds to `production` through the GitHub `production` environment.

Configure GitHub Environments:

- `staging`: no manual approval required.
- `production`: require manual reviewer approval and restrict deployment branch to `main`.

## Database Migration Policy

Run migrations only after a fresh backup:

```bash
pnpm db:backup
pnpm db:migrate
pnpm db:seed
```

For production, run the backup against the production `DATABASE_URL` and store the generated `backups/*.dump` outside the application container before applying migrations.

Drizzle migrations in this project are forward-only. If a migration is logically wrong, prefer a corrective follow-up migration. Use full restore only for catastrophic migration failures or accidental destructive changes.

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
2. Confirm `/health` and `/api/public/health`.
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
