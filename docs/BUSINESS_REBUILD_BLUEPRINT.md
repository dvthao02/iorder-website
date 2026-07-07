# iOrder Business Rebuild Blueprint

Last updated: 2026-07-05

## 1. Product Direction

iOrder started as a mostly static company website. The current codebase is now closer to a website CMS product:

- `frontend/web`: public company website.
- `frontend/admin`: internal CMS for company staff.
- `backend/api`: Fastify API for public reads and admin writes.
- `backend/contracts`: shared Zod contracts.
- `backend/database`: Drizzle schema and migrations.

The correct rebuild direction is not to turn this repository into a POS, CRM, customer portal, or order-management product. Those domains should stay outside this repo unless the business explicitly creates a separate product boundary. This repo should become a complete source-of-truth system for the public iOrder website: content, media, navigation, contact leads, SEO, and publishing workflow.

## 2. Business Scope

### In Scope

- Public website content delivery.
- Internal CMS authentication and user management.
- Homepage editing with validated sections.
- News, promotions, announcements, and case-study posts.
- Software, solution, service, and industry offering pages.
- Static content pages such as support, FAQ, policies, and guides.
- Media library for images and downloadable documents.
- Header, footer, menus, link groups, contact links, and external links.
- Company profile and website settings.
- Customer logo and testimonial management.
- Contact lead capture from public forms.
- Basic website/API health, sitemap, robots, and operational runbook.
- Audit log for admin mutations.

### Out of Scope For This Repo

- POS back-office administration.
- Customer accounts or public registration.
- Orders, payments, products, inventory, tables, kitchens, invoices.
- Full CRM pipeline, sales automation, or marketing campaign automation.
- Multi-tenant SaaS management for iOrder merchant accounts.

The only lead-related responsibility here is receiving and tracking contact requests from the website.

## 3. Actors

| Actor           | Goal                                                              | Access                        |
| --------------- | ----------------------------------------------------------------- | ----------------------------- |
| Website visitor | Read public content, download support assets, submit contact form | Public website only           |
| Content author  | Draft content and upload assets                                   | CMS, limited mutation rights  |
| Editor          | Edit, publish, archive, and manage website content                | CMS content modules           |
| Admin           | Manage CMS users, settings, navigation, and all content           | Full CMS                      |
| Public website  | Read published data through public APIs                           | Read-only public API          |
| Operator        | Deploy, backup, restore, and verify production                    | CLI, runbooks, infrastructure |

## 4. Core Use Cases

### 4.1 Visitor Reads The Website

1. Visitor opens a public route.
2. Web app requests published content through `/api/public/*`.
3. API returns only published or enabled records.
4. Web app renders CMS content.
5. Static fallback is used only during migration or API failure.

Acceptance:

- Draft and archived content never appear publicly.
- Public pages can render without CMS login.
- SEO title, description, canonical URL, sitemap, and robots output match published data.

### 4.2 Visitor Submits A Contact Request

1. Visitor submits contact form with name and phone.
2. API validates phone, optional email, need, business model, and honeypot field.
3. API stores `contact_leads` with status `new` and hashed IP metadata.
4. Admin sees new lead count and can mark it as `contacted` or `closed`.

Acceptance:

- Spam honeypot submissions are rejected or ignored.
- The lead inbox is intentionally small; it is not a full CRM.
- Lead status changes are auditable.

### 4.3 Admin Signs In

1. Admin enters username and password.
2. API verifies password hash.
3. API creates a server-side session and signed HttpOnly cookie.
4. CMS loads role information.
5. Logout or password change revokes session state as needed.

Acceptance:

- No public registration exists.
- Admin-only modules are guarded.
- Passwords are never stored or logged in plaintext.

### 4.4 Admin Publishes Homepage

1. Admin opens the single homepage editor.
2. Admin edits fixed, validated blocks.
3. Admin autosaves draft data.
4. Admin creates checkpoint or publishes.
5. API creates page revisions and exposes the published snapshot publicly.

Acceptance:

- Homepage blocks are validated by `backend/contracts/src/pages.ts`.
- A block type appears at most once.
- Public homepage reads the published snapshot, not the current draft.

### 4.5 Admin Manages Posts

1. Admin creates a news, promotion, case study, or announcement.
2. Admin selects category, cover media, content, CTA, SEO, and schedule fields.
3. Admin saves draft.
4. Admin publishes, schedules, archives, unpublishes, restores revision, or deletes.
5. Public APIs return published posts only.

Acceptance:

- Slugs are unique for active posts.
- Post revisions preserve recoverable snapshots.
- Scheduled publishing is handled by the post scheduler.

### 4.6 Admin Manages Offerings

1. Admin creates an offering of type `software`, `solution`, `service`, or `industry`.
2. Admin edits summary, content JSON, metrics, features, benefits, FAQ, cover, icon, sort order, and SEO.
3. Admin publishes or archives the offering.
4. Public listing and detail routes render the published offering.

Acceptance:

- Unique slug is scoped by offering type.
- Admin modules and public routes agree on type-to-route mapping.
- If industry pages are public, the CMS must expose an industry management path too.

### 4.7 Admin Manages Navigation And Shared Links

1. Admin creates or seeds menu locations.
2. Admin edits menu items and nested children.
3. Admin edits link groups for footer/social/support links.
4. Public website reads menu and link-group data from public APIs.

Acceptance:

- Disabled menu items are hidden publicly.
- Internal and external URLs are validated consistently.
- Navigation mutations are written to audit logs.

### 4.8 Admin Manages Site Settings

1. Admin edits company profile, hotline, sales email, support email, address, logo, working hours, and external links.
2. Admin optionally edits appearance settings.
3. Public website reads settings from `/api/public/settings`.

Acceptance:

- Header, footer, contact page, and floating actions use the same settings source.
- Missing settings have clear fallback behavior.
- Settings updates are audited.

### 4.9 Admin Manages Static Content Pages

1. Admin creates a page with slug, title, lead, body, SEO fields, and status.
2. Admin publishes or unpublishes.
3. Public website renders `/api/public/content-pages/*` by slug.

Acceptance:

- This module is for simple rich-text pages.
- Composable landing pages should use `pages` and `page_blocks`, not one-off static JSX.

### 4.10 Admin Manages Media And Downloads

1. Admin uploads an image or document.
2. API validates extension, MIME type, file signature, file size, filename, and image dimensions.
3. API stores metadata in `media_assets`.
4. Admin attaches assets to content records or support downloads.
5. API prevents destructive deletion when an asset is in use.

Acceptance:

- Media metadata includes alt text and caption.
- Public URLs are stable.
- Upload limits come from environment configuration.

## 5. Functional Modules

| Module           | Current code surface                                                        | Business role                               | Current maturity                                                     |
| ---------------- | --------------------------------------------------------------------------- | ------------------------------------------- | -------------------------------------------------------------------- |
| Auth/session     | `auth`, `identity`, `sessions`                                              | CMS login and session security              | Implemented                                                          |
| Users/roles      | `modules/users`, `users`, `roles`, `user_roles`                             | Internal CMS account control                | Implemented, needs permission matrix hardening                       |
| Homepage         | `modules/homepage`, `pages`, `page_blocks`, `page_revisions`                | Main editable landing page                  | Implemented                                                          |
| Posts/categories | `modules/posts`, `modules/categories`, `posts`, `categories`, `tags`        | News and promotions                         | Implemented                                                          |
| Offerings        | `modules/offerings`, `offerings`, `offering_revisions`                      | Software, solutions, services, industries   | Implemented, industry admin path should be confirmed                 |
| Content pages    | `modules/content-pages`, `content_pages`                                    | Simple static pages from CMS                | Implemented, model should be aligned with content status conventions |
| Media            | `modules/media`, `media_assets`                                             | File and image source of truth              | Implemented                                                          |
| Downloads        | `modules/downloads`, `support_downloads`                                    | Support installer/document links            | Implemented                                                          |
| Partners         | `modules/partners`, `partners`                                              | Customer/partner logos                      | Implemented                                                          |
| Testimonials     | `modules/testimonials`, `testimonials`                                      | Social proof content                        | Implemented                                                          |
| Leads            | `modules/leads`, `contact_leads`                                            | Website contact inbox                       | Implemented                                                          |
| Navigation       | `modules/navigation`, `menus`, `menu_items`, `link_groups`, `content_links` | Header/footer/menu source of truth          | Implemented, needs audit/test completion                             |
| Settings         | `modules/settings`, `site_profile`, `site_settings`                         | Company profile and global website settings | Implemented, needs module-structure cleanup                          |
| Redirects        | `redirects` table                                                           | SEO redirects                               | Schema exists; routes/contracts/UI not confirmed                     |
| Activity         | `modules/activity`, `audit_logs`                                            | Admin mutation audit trail                  | Implemented, coverage uneven                                         |
| Stats            | `stats-routes`                                                              | Public stats from configured app DBs        | Implemented as read-only public endpoint                             |
| SEO              | `seo-routes`                                                                | Sitemap and robots                          | Implemented                                                          |

## 6. Database Source Of Truth

### Identity And Access

- `users`: CMS users.
- `roles`: role catalog.
- `user_roles`: many-to-many role assignment.
- `sessions`: server-side sessions with token hash and expiry.

Decision needed:

- Define a permission matrix for `admin`, `editor`, and `author`.
- Replace broad `authGuard` usage with role-specific guards where needed.

### Content And Publishing

- `pages`: composable pages, currently used by homepage.
- `page_blocks`: validated page sections with JSON data and appearance.
- `page_revisions`: snapshots and publish history.
- `posts`: news/promotion/case-study/announcement records.
- `post_revisions`: post version snapshots.
- `categories`, `tags`, `post_categories`, `post_tags`: post classification.
- `offerings`, `offering_revisions`: product/solution/service/industry content.
- `content_pages`: simple content pages.

Decisions needed:

- Standardize statuses. DB enum allows `draft`, `review`, `scheduled`, `published`, `archived`; some contracts currently expose only a subset.
- Decide whether `content_pages` remains a simple rich-text module or is merged into `pages`.
- Decide whether all publishable modules need revisions, scheduling, and preview.

### Shared Website Components

- `media_assets`: uploaded files and images.
- `menus`, `menu_items`: navigation by location.
- `link_groups`, `content_links`: reusable link collections.
- `site_profile`: company identity and contact details.
- `site_settings`: JSON settings such as external links and appearance.
- `partners`, `testimonials`, `support_downloads`: reusable public content.

Decision needed:

- Every public component should have exactly one source of truth. Static data should only be a migration fallback.

### Leads, Audit, Operations

- `contact_leads`: website form submissions.
- `audit_logs`: admin mutation history.
- `redirects`: SEO redirect registry.

Decisions needed:

- Add contracts/routes/UI for redirects if production SEO requires editable redirects.
- Ensure every mutation inserts audit logs consistently.

## 7. Contract And Module Rules

Every new or rebuilt module should follow this order:

1. Business use case and state transitions.
2. Shared contract in `backend/contracts`.
3. Database schema and migration in `backend/database`.
4. API module under `backend/api/src/modules/<name>`:
   - `<name>.repository.ts`
   - `<name>.service.ts`
   - `<name>.errors.ts`
   - `<name>-routes.ts`
   - `index.ts`
   - `<name>.service.test.ts`
5. Admin UI in `frontend/admin`.
6. Public read integration in `frontend/web` when the module affects the public site.
7. Smoke/unit/e2e validation.
8. Documentation update.

Module definition of done:

- Contract validates all inputs and public response shapes.
- DB constraints protect unique slugs, sort order, and foreign keys.
- Admin writes are authenticated and authorized.
- Public reads return only published/enabled records.
- Mutations write audit logs.
- Service tests cover create/update/delete/publish edge cases.
- Existing static fallback remains until parity is verified.

## 8. Current Gaps To Fix Before Calling The Product Complete

1. Static fallback still exists across the public website. That is acceptable during migration, but not as the final source of truth.
2. `content_pages` uses a simple varchar status while the main content model uses `content_status`. Standardize this before adding complex page workflows.
3. `pages` and `content_pages` overlap. Keep both only if their business roles remain distinct.
4. `redirects` has a schema but no confirmed contracts/admin/public handling.
5. Role permissions are not yet a clear business matrix.
6. API module-standard test records known debt:
   - `navigation` mutation service lacks audit-log enforcement.
   - Missing service tests are listed for categories, downloads, media, navigation, partners, settings, and testimonials.
   - `settings` is missing the standard errors file.
7. Offering type `industry` exists in contracts/routes/public mapping, but the admin sidebar currently exposes software, solutions, and services. Confirm whether industry needs its own admin screen.
8. README and older docs should be refreshed after the business baseline is accepted.

## 9. Rebuild Roadmap

### Phase 0 - Freeze Baseline

- Keep current dirty worktree intact.
- Use this document as the new product baseline.
- Do not add unrelated UI while the domain model is being cleaned.

Output:

- Approved business scope.
- Approved module list.
- Agreed exclusions: no POS/CRM/customer portal in this repo.

### Phase 1 - Normalize Domain Contracts

- Align content statuses across contracts and DB.
- Decide `pages` vs `content_pages` responsibilities.
- Confirm industry offering management.
- Define CMS role permission matrix.
- Add redirect contracts if redirects stay in scope.

Output:

- Stable shared contracts.
- Migration plan for schema mismatches.
- Updated use-case documentation.

### Phase 2 - Complete API Integrity

- Fix module-standard debt.
- Add missing service tests.
- Ensure audit logs on all admin mutations.
- Add role-aware guards.
- Add redirect module if approved.

Output:

- API modules follow one repeatable pattern.
- `pnpm test:unit:api` covers domain rules.

### Phase 3 - Finish Admin CMS Workflows

- Add or refine screens for industry offerings, redirects, settings, and any missing shared content.
- Keep editor flows consistent: draft, preview, publish, archive.
- Add clear list filters, status counters, and revision/restore where required.

Output:

- Internal staff can manage the full website without code edits.

### Phase 4 - Migrate Public Website To CMS Source Of Truth

- Route by route, replace static data with public APIs.
- Keep fallback beside each route until parity is verified.
- Remove static fallback only after content is imported and smoke-tested.

Output:

- Public website renders from DB-backed published content.

### Phase 5 - Production Readiness

- Refresh README and runbooks.
- Verify backup/restore path.
- Run `pnpm verify`.
- Smoke public site, admin login, content publish, contact lead, sitemap, and media serving.

Output:

- Release candidate that can be deployed from source and operated with documented commands.

## 10. Immediate Next Slices

Recommended order from here:

1. Update `docs/CMS_USE_CASES.md` and `docs/CODEX_REVIEW.md` to match this current module set.
2. Implement the Phase 1 decisions:
   - status model,
   - pages/content-pages boundary,
   - industry admin path,
   - permission matrix,
   - redirects.
3. Fix API module-standard debt and add missing tests.
4. Run a public route parity pass: homepage, posts, offerings, downloads, content pages, header/footer, settings, and contact form.

This keeps the rebuild business-first while preserving the code that already works.
