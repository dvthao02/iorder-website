# iOrder CMS - Use Cases and Progress

Last updated: 2026-06-21

## Product boundary

The CMS is an internal tool for maintaining the existing iOrder company website. It is not a public-user, CRM, customer, or POS system.

Actors:

- Internal administrator: signs in and manages public website content.
- Public website: reads published content through public APIs.
- Website visitor: only reads the rendered website and has no CMS account.

## Core use cases

### 1. Administrator authentication

1. Administrator submits username and password.
2. API verifies the scrypt password hash.
3. API creates a server-side session and signed HttpOnly cookie.
4. Administrator enters the CMS.
5. Logout revokes the session.

There is no public registration or user-management screen.

### 2. Homepage management

1. Administrator opens the single homepage record.
2. Administrator edits validated fixed blocks such as hero, features, offerings, partners, posts, downloads, CTA, and contact information.
3. Administrator reorders or hides blocks.
4. Administrator saves a draft and previews it.
5. Publishing creates a revision and makes the new version available to the public API.

The administrator cannot create arbitrary HTML, CSS, or JavaScript.

### 3. Post management

1. Administrator creates or edits a news or promotion post.
2. Administrator chooses a cover image, slug, excerpt, content, CTA, and basic SEO fields.
3. Administrator saves a draft and previews it.
4. Administrator publishes or hides the post.
5. The public API returns published posts only.

First-release workflow: `draft -> published -> archived/hidden`.

### 4. Media and downloadable documents

1. Administrator uploads an allowed image or document.
2. API validates MIME type, extension, file size, and filename.
3. File storage returns a storage key and public URL.
4. CMS saves metadata, alt text, and caption in `media_assets`.
5. Administrator attaches the asset to a homepage block, post, or download link.
6. An asset in use cannot be permanently deleted.

### 5. Shared website content

Administrator manages header/footer menus, internal and external links, CTA links, hotline, email, address, social links, and basic site metadata.

### 6. Public delivery

1. Public website requests published homepage, post, menu, link, and site-profile data.
2. Public API excludes drafts and archived content.
3. Website renders API data with a controlled static fallback during migration.
4. Publishing invalidates the affected cache.

## Explicitly deferred

- Customer accounts, CRM, POS data, orders, products, payments, and inventory.
- Public registration and customer login.
- User-management UI and editor/author approval workflow.
- Scheduled publishing and complex category/tag hierarchy.
- General-purpose drag-and-drop page builder.
- Separate offerings module unless homepage and current detail-page migration proves it is necessary.

## Current implementation status

Completed:

- PostgreSQL CMS database and two applied migrations.
- Internal authentication, sessions, admin guard, logout, and login rate limiting.
- Admin login UI and administrator bootstrap command.
- Base schemas for content, pages, posts, media, navigation, and settings.
- Local media/document storage, protected upload/list/update APIs, public file delivery, and the admin media-library screen.
- Media validation for allowed extension, MIME type, file signature, image dimensions, and the configured size limit.
- Posts CRUD for news and promotions, cover-image selection, unique slugs, draft/publish/archive actions, revisions, audit logs, and published-only public APIs.
- Admin post list/editor with automatic slug generation and basic SEO fields.
- Single-homepage editor with validated fixed blocks, ordering, visibility, draft revisions, published snapshots, and published-only public API.
- Idempotent current-homepage import with 9 ordered blocks, a 3-slide hero carousel, 16 partners, deployment media, and 22 seeded media assets.
- Public homepage integration for hero, introduction cards/chips, partners, industries, features, deployment, ecosystem, articles, and CTA. Published block order and visibility drive the public body layout.
- Admin task dashboard with live homepage/post/media totals and a persistent navigation sidebar.
- Full homepage nested editing for hero slides, feature items, partner logos, article feed configuration, downloads, and CTA.
- Six existing articles imported into Posts; homepage cards, `/tin-tuc`, and article details now read published CMS data with static fallback.
- CMS typecheck, build, health smoke, and authentication smoke tests.

Not implemented yet:

- Menu/link/company-profile screens.
- Public content APIs and integration with the existing static website.

## Next implementation order

1. Create the real internal administrator account.
2. Move the remaining industry, deployment, ecosystem, and intro-card details from static JSX/data into explicit CMS blocks.
3. Implement menus, links, and company information.
4. Connect the existing news pages to the published Posts API.
5. Add remaining public read APIs and migrate existing static data with parity checks.

Read `CMS_IMPLEMENTATION_PLAN.md` for architecture, database, validation history, and broader handoff notes.
