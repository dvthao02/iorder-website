# Architecture

## Ownership

| Area           | Location            | Responsibility                                     |
| -------------- | ------------------- | -------------------------------------------------- |
| Public website | `frontend/web`      | Public React application and CMS read models       |
| CMS            | `frontend/admin`    | Authenticated editing workflows                    |
| API            | `backend/api`       | Fastify routes, business rules, and integrations   |
| Contracts      | `backend/contracts` | Zod schemas and shared API types                   |
| Database       | `backend/database`  | Drizzle schema, migrations, seed-core, and backups |

## Source of truth

- Git owns application code, migrations, and system assets.
- PostgreSQL owns published CMS content, revisions, users, audit logs, and navigation.
- Production uploads use the S3-compatible `MinioMediaStorage`; a deploy container filesystem is not durable media storage.
- The public website reads content through the API. Temporary static fallbacks must carry a `REMOVE-BY` marker and be removed after the matching CMS migration is complete.

## Module boundaries

Each CMS domain lives in `backend/api/src/modules/<name>` and contains repository, service, errors, routes, index, and service tests when it owns business logic. Route adapters parse HTTP input and delegate to services; repositories are the only module layer that queries Drizzle.

Admin code should group new work by feature under `frontend/admin/src/features/<domain>`. Shared UI, editor primitives, API clients, and hooks stay outside feature folders. Keep route-level components small and move domain state, form mapping, and API calls into feature-local files when a screen grows.

## Commands

```bash
pnpm dev:all             # web, API, and CMS locally
pnpm build               # full production build
pnpm verify              # required repository quality gate
pnpm db:migrate          # apply migrations locally
pnpm bootstrap:core      # one-time roles and first administrator setup
pnpm content:import:legacy # one-time migration of legacy static content
```

`bootstrap:core` and `content:import:legacy` are manual operations. They must not run during ordinary Railway deploys.

## Deployment

Railway builds the source image, runs `pnpm railway:migrate`, then waits for `GET /ready` before routing traffic to the new instance. `/health` is a liveness endpoint; `/ready` verifies PostgreSQL connectivity. The server handles termination signals by closing Fastify and database resources before exit.

Use separate Railway staging and production environments, each with its own PostgreSQL database and media bucket. Verify staging before promoting a release. See [PRODUCTION_RUNBOOK.md](PRODUCTION_RUNBOOK.md) for backup, rollback, and release steps.
