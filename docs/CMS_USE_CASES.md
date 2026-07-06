# iOrder CMS Use Cases

Last updated: 2026-07-05

This document is the working use-case baseline for the iOrder public website CMS. For the fuller rebuild plan, database boundary, and implementation roadmap, read `docs/BUSINESS_REBUILD_BLUEPRINT.md`.

## Product Boundary

The CMS is an internal administration tool for the iOrder company website. It manages public website content and website contact leads. It is not a POS, order, product, inventory, payment, customer-account, or full CRM system.

## Actors

- Website visitor: reads public content, downloads support files, and submits contact forms.
- Content author: drafts content and uploads media.
- Editor: edits, publishes, archives, and restores website content.
- Admin: manages CMS users, settings, navigation, and all website content.
- Public website: reads published CMS data through public APIs.
- Operator: deploys, backs up, restores, and verifies the production system.

## Core Use Cases

### 1. Authentication And Access

1. User submits username and password in the internal CMS.
2. API verifies the password hash.
3. API creates a server-side session and signed HttpOnly cookie.
4. CMS loads the user's role set.
5. Logout, disable user, reset password, or change password invalidates affected access where required.

Rules:

- No public registration exists.
- CMS roles are `admin`, `editor`, and `author`.
- The permission matrix still needs to be formalized so broad authenticated routes can be narrowed by business role.

### 2. Homepage Management

1. Editor opens the single homepage record.
2. Editor edits fixed, validated blocks such as hero, stats, industries, features, testimonials, process, featured posts, FAQ, and CTA.
3. Editor autosaves draft data.
4. Editor creates checkpoints or publishes.
5. API stores revisions and exposes only the published snapshot to the public website.

Rules:

- Homepage blocks are contract-driven, not arbitrary HTML/CSS/JS.
- One block type should not appear more than once in the homepage payload.
- Draft data must not leak to public APIs.

### 3. Posts And Categories

1. Editor creates a post of type `news`, `promotion`, `case_study`, or `announcement`.
2. Editor sets title, slug, cover image, excerpt, rich content, categories, CTA, SEO, and schedule fields.
3. Editor saves draft, publishes, schedules, unpublishes, archives, restores a revision, or deletes.
4. Public API returns published posts and public categories only.

Rules:

- Active slugs are unique.
- Published post data is the public source of truth for news and promotion pages.
- Scheduled publishing is handled by the API scheduler.

### 4. Offerings

1. Editor creates an offering with type `software`, `solution`, `service`, or `industry`.
2. Editor manages summary, content JSON, metrics, features, benefits, FAQ, cover media, icon, sort order, featured flag, and SEO.
3. Editor publishes, unpublishes, archives, or deletes.
4. Public website renders listing and detail routes from published offerings.

Rules:

- Slug uniqueness is scoped by offering type.
- Admin UI currently exposes software, solutions, and services; industry management must be confirmed if industry pages remain public.

### 5. Content Pages

1. Editor creates a simple static content page with slug, title, lead, body, SEO, and status.
2. Editor publishes or unpublishes.
3. Public website reads `/api/public/content-pages/*` by slug.

Rules:

- Use this module for simple rich-text pages such as support, FAQ, guides, and policies.
- Use the composable `pages` + `page_blocks` model for structured landing pages.
- `content_pages` status should be standardized with the main content status model before adding more workflow.

### 6. Media And Downloads

1. Editor uploads an image or document.
2. API validates filename, extension, MIME type, file signature, size, and image dimensions.
3. API stores metadata in `media_assets`.
4. Editor attaches media to content or creates support-download records.
5. Public website reads enabled support downloads from the public API.

Rules:

- Media metadata should include alt text and caption.
- Files in use should not be destructively deleted.
- Upload limits are environment-driven.

### 7. Navigation, Links, And Settings

1. Admin creates or seeds menu locations.
2. Admin edits menu items, nested items, link groups, and shared links.
3. Admin edits site profile, hotline, support email, sales email, address, logo, working hours, external links, and appearance settings.
4. Public website reads menus and settings through public APIs.

Rules:

- Header, footer, contact page, floating actions, and shared CTA links should use the same settings and navigation source.
- Disabled menu items and links must be hidden publicly.
- Navigation and settings mutations should be auditable.

### 8. Partners And Testimonials

1. Editor creates partner/customer logos and testimonials.
2. Editor controls sort order and enabled state.
3. Public homepage and related sections read enabled records.

Rules:

- Homepage blocks may configure headings and limits, but reusable partner/testimonial data should live in shared tables.

### 9. Contact Leads

1. Visitor submits the public contact form.
2. API validates contact data and honeypot field.
3. API stores a `new` lead.
4. Admin views new leads and updates status to `contacted` or `closed`.

Rules:

- This is a website lead inbox, not a full CRM pipeline.
- Lead status changes should be auditable.

### 10. SEO, Redirects, And Public Delivery

1. Public website reads published data from `/api/public/*`.
2. API serves sitemap and robots output.
3. Redirects should be managed from the DB if production SEO needs editable redirects.

Rules:

- Static fallback is allowed during migration only.
- Final public content should have one source of truth in the CMS database.
- `redirects` currently exists in the DB schema, but contracts/routes/UI still need confirmation.

## Current Implementation Summary

Implemented surfaces observed in the current codebase:

- Auth, sessions, users, roles.
- Homepage editor, autosave, revisions, preview token, public homepage.
- Posts, categories, revisions, scheduler, public posts.
- Offerings and public offering pages.
- Content pages and public content-page lookup.
- Media library and support downloads.
- Partners and testimonials.
- Contact leads.
- Navigation, menus, link groups.
- Site profile, settings, external links, appearance settings.
- Activity log.
- Public stats, sitemap, and robots.

Known product gaps:

- Role permission matrix is not yet explicit enough.
- Statuses should be normalized across publishable modules.
- `pages` and `content_pages` need a firm boundary.
- Industry offering management must be confirmed.
- Redirects need contracts/routes/UI if they remain in scope.
- Static public fallbacks should be removed only after API parity is proven.
- Some modules still need service tests and audit-log consistency.

## Recommended Completion Order

1. Approve the business boundary and exclusions.
2. Normalize statuses, page model boundaries, industry management, permissions, and redirects.
3. Complete API module-standard debt and missing service tests.
4. Finish any missing admin screens or controls.
5. Migrate public routes from static fallback to CMS APIs with parity checks.
6. Run `pnpm verify` plus focused browser/API smoke before production release.
