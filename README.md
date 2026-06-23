# iOrder Website and CMS

The public iOrder company website is built with React, Vite, and Vercel SPA routing. A separate CMS workspace is being added for company pages, posts, promotions, offerings, media, menus, links, and SEO content.

The CMS is intentionally independent from the existing POS database and POS business workflows.

## Current applications

```text
./             Existing public website
apps/admin     CMS administration application
apps/api       CMS API
packages/*     Database and shared contracts
```

## Commands

```powershell
pnpm.cmd dev
pnpm.cmd build

pnpm.cmd dev:admin
pnpm.cmd dev:api
pnpm.cmd typecheck:cms
pnpm.cmd build:cms
pnpm.cmd test:auth
pnpm.cmd test:media
pnpm.cmd test:posts
pnpm.cmd test:homepage
pnpm.cmd cms:create-admin
pnpm.cmd cms:import-homepage
pnpm.cmd cms:import-posts
pnpm.cmd db:create
pnpm.cmd db:generate
pnpm.cmd db:migrate
pnpm.cmd db:seed
```

Copy `.env.example` to `.env` and provide a valid PostgreSQL connection before starting the API or applying migrations.

Read [CMS_IMPLEMENTATION_PLAN.md](./CMS_IMPLEMENTATION_PLAN.md) before continuing CMS implementation.
