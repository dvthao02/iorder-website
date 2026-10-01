# PHASE 1 — CONTENT STUDIO SHELL

> **Status:** Ready for implementation
>
> **Scope:** Phase 1 only
>
> **Do not continue to Phase 2 automatically.**
>
> This phase changes the CMS/admin information architecture and navigation experience only.
>
> It must preserve existing API contracts, database schema, content managers, public website behavior, and published content.

---

# 1. REQUIRED READING

Before changing source, read:

1. `docs/CURRENT_ARCHITECTURE_AUDIT.md`
2. `docs/CONTENT_MAPPING_MATRIX.md`
3. `docs/COMPONENT_CONTRACT_AUDIT.md`
4. `docs/IORDER_CONTENT_STUDIO_MASTER_ROADMAP.md`
5. This file

If these files are located elsewhere, use the actual repository paths.

The source code is the final truth for implementation details.

---

# 2. PHASE GOAL

Reorganize the existing CMS into a clear **Content Studio** information architecture.

The objective is to make the CMS feel like a tool for managing the website rather than a collection of database managers.

This phase must **reuse the existing managers**.

Expected conceptual navigation:

```text
Content Studio

Website Content
├── Homepage
├── Software
├── Solutions
├── Services
├── Industries
├── Devices
├── News
├── Guides
└── Content Pages

Media & Shared Content
├── Media Library
├── Partners
├── Testimonials
└── Downloads

SEO & Navigation
├── Navigation
└── Redirects / related settings if currently exposed

Leads
└── Contact Leads

Configuration
├── Website Settings
├── Appearance
├── Users
└── Activity
```

Use Vietnamese labels if the current admin UI uses Vietnamese.

The exact wording should follow existing product language and naming conventions.

---

# 3. CURRENT ARCHITECTURE TO PRESERVE

The current audited admin routing is based on:

```text
frontend/admin/src/AdminApp.tsx
frontend/admin/src/sidebar/navigation.ts
```

`AdminApp.tsx` maps the pathname section using navigation metadata.

Existing managers are already lazy-loaded.

Important existing manager reuse includes:

```text
HomepageEditor
OfferingsManager
SalesEquipmentManager
PostsManager
ContentPagesManager
MediaLibrary
PartnersManager
TestimonialsManager
DownloadsManager
NavigationEditor
SiteProfileEditor
LeadsManager
Users / Activity UI
```

`OfferingsManager` is reused by type for:

```text
software
solution
service
industry
```

Do not split this backend/domain architecture merely to create new sidebar labels.

---

# 4. ALLOWED CHANGES

Phase 1 may modify admin-only files required for:

```text
sidebar grouping
sidebar labels
sidebar icons
navigation ordering
admin section titles
admin breadcrumbs
admin route aliases
admin landing/overview copy
small layout adjustments needed for the new IA
```

Possible files may include:

```text
frontend/admin/src/sidebar/navigation.ts
frontend/admin/src/AdminApp.tsx
frontend/admin/src/...admin layout/sidebar components
frontend/admin/src/...styles related to navigation
```

The actual source must be inspected before editing.

Do not create files solely because this document lists illustrative names.

---

# 5. FORBIDDEN CHANGES

Phase 1 must not modify:

```text
backend/database schema
Drizzle migrations
public API payloads
admin API payloads
Zod content contracts
homepage block contracts
offering section contracts
sales equipment domain model
post domain model
media storage
auth/session behavior
public website renderer
public website routes
public slugs
draft/preview implementation
revision architecture
Page Builder architecture
Component Registry
schema-driven Inspector
```

No database migration is expected in Phase 1.

---

# 6. ROUTING RULE

Prefer preserving existing route behavior.

If the current admin URLs are already stable, keep them.

Example principle:

```text
new sidebar label
      ↓
same existing manager
      ↓
same admin API
```

Do not rename routes simply for visual consistency unless there is a concrete UX reason.

If a route must be renamed:

1. preserve the old route through an alias/redirect when practical;
2. do not break bookmarked admin URLs;
3. do not change public URLs;
4. document the compatibility behavior.

---

# 7. MANAGER REUSE MAP

The intended Phase 1 behavior is conceptually:

```text
Homepage
→ HomepageEditor

Software
→ OfferingsManager(type="software")

Solutions
→ OfferingsManager(type="solution")

Services
→ OfferingsManager(type="service")

Industries
→ OfferingsManager(type="industry")

Devices
→ SalesEquipmentManager

News
→ PostsManager(news/current default mode)

Guides
→ PostsManager(fixedType="guide")

Content Pages
→ ContentPagesManager

Media Library
→ MediaLibrary

Partners
→ PartnersManager

Testimonials
→ TestimonialsManager

Downloads
→ DownloadsManager

Navigation
→ NavigationEditor

Website Settings / Appearance
→ existing settings editor(s)

Leads
→ LeadsManager

Users / Activity
→ existing user/activity screens
```

Verify every mapping against source before editing.

Do not invent a manager that does not exist.

---

# 8. SIDEBAR UX REQUIREMENTS

The sidebar should be understandable without knowledge of database schema.

Avoid labels like:

```text
Records
Entities
Tables
Schemas
Offering Entity
Post Entity
```

Prefer website-oriented labels.

Recommended grouping:

## Group A — Website Content

Primary website editorial surfaces.

Examples:

```text
Trang chủ
Phần mềm
Giải pháp
Dịch vụ
Ngành hàng
Thiết bị
Tin tức
Hướng dẫn
Trang nội dung
```

## Group B — Media & Shared Content

Reusable shared content.

Examples:

```text
Thư viện Media
Đối tác
Khách hàng nói gì / Testimonials
Tải xuống
```

Use current Vietnamese terminology where available.

## Group C — SEO & Navigation

Examples:

```text
Điều hướng
Redirects
```

Do not create a fake standalone SEO manager if SEO is currently embedded in content editors.

If there is no actual redirects admin screen, do not add a dead navigation item.

## Group D — Leads

Example:

```text
Liên hệ / Leads
```

## Group E — Configuration

Examples:

```text
Cấu hình website
Giao diện
Người dùng
Hoạt động
```

Only expose items backed by current screens/routes.

---

# 9. CONTENT STUDIO BRANDING

Where appropriate, change admin-shell terminology to indicate that this area is the website **Content Studio**.

Examples:

```text
CMS
→ Content Studio
```

or:

```text
Quản trị nội dung
→ Content Studio
```

Do not globally rename backend modules or API concepts.

This is an admin experience label, not a domain migration.

---

# 10. OVERVIEW / LANDING SCREEN

If the current admin has an Overview/Dashboard:

keep it unless source inspection shows it is obsolete.

The dashboard may be visually grouped around:

```text
Website Content
Media
Leads
System
```

but Phase 1 should avoid building new analytics or data aggregation.

Do not add new backend endpoints just to populate a redesigned dashboard.

If existing overview cards can be relabeled/reordered safely, do so.

---

# 11. ACTIVE NAVIGATION STATE

Verify that:

- direct navigation to each current admin route activates the correct sidebar item;
- browser refresh preserves the selected section;
- nested/edit routes still highlight their parent module where appropriate;
- route aliases do not create duplicate active menu states.

The new navigation model must not regress route resolution.

---

# 12. BREADCRUMBS AND PAGE TITLES

Where the admin shell already supports page titles or breadcrumbs, align them with the Content Studio IA.

Examples:

```text
Content Studio / Nội dung website / Phần mềm

Content Studio / Nội dung website / Thiết bị

Content Studio / Media / Đối tác
```

Do not force breadcrumb support into every feature if the current shell has no shared mechanism.

Prefer minimal reuse over broad UI refactoring.

---

# 13. PERMISSIONS

Do not redesign authorization in Phase 1.

Existing roles/guards remain authoritative.

If the sidebar currently hides items based on role:

preserve that behavior.

Do not expose an item to a role merely because it was moved to a new group.

Do not use navigation visibility as a substitute for backend authorization.

---

# 14. RESPONSIVE ADMIN NAVIGATION

Preserve existing mobile/tablet sidebar behavior.

If re-grouping increases navigation length:

- verify scrolling;
- verify collapsed navigation;
- verify mobile drawer behavior;
- avoid introducing nested navigation deeper than necessary.

No major admin responsive redesign is required in Phase 1.

---

# 15. ACCESSIBILITY

For any modified navigation UI:

- retain semantic navigation elements where already present;
- preserve keyboard navigation;
- preserve visible focus states;
- keep meaningful labels for icon-only controls;
- avoid relying only on color to indicate active state.

---

# 16. IMPLEMENTATION PROCESS

The coding agent should follow this order.

## Step 1 — Inspect actual files

Inspect:

```text
frontend/admin/src/AdminApp.tsx
frontend/admin/src/sidebar/navigation.ts
```

Then follow imports for:

```text
Sidebar
AdminLayout
NavigationItem
Breadcrumb
Dashboard / Overview
route helpers
role filtering
```

Do not edit yet.

---

## Step 2 — Produce a current route map

Before modification, note:

```text
current path
navigation key
manager
role visibility
current group
```

This may be kept as implementation notes rather than a permanent document.

---

## Step 3 — Define the new IA in navigation configuration

Prefer changing centralized navigation metadata instead of scattering labels across components.

The configuration should be the authoritative source for:

```text
group
label
path/slug
icon
manager key
```

where consistent with the existing architecture.

Avoid a large unrelated navigation framework rewrite.

---

## Step 4 — Update route resolution only if required

If `AdminApp.tsx` already resolves managers correctly from `keyBySlug`, avoid unnecessary changes.

Change it only when required for:

```text
new route alias
new navigation grouping behavior
page title/breadcrumb metadata
```

Preserve existing lazy-loaded managers.

---

## Step 5 — Update admin shell labels

Update:

```text
sidebar section labels
page titles
breadcrumbs
overview labels
```

only where needed.

---

## Step 6 — Validate every module route

Manually/source-verify at minimum:

```text
Homepage
Software
Solutions
Services
Industries
Devices
News
Guides
Content Pages
Media
Partners
Testimonials
Downloads
Navigation
Settings
Leads
Users
Activity
```

If a module is not actually present in source, do not fabricate it.

---

## Step 7 — Run repository validation

Inspect root and admin `package.json` scripts.

Run the actual applicable commands.

Examples only:

```text
pnpm --filter <admin-package> build
pnpm --filter <admin-package> test
pnpm --filter <admin-package> typecheck
pnpm build
```

Do not assume these exact scripts exist.

Use only scripts defined by the repository.

---

# 17. ACCEPTANCE CRITERIA

Phase 1 is complete only when all applicable checks pass.

## Navigation

- [ ] Admin is presented as a Content Studio / website-management experience.
- [ ] Website content modules are grouped together.
- [ ] Shared media/content is grouped separately.
- [ ] Navigation/settings/system concepts are grouped clearly.
- [ ] No dead navigation item was introduced.

## Reuse

- [ ] Existing managers are reused.
- [ ] `OfferingsManager` remains the implementation behind software/solution/service/industry where currently applicable.
- [ ] No duplicate domain model was introduced.

## Compatibility

- [ ] Existing admin APIs are unchanged.
- [ ] Existing database schema is unchanged.
- [ ] Public website behavior is unchanged.
- [ ] Public URLs/slugs are unchanged.
- [ ] Existing bookmarks/routes remain valid or have explicit compatibility aliases.

## Security

- [ ] Existing role-based navigation visibility remains intact.
- [ ] No backend permission behavior was weakened.

## Validation

- [ ] Relevant admin build passes.
- [ ] Relevant typecheck passes if available.
- [ ] Relevant tests pass if available.
- [ ] No new console/type errors from changed files.

---

# 18. EXPECTED ARCHITECTURE IMPACT

At the end of Phase 1 the expected impact should be:

```text
Admin UI / information architecture: CHANGED

Admin managers: REUSED
Admin API: UNCHANGED
Public API: UNCHANGED
Database: UNCHANGED
Database migrations: NONE
Public frontend: UNCHANGED
Content contracts: UNCHANGED
Preview architecture: UNCHANGED
Revision architecture: UNCHANGED
```

Any deviation from this must be explicitly reported before considering Phase 1 complete.

---

# 19. REQUIRED COMPLETION REPORT

When Phase 1 is done, return:

## Completed

Short summary of the new Content Studio navigation.

## Files changed

List exact paths.

## Route compatibility

Describe whether any route aliases/redirects were added.

## Existing managers reused

List module → manager mappings actually retained.

## Architecture impact

Explicitly report:

```text
Admin:
Contracts:
API:
Database:
Public web:
```

## Database

State explicitly:

```text
No database migration was performed.
```

unless an unexpected approved exception occurred.

## Validation

List actual commands and results.

## Known limitations

Only factual limitations found during Phase 1.

## Next

State:

```text
Next planned phase: Phase 2 — Content Editor Framework V2.
```

Then stop.

Do not implement Phase 2.

---

# 20. DIRECT EXECUTION PROMPT

Use the following instruction with the coding agent:

```text
Read these files first:

- docs/CURRENT_ARCHITECTURE_AUDIT.md
- docs/CONTENT_MAPPING_MATRIX.md
- docs/COMPONENT_CONTRACT_AUDIT.md
- docs/IORDER_CONTENT_STUDIO_MASTER_ROADMAP.md
- docs/PHASE_1_CONTENT_STUDIO_SHELL.md

Then inspect the actual current admin source.

Implement PHASE 1 ONLY: Content Studio Shell.

The purpose of this phase is to reorganize the existing admin information architecture and navigation around website-management concepts while reusing all existing managers, APIs, database models, and public renderers.

Do not implement Phase 2.
Do not create Page Builder infrastructure.
Do not create Component Registry.
Do not change database schema.
Do not create Drizzle migrations.
Do not change public APIs.
Do not change public website rendering.
Do not redesign preview/revision behavior.
Do not introduce multilingual functionality.

Before editing, inspect at minimum:
- frontend/admin/src/AdminApp.tsx
- frontend/admin/src/sidebar/navigation.ts
and follow their relevant imports.

Preserve existing role-based access behavior and route compatibility.

Use current repository conventions.

After implementation:
1. run the actual applicable build/typecheck/test scripts;
2. list files changed;
3. explain route compatibility;
4. confirm API/database/public web were not changed;
5. report validation results;
6. stop.

Do not continue to Phase 2.
```
