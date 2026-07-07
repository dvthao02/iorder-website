# iOrder Web/CMS Review for Codex

> 2026-07-05 note: this review predates the newer API/admin modules now present in the worktree. Use `docs/BUSINESS_REBUILD_BLUEPRINT.md` and `docs/CMS_USE_CASES.md` as the current business baseline; treat the findings below as historical migration notes and re-verify them against current code before acting.

Last updated: 2026-06-21

This review is written to make structural problems obvious to a code-reading agent. The goal is not to restate the architecture plan, but to highlight where the current implementation still prevents a complete product.

## How Codex Should Use This Review

- Treat this as a navigation guide, not a permission to refactor everything at once.
- Change one domain slice at a time: contracts first, API second, admin UI third, public web last.
- Keep the existing static fallback until the new CMS path is proven equivalent.
- Do not touch unrelated routes, styles, or data files while working a single slice.
- After each slice, run the narrowest validation that can confirm the change.

## Highest Priority Findings

### 1. Public website is still mostly static and duplicated

The public site is not yet fully driven by CMS data. Core pages still rely on hardcoded content in [frontend/web/src/data/siteContent.js](../frontend/web/src/data/siteContent.js), [frontend/web/src/data/newsArticles.js](../frontend/web/src/data/newsArticles.js), and route-driven fallback content in [frontend/web/src/pages/StaticPage.jsx](../frontend/web/src/pages/StaticPage.jsx). Even though [frontend/web/src/pages/Home.jsx](../frontend/web/src/pages/Home.jsx) and [frontend/web/src/utils/contentApi.js](../frontend/web/src/utils/contentApi.js) already consume the CMS for part of the homepage and posts, the product still has two sources of truth.

Why this matters:

- Content can drift between admin and public rendering.
- SEO and public delivery are only partially aligned with the CMS.
- New content types still need code changes instead of CMS updates.

What Codex should infer:

- The current product is a hybrid migration, not a finished CMS-powered website.
- The public site cannot be considered complete until menus, links, company profile, static landing pages, and detail pages are sourced from public APIs or a controlled rendering pipeline.

Recommended fix:

- Move remaining static content into CMS-backed public APIs and explicit contracts.
- Remove duplicated route content progressively, starting with pages that users expect to edit without deployment.
- Keep the current fallback code until the CMS-backed output matches it.

### 2. Admin app only covers a subset of the promised CMS surface

The admin UI currently exposes dashboard, homepage, posts, and media only in [frontend/admin/src/AdminApp.tsx](../frontend/admin/src/AdminApp.tsx). The API layer matches that limited scope in [backend/api/src/app.ts](../backend/api/src/app.ts), which registers auth, media, posts, and homepage routes only.

Why this matters:

- The implementation plan and use-cases describe a broader CMS: menus, links, site settings, company profile, redirects, SEO, and offerings.
- Without those screens, editors cannot manage the full product from the CMS.

What Codex should infer:

- The admin is functional, but it is still an MVP shell rather than the completed CMS product.
- Product completeness is blocked by missing domain modules, not by styling.

Recommended fix:

- Add admin modules in the order already described in the implementation plan: menus, links, site profile, settings, then SEO and redirects.
- Add corresponding API routes and shared contracts before wiring UI.
- Do not expand the admin shell before the backend contract exists.

### 3. API boundary is narrower than the documented domain model

The repository documentation names menus, menu items, link groups, content links, site profile, site settings, redirects, and offerings as part of the CMS domain in [CMS_IMPLEMENTATION_PLAN.md](../CMS_IMPLEMENTATION_PLAN.md), but the API entrypoint [backend/api/src/app.ts](../backend/api/src/app.ts) does not expose routes for those domains yet.

Why this matters:

- The frontend must keep hardcoding values that should be manageable from CMS.
- The architecture promise of public website -> public read API -> CMS PostgreSQL is not fully realized.

What Codex should infer:

- The missing public read layer is a product gap, not just an implementation detail.
- The system still behaves like a partially migrated static website rather than a complete CMS platform.

Recommended fix:

- Add public read endpoints for menus, site settings, site profile, and offerings.
- Add admin write endpoints only after the corresponding data model and validation are defined.
- Preserve the existing static front-end data until the public API returns the same shape.

### 4. Homepage editor is validated but still narrow in scope

The homepage editor in [frontend/admin/src/HomepageEditor.tsx](../frontend/admin/src/HomepageEditor.tsx) supports a useful set of blocks, but it is still intentionally limited and does not yet cover the broader content model described in the plan, such as contact information, more reusable link blocks, or richer page composition.

Why this matters:

- The product is safe, but editors cannot finish the entire homepage and system content story in the UI.
- This is where a CMS often stops being useful if the content model is too narrow.

Recommended fix:

- Keep the validated block approach.
- Expand block coverage only where the product actually needs reusable CMS-managed content, instead of introducing a free-form page builder.
- Prefer adding a small block or field over adding a new one-off hardcoded page.

## Product Risks To Watch

- Static and CMS content drift will increase as long as the website has both hardcoded routes and CMS-backed pages.
- Admin scope will continue to feel incomplete until menus, settings, profile, and redirects are added.
- Public SEO will remain uneven unless article and landing-page routes are consistently rendered from CMS-backed data.
- The current architecture is good enough for migration, but not yet strong enough to stop editing static files entirely.

## Recommended Completion Order

1. Add the missing CMS contracts and API routes for menus, links, site profile, and site settings.
2. Wire public read endpoints and keep the static fallback beside them until parity is verified.
3. Expand admin screens to manage those domains.
4. Migrate remaining static routes and detail pages to CMS or controlled rendering.
5. Remove the last duplicated static sources only after parity is verified and the old path is no longer needed.

## Safe First Slice

If Codex starts implementing from this review, the safest first slice is:

1. Define or extend contracts for menu/site settings data.
2. Add one public read endpoint for that data.
3. Add one admin screen or section to edit it.
4. Validate that the public site can still render with the fallback if the API is unavailable.

This sequence reduces the chance of breaking the existing migration flow because it keeps the public website working while the CMS path is introduced.

## Short Verdict

The codebase is structurally sound for a migration phase, but not yet a complete CMS product. The main issue is not code quality inside the existing modules; it is that the public website still has too much hardcoded content and the admin/API surface is still missing several core content-management domains.
