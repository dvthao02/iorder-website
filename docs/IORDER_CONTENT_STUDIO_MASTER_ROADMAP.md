# IORDER CONTENT STUDIO — MASTER IMPLEMENTATION ROADMAP

> **Purpose:** This document is the master execution guide for all AI coding agents working on the iOrder repository.
>
> **Important:** Read this file **before making any implementation change**.
>
> This document defines the target direction, architectural boundaries, implementation phases, and stop conditions.
>
> **Do not implement all phases automatically.**
>
> The AI must wait for an explicit instruction such as:
>
> `Implement Phase 0`
>
> `Implement Phase 1`
>
> `Continue Phase 2`
>
> Only the explicitly requested phase may be implemented.

---

# 0. EXECUTION RULES FOR AI

## 0.1 Mandatory behavior

Before coding, the AI must read:

1. `CURRENT_ARCHITECTURE_AUDIT.md`
2. `CONTENT_MAPPING_MATRIX.md`
3. `COMPONENT_CONTRACT_AUDIT.md`
4. This document

If these files are stored under `docs/`, use the corresponding `docs/...` paths.

The architecture audit is the source of truth for the **current system**.

This roadmap is the source of truth for the **target direction and implementation order**.

Do not replace source-verified architecture with assumptions from common frameworks or previous prompts.

---

## 0.2 Do not assume the stack

The audited repository currently uses:

```text
pnpm workspace monorepo

frontend/web       React 19 + Vite
frontend/admin     React 19 + Vite

backend/api        Fastify 5 REST API
backend/contracts  Zod schemas + inferred TypeScript contracts
backend/database   Drizzle ORM + PostgreSQL

deploy             Docker / Docker Compose
storage            Local storage / MinIO
```

There is currently:

```text
NO Next.js requirement
NO NestJS requirement
NO Prisma
NO schema.prisma
```

Do not introduce those technologies unless a future explicit requirement changes the architecture.

---

## 0.3 Core rule

The project must evolve incrementally.

Do not rewrite the CMS.

Do not rewrite the backend.

Do not replace the database architecture.

Do not perform large destructive migrations.

Do not remove legacy rendering before the replacement path has been proven.

The intended direction is:

```text
Existing CMS
      ↓
Content Studio UX
      ↓
Structured Content + Presentation Config
      ↓
Existing / Extended API
      ↓
Stable Content Contracts
      ↓
Public Renderer
      ↓
React Components
```

---

## 0.4 Phase isolation

When asked to implement a phase:

1. Inspect the relevant source again.
2. Compare source with the audit.
3. State any material mismatch discovered.
4. Implement only that phase.
5. Run relevant tests/build/type checks.
6. Report files changed.
7. Report remaining known issues.
8. Stop.

Do not silently continue into the next phase.

Example:

If instructed:

```text
Implement Phase 1
```

then do **not** also implement:

```text
Phase 2 Editor framework
Phase 3 Preview architecture
Phase 4 Equipment migration
```

even if they seem closely related.

---

## 0.5 Database rule

Database migration is not allowed unless the current phase explicitly requires one and the user explicitly approves it.

Before any migration:

- inspect current Drizzle schema;
- reuse existing tables where possible;
- explain why existing schema is insufficient;
- describe backward compatibility;
- describe data migration;
- describe rollback risk.

Never create a new table merely because the admin UI is being redesigned.

---

# 1. PRODUCT GOAL

The final goal is to transform the current CMS into a **Visual Content Studio**.

The CMS should allow non-technical users such as Marketing, Sales, and management to control most website content and common presentation options without modifying frontend source code.

The target experience is:

```text
Content Studio
     ↓
Choose a page/content item
     ↓
Navigator
     ↓
Live Preview
     ↓
Inspector
     ↓
Edit content / media / layout / style
     ↓
Preview desktop / tablet / mobile
     ↓
Save Draft
     ↓
Publish
```

This is **not** intended to become Elementor, Webflow Designer, Canva, or a pixel-positioned free-form editor.

The goal is:

```text
Structured Content
+
Reusable Components
+
Schema-driven Inspector
+
Design Tokens
+
Draft / Preview / Publish
```

---

# 2. ARCHITECTURAL PRINCIPLES

## 2.1 Separate three concerns

Always distinguish:

```text
DOMAIN DATA
CONTENT DATA
PRESENTATION CONFIG
```

Example for a sales device:

### Domain data

```text
name
sku
price
warranty
category
specifications
```

### Content data

```text
marketing description
gallery
selling points
CTA copy
SEO copy
```

### Presentation config

```text
layout variant
section order
spacing
background
alignment
responsive options
```

Do not merge these into one generic JSON object.

---

## 2.2 CMS must not store frontend implementation details

Do not store:

```text
React component source
JSX
arbitrary JavaScript
eval expressions
internal CSS class names
frontend file paths
raw React component names
pixel X/Y positioning
```

Avoid arbitrary custom CSS as a normal editing mechanism.

If advanced CSS is ever introduced, it must be explicitly scoped, validated, permission-controlled, and treated as an exceptional feature.

---

## 2.3 Stable contract boundary

Frontend implementation may change freely when persisted/public contracts remain stable.

Normally safe:

```text
CSS
animation
DOM wrappers
JSX hierarchy
responsive implementation
internal icon rendering
performance improvements
accessibility improvements
```

Contract-sensitive:

```text
Zod field names
API keys
block.type
section.type
variant values
status values
slug rules
media-reference fields
rich-text body format
public DTO structure
```

Changing contract-sensitive fields is a schema/API compatibility change, not merely a frontend redesign.

---

## 2.4 Registry over giant switch statements

The long-term renderer direction should favor a registry:

```ts
sectionRegistry = {
  hero: ...,
  faq: ...,
  deviceGrid: ...,
  cta: ...
}
```

rather than an ever-growing hardcoded conditional tree.

However, do not force existing Homepage and Offering contracts into one universal schema prematurely.

---

# 3. CURRENT SYSTEM TO PRESERVE

The audited repository already has strong foundations.

Preserve and reuse where possible:

```text
@iorder/contracts
Zod validation
Fastify routes/services/repositories
Drizzle/PostgreSQL
UUID-based identifiers
session authentication
audit logs
media library
MinIO/local storage
existing content APIs
revision models
homepage preview pattern
ContentEditorPage
ContentListPage
PublishSidebar
SeoMetaCard
CoverImageCard
CategoryTagSelector
RichTextEditor
ImagePicker / Media Library
```

Do not rewrite working infrastructure merely to make the new UI look cleaner.

---

# 4. CURRENT IMPORTANT LIMITATIONS

The implementation roadmap exists because the current system has several known boundaries.

## 4.1 Homepage is structured but not a generic Page Builder

Homepage currently uses a fixed catalogue of block types.

Its renderer and contract are intentionally coupled.

Do not treat this as a universal builder yet.

---

## 4.2 Homepage and Offering use different section vocabularies

Current structured content includes at least two proven systems:

```text
homepageBlockSchema
offeringSectionSchema
```

They are useful but not currently interchangeable.

Do not merge them by changing database payloads during an early phase.

Adapters are preferred during migration.

---

## 4.3 Preview behavior is inconsistent

Homepage currently has the strongest draft-preview flow.

Other content types do not all have equivalent protected draft preview behavior.

A common preview capability will be introduced before broad Visual Editing.

---

## 4.4 Revision/lifecycle behavior is inconsistent

Different modules currently support different combinations of:

```text
draft
review
scheduled
published
archived
revision
restore
preview
```

The UI must not pretend all modules support the same lifecycle until the backend actually supports it.

---

## 4.5 Hardcoded editorial content still exists

Several public pages still combine CMS/API data with frontend-owned marketing copy and fallback content.

Therefore the system must not claim that all visible website content is CMS-controlled until those surfaces are migrated.

---

## 4.6 Rich text is a special content boundary

Some pages render stored rich text / HTML.

Do not convert this into an unrestricted `customHtml` Page Builder block.

Sanitization and stored body-format compatibility must remain explicit.

---

## 4.7 Multilingual is not currently implemented as a real content model

Do not add a fake language switcher before the repository has a defined locale storage, routing, API, and fallback model.

Multilingual work belongs to a later explicit phase.

---

# 5. TARGET ADMIN INFORMATION ARCHITECTURE

The long-term Content Studio should present the website from an editorial perspective rather than database-table perspective.

Conceptual navigation:

```text
CONTENT STUDIO

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
├── Redirects
└── SEO-related settings

Leads
└── Contact Leads

Configuration
├── Website Settings
├── Appearance
├── Users
└── Activity
```

The exact menu labels may evolve, but the underlying modules should continue using existing APIs unless a later phase explicitly changes them.

---

# 6. TARGET EDITOR UX

The common editing experience should converge toward:

```text
┌──────────────┬───────────────────────────┬───────────────────┐
│ Navigator    │ Preview                   │ Inspector         │
│              │                           │                   │
│ Structure    │ Desktop                   │ Content           │
│ Sections     │ Tablet                    │ Media             │
│ Items        │ Mobile                    │ Layout            │
│              │                           │ Style             │
│              │                           │ Responsive        │
│              │                           │ SEO               │
│              │                           │ Advanced          │
└──────────────┴───────────────────────────┴───────────────────┘
```

The editor should not present a 100-field CRUD form when a smaller contextual inspector is possible.

Typical Navigator actions:

```text
select
reorder
duplicate
hide/show
delete
rename internal label
```

Typical Preview actions:

```text
desktop
tablet
mobile
draft
published
refresh
open full preview
```

Typical Inspector groups:

```text
Content
Media
Layout
Style
Responsive
SEO
Advanced
```

---

# 7. IMPLEMENTATION PHASES

---

# PHASE 0 — BASELINE & CONTRACT STABILITY

## Goal

Make the current architecture safe enough to extend without introducing a Page Builder yet.

## Primary work

### 0.1 Verify and fix known contract drift

Known audit example:

```text
public settings appearance
```

Ensure actual backend responses and Zod response contracts agree.

### 0.2 Establish baseline automated checks

Add or improve tests for critical contracts where coverage is missing.

Focus on:

```text
homepageBlockSchema
offeringSectionSchema
sales equipment contracts
post contracts
media contracts
settings contracts
```

### 0.3 Record protected contract vocabulary

Make it clear in code/tests that the following are compatibility-sensitive:

```text
block.type
section.type
variant
status
slug
media IDs
rich-text format
public API fields
```

## Must not do

```text
No general Page Builder
No database redesign
No Homepage migration
No Equipment visual editor migration
No universal registry migration
```

## Exit criteria

- Current builds/tests pass.
- Known contract drift addressed.
- Critical public/admin contracts have a reliable baseline.
- No public rendering behavior is intentionally changed.

## Stop condition

After Phase 0, report the result and stop.

Do not proceed to Phase 1 without explicit instruction.

---

# PHASE 1 — CONTENT STUDIO SHELL

## Goal

Change the admin information architecture without changing content data architecture.

## Primary work

- Reorganize sidebar/navigation into Content Studio terminology.
- Preserve existing managers and routes where reasonable.
- Add compatibility redirects/aliases only if needed.
- Improve breadcrumbs/page titles.
- Remove database-centric wording from normal editor navigation.

## Examples of reuse

```text
Software  → existing OfferingsManager(type=software)
Solutions → existing OfferingsManager(type=solution)
Services  → existing OfferingsManager(type=service)
Industries→ existing OfferingsManager(type=industry)
```

## Must not do

```text
No DB migration
No Page Builder
No generic Section Registry migration
No homepage renderer rewrite
No equipment domain rewrite
```

## Exit criteria

A non-technical editor can find website content by website concept rather than by database entity.

Existing API and public website behavior remain unchanged.

## Stop condition

Stop after Phase 1.

---

# PHASE 2 — CONTENT EDITOR FRAMEWORK V2

## Goal

Create a reusable editor shell suitable for visual editing while preserving module-specific content behavior.

## Primary work

Extend existing editor primitives rather than replacing them.

Target shell:

```text
Navigator | Preview | Inspector
```

Develop reusable layout primitives and module capability interfaces.

Possible abstractions:

```text
ContentStudioEditor
EditorNavigator
EditorPreview
EditorInspector
EditorToolbar
```

Names are illustrative; inspect existing naming conventions before creating files.

## Important

The framework must support module-specific behavior.

Do not assume every editor has reorderable sections.

Example:

- Post editor may not need a Section Navigator.
- Equipment may use a field/group navigator.
- Homepage may use section navigation.

## Exit criteria

At least two different content modules can use the common shell without duplicating the whole editor layout.

Public renderer contracts remain unchanged.

## Stop condition

Stop after Phase 2.

---

# PHASE 3 — COMMON DRAFT / PREVIEW / PUBLISH / REVISION CAPABILITY

## Goal

Standardize how the admin understands content lifecycle capabilities.

## Primary work

Define explicit capabilities such as:

```ts
type ContentCapabilities = {
  draft: boolean
  preview: boolean
  revision: boolean
  scheduling: boolean
  publish: boolean
  archive: boolean
}
```

The exact implementation may differ after source inspection.

Use capability-driven UI rather than showing unavailable actions.

## Preview direction

Prefer a protected draft-preview flow inspired by the working Homepage implementation:

```text
CMS
↓
request preview
↓
preview token/session
↓
public preview route/iframe
↓
draft API response
↓
real frontend renderer
```

Do not publish a draft merely so an editor can preview it.

## Revision direction

Do not fake revisions for modules that lack real revision support.

Either:

- implement the required backend revision capability in this phase for the selected first modules; or
- represent the capability as unavailable.

## Exit criteria

The first selected modules expose consistent Save / Preview / Publish behavior based on their actual backend capabilities.

## Stop condition

Stop after Phase 3.

---

# PHASE 4 — SALES EQUIPMENT REFERENCE IMPLEMENTATION

## Goal

Use Devices / Sales Equipment as the first complete Content Studio reference module.

## Why this module

It already has structured domain data, media, specifications, status, and revisions.

It is complex enough to prove the editor architecture without forcing Homepage migration.

## Keep existing domain model

Do not introduce duplicate concepts such as:

```text
BuilderDevice
CmsDeviceV2
VisualEquipment
```

Reuse existing:

```text
sales_equipment
sales_equipment_revisions
admin/public sales-equipment APIs
```

unless source inspection proves a small extension is required.

## Target editor experience

Conceptually:

```text
Devices
  ↓
Device list
  ↓
Device editor

Navigator / groups
├── General
├── Media
├── Price
├── Specifications
├── SEO
└── Publish

Center
└── Real device preview

Inspector
└── Contextual fields
```

## Presentation

Only after content editing is stable, introduce bounded presentation choices such as predefined variants.

Examples:

```text
Default
Technical
Marketing
Compact
```

Do not introduce free-form CSS.

## Exit criteria

An editor can:

```text
edit a device
preview draft
review real frontend rendering
publish
inspect revisions if supported
```

without editing source code.

## Stop condition

Stop after Phase 4 and treat the module as the reference implementation for later modules.

---

# PHASE 5 — COMPONENT REGISTRY & SCHEMA-DRIVEN INSPECTOR

## Goal

Introduce the reusable infrastructure required for structured page sections.

## Important prerequisite

Do this only after the reference editor proves the desired UX.

Do not design the registry solely from hypothetical future components.

## Registry responsibility

A section definition may describe:

```text
type
label
category
default props
content schema
layout schema
style schema
responsive schema
validation
renderer
editor overrides if necessary
```

Conceptual example:

```ts
sectionRegistry = {
  hero: {
    schema,
    defaults,
    renderer
  },

  faq: {
    schema,
    defaults,
    renderer
  }
}
```

## Schema-driven Inspector

Simple fields should be described by schema/metadata.

Conceptual:

```ts
title: {
  type: "string",
  group: "content",
  control: "text"
}

background: {
  type: "color",
  group: "style",
  control: "colorPicker"
}
```

Do not create a fully custom React editor for every simple field.

Custom editors remain allowed for genuinely complex sections.

## Compatibility

Existing Homepage and Offering structured contracts may initially enter the registry through adapters.

Do not force immediate DB migration.

## Exit criteria

The system can register a bounded component and obtain:

```text
validation
editor controls
renderer resolution
defaults
```

from one coherent definition or coordinated registry structure.

## Stop condition

Stop after Phase 5.

---

# PHASE 6 — HOMEPAGE VISUAL PAGE BUILDER MIGRATION

## Goal

Turn Homepage from a fixed structured editor into the first real page-builder surface.

## Migration strategy

Do not rewrite Homepage in one operation.

### Step A

Register/adapt current Homepage block types.

### Step B

Gradually replace hardcoded block rendering with registry-based resolution where appropriate.

### Step C

Support:

```text
select
reorder
add
duplicate
hide
delete
```

only for registered supported sections.

### Step D

Convert currently visible Homepage editorial sections that remain code-owned into proper managed sections.

### Step E

Keep backward compatibility while migration is incomplete.

## Important

Fallback content must not be deleted until:

- the CMS has authoritative data;
- production data is verified;
- public rendering has safe empty/error behavior.

## Exit criteria

Homepage can be managed visually through registered structured sections while old published data remains renderable.

## Stop condition

Stop after Phase 6.

---

# PHASE 7 — MIGRATE OTHER CONTENT SURFACES

## Goal

Apply proven patterns to remaining website content.

Recommended order:

```text
Software
Solutions
Services
Industries
News
Guides
Static Content Pages
Downloads
```

The actual sequence may be adjusted after user instruction.

---

## 7.1 Offerings

Current offering details already use structured sections and `SectionRenderer`.

Prefer adapting the existing Offering contract to the Registry rather than rewriting Offering storage.

Do not merge Offering and Homepage JSON payloads merely for architectural purity.

---

## 7.2 News & Guides

Rich-text article body remains a valid content model.

Do not make every article a Page Builder page by default.

Possible future model:

```text
Article metadata
+
Rich-text body
+
Optional structured sections
```

but this should be an explicit decision, not an automatic migration.

---

## 7.3 Static Pages

Before expanding generic structured pages, confirm rich-text sanitation/version behavior.

Stored HTML must remain a deliberate content contract.

---

## Exit criteria

Selected migrated modules use the common editor/preview infrastructure without breaking their domain-specific data models.

## Stop condition

Stop after each explicitly requested sub-phase/module.

Do not migrate all modules in one uncontrolled change.

---

# PHASE 8 — GLOBAL WEBSITE PRESENTATION SYSTEM

## Goal

Move remaining shared website presentation controls into safe CMS configuration.

Includes:

```text
Global Theme
Navigation
Header
Footer
Reusable Sections
Section Templates
Page Templates
```

---

## 8.1 Global Theme

Use design tokens.

Good:

```json
{
  "spacing": "lg",
  "radius": "md",
  "container": "xl"
}
```

Avoid normal-editor values such as:

```json
{
  "padding": "83.7px"
}
```

Possible theme controls:

```text
brand colors
background colors
typography
container width
spacing scale
radius scale
button styles
default section spacing
```

---

## 8.2 Navigation

Make CMS navigation increasingly authoritative.

Retain safe fallback behavior for API failure if required.

Remove special frontend-only menu insertion logic only after equivalent CMS configuration exists.

---

## 8.3 Header & Footer

Use predefined supported layouts.

CMS should control content and safe options, not arbitrary HTML.

---

## 8.4 Reusable Sections

Support concepts such as:

```text
Linked reusable section
Copied section
```

Linked:

```text
edit once → all usages update
```

Copied:

```text
create independent copy
```

This requires careful reference/version semantics and must not be improvised as raw shared JSON.

---

## 8.5 Templates

Support:

```text
Section Templates
Page Templates
```

Templates should instantiate valid registered structures.

They are not separate frontend implementations.

---

## Exit criteria

Most ordinary website editorial/presentation changes can be performed from Content Studio without source changes.

---

# 8. MULTILINGUAL — FUTURE EXPLICIT PHASE

Multilingual is intentionally excluded from the early implementation phases.

Before implementing language UI, define:

```text
supported locales
URL routing
locale fallback policy
translation storage model
localized slug behavior
SEO hreflang
localized navigation
API locale semantics
published/draft translation lifecycle
```

Do not spread fields such as:

```text
titleVi
titleEn
titleJa
```

through arbitrary tables without an approved language architecture.

Wait for explicit instruction before implementing multilingual.

---

# 9. DESIGN SYSTEM RULES

The CMS should permit broad customization without making the website visually unstable.

Prefer constrained options.

Examples:

## Spacing

```text
none
xs
sm
md
lg
xl
2xl
```

## Container

```text
sm
md
lg
xl
full
```

## Radius

```text
none
sm
md
lg
xl
full
```

## Typography

```text
display
h1
h2
h3
h4
bodyLarge
body
bodySmall
caption
```

Advanced arbitrary values, if ever allowed, should require appropriate permission.

---

# 10. PUBLIC RENDERER RULES

The public website must remain lightweight.

Do not ship CMS editor code into the public bundle unnecessarily.

Target conceptual flow:

```text
Page / Domain record
↓
validated published structured data
↓
renderer/registry
↓
React component
```

Dynamic sections should use controlled data-source definitions.

Do not expose:

```text
SQL
database queries
raw repository expressions
arbitrary API URLs
```

to normal CMS editors.

---

# 11. DYNAMIC DATA BLOCK RULES

Future registered blocks may reference structured collections.

Examples:

```text
LatestArticles
FeaturedProducts
DeviceCategory
FeaturedSolutions
Testimonials
FAQByCategory
DownloadList
```

A safe CMS configuration may include:

```text
source
filter
sort
limit
layout
```

Example:

```text
Source: Sales Equipment
Category: POS
Published: true
Sort: featured
Limit: 8
Layout: grid-4
```

Domain data stays in its authoritative table.

Do not duplicate full product/article data into Page Builder section JSON.

---

# 12. FORM BUILDER — FUTURE FEATURE

A future CMS form builder may support bounded field types such as:

```text
text
email
phone
textarea
select
checkbox
radio
consent
hidden
submit
```

Form submissions must still be validated and handled by backend logic.

Never execute arbitrary JavaScript configured from CMS.

This feature requires explicit instruction and is not part of early phases.

---

# 13. PERMISSIONS

Frontend hiding is not sufficient security.

Any sensitive capability must also be enforced by backend authorization.

Possible long-term role behavior:

```text
Editor
- content
- media

Marketing Admin
- content
- media
- layout
- SEO
- publish

Administrator
- theme
- advanced settings
- navigation
- users
- permissions
```

Use current auth architecture as the base.

Do not redesign authentication during normal Content Studio work.

---

# 14. PERFORMANCE RULES

Content Studio must not degrade the public website.

Preserve:

```text
public/editor bundle separation
published-data caching where appropriate
image optimization
safe lazy loading
controlled dynamic-data queries
cache invalidation after publish
```

Avoid N+1 query patterns for dynamic sections.

Do not require a full-site rebuild for a normal text edit unless deployment architecture explicitly requires it.

---

# 15. BACKWARD COMPATIBILITY

Migration must be incremental.

When old and new render models coexist, use explicit compatibility behavior.

Conceptual:

```text
new structured content available
→ new renderer

legacy content only
→ legacy renderer
```

Do not bulk-convert production content without inspection and rollback strategy.

Existing public URLs/slugs should remain stable unless an explicit URL migration is approved.

---

# 16. HARDCODED CONTENT MIGRATION POLICY

Hardcoded editorial content should be migrated page-by-page.

Classify each item:

```text
MUST MIGRATE
SHOULD MIGRATE
CAN STAY IN CODE
```

Typical **must migrate**:

```text
marketing headings
hero descriptions
CTA labels
support copy
visible editorial sections
footer editorial link groups when CMS is authoritative
```

Typical **can stay in code**:

```text
React implementation
icon mapping
CSS implementation
animation behavior
responsive breakpoints
API internals
auth logic
storage drivers
fallback mechanisms
```

Do not confuse implementation configuration with editorial content.

---

# 17. RICH TEXT SAFETY

Where the public site renders stored HTML:

- preserve sanitization guarantees;
- preserve body-format compatibility;
- avoid arbitrary script/style injection;
- test existing published content;
- do not silently change editor output format.

Any migration from HTML to another rich-text representation must be treated as a dedicated compatibility project.

---

# 18. REQUIRED AI REPORT AFTER EACH PHASE

After implementing a requested phase, provide:

## Completed

What was implemented.

## Files changed

List the important paths.

## Architecture impact

State whether the change affected:

```text
Admin only
Contracts
API
Database
Public website
```

## Database changes

Explicitly say:

```text
No database migration
```

when none was performed.

## Compatibility

Explain how old data/routes/renderers remain compatible.

## Validation

Report the relevant commands run, such as:

```text
pnpm test
pnpm build
pnpm typecheck
```

Use actual repository scripts, not assumed commands.

## Known limitations

List only real remaining issues.

## Next phase

State which phase is next, but:

**DO NOT IMPLEMENT IT.**

Then stop.

---

# 19. PROHIBITED BEHAVIOR FOR AI

Unless explicitly instructed otherwise, do not:

```text
rewrite the CMS
rewrite the public web app
replace Fastify
replace Drizzle
introduce Prisma
introduce NestJS
introduce Next.js as a migration
create a second product/content database model
rename public API fields casually
change block.type casually
change section.type casually
change persisted variant values casually
remove fallbacks prematurely
remove legacy renderers prematurely
store JSX in database
store React component source
use eval
allow arbitrary JavaScript from CMS
create unrestricted custom HTML page blocks
create pixel-positioned drag/drop layout
build multilingual UI without language architecture
implement several roadmap phases in one request
```

---

# 20. DECISION PRIORITY

When implementation choices conflict, use this order:

1. Protect current published website.
2. Protect persisted data.
3. Preserve public/API contract compatibility.
4. Reuse existing architecture.
5. Improve editorial UX.
6. Reduce duplication.
7. Introduce abstractions only when proven useful.

Do not sacrifice production stability merely for architectural elegance.

---

# 21. ROADMAP SUMMARY

```text
PHASE 0
Baseline & Contract Stability

        ↓

PHASE 1
Content Studio Shell

        ↓

PHASE 2
Content Editor Framework V2
Navigator | Preview | Inspector

        ↓

PHASE 3
Draft / Preview / Publish / Revision Capability

        ↓

PHASE 4
Sales Equipment Reference Implementation

        ↓

PHASE 5
Component Registry + Schema-driven Inspector

        ↓

PHASE 6
Homepage Visual Page Builder

        ↓

PHASE 7
Software / Solutions / Services / Industries
News / Guides / Static Pages / Downloads

        ↓

PHASE 8
Theme / Navigation / Header / Footer
Reusable Sections / Templates

        ↓

FUTURE EXPLICIT PHASE
Multilingual / advanced capabilities
```

---

# 22. MILESTONES

## Milestone A — CMS foundation

```text
Phase 0
Phase 1
Phase 2
```

Outcome:

```text
Stable contracts
Content Studio navigation
Reusable modern editor shell
```

---

## Milestone B — Reference module

```text
Phase 3
Phase 4
```

Outcome:

```text
Real draft preview/publish workflow
Sales Equipment working as reference implementation
```

---

## Milestone C — Page Builder foundation

```text
Phase 5
Phase 6
```

Outcome:

```text
Component Registry
Schema-driven Inspector
Homepage visual editing
```

---

## Milestone D — Website-wide adoption

```text
Phase 7
Phase 8
```

Outcome:

```text
Most public marketing surfaces manageable through Content Studio
without routine frontend code changes
```

---

# 23. FINAL TARGET

The desired final responsibility boundary is:

```text
CMS
controls
↓
content
media
SEO
safe presentation options
section composition
publish lifecycle

────────────────────────────────

Frontend
controls
↓
React implementation
CSS implementation
animation
accessibility
responsive internals
performance
complex interaction logic

────────────────────────────────

Backend
controls
↓
validation
authorization
persistence
revision
publishing
preview security
domain logic
```

A frontend developer should normally be able to redesign the internal JSX/CSS of a registered component without migrating CMS data, provided the component's content contract remains compatible.

A Marketing user should normally be able to update existing website content and supported presentation options without modifying code.

New application behavior or a completely new interactive feature may still require a developer to create and register a new component.

That is intentional.

---

# 24. STARTING INSTRUCTION FOR AI

After reading this document and the audit documents:

1. Do not begin implementation automatically.
2. Summarize the current requested phase only if asked.
3. Wait for an explicit phase instruction.
4. When instructed, implement only that phase.
5. Stop after reporting completion.

Example valid user command:

```text
Read the master roadmap and audit files.
Implement Phase 1 only.
Do not continue to Phase 2.
```

---

# 25. SOURCE-OF-TRUTH ORDER

If documents disagree:

### Current implementation facts

Use:

```text
source code
↓
CURRENT_ARCHITECTURE_AUDIT.md
↓
CONTENT_MAPPING_MATRIX.md
↓
COMPONENT_CONTRACT_AUDIT.md
```

### Target implementation direction

Use:

```text
this MASTER IMPLEMENTATION ROADMAP
↓
explicit user instruction for the current phase
```

The newest explicit user instruction has priority over the roadmap for intentional scope changes.

Never silently reconcile a conflict by guessing.

Document the conflict and keep the implementation inside the explicitly approved scope.
