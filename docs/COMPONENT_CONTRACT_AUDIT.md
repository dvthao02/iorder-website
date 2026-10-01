# Component Contract Audit

This report distinguishes the data contract that CMS/API must preserve from frontend implementation choices that can be redesigned safely.

| Component path | Used by | Public props / input contract | Data source | Reusable? | CMS editable? | JSX/CSS-only change safe? | Breaking changes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `components/PageLayout.jsx` | almost all public pages | `children`, `shellClassName`, `mainClassName`, `mainProps` | child page plus Header/Footer | Yes | No | Yes | Renaming/removing props or changing header/footer behavior. |
| `components/Header.jsx` | `PageLayout` | dropdown/mobile state, location, logo and optional catalog props | menus/offering APIs + fallbacks | Yes | menu labels/order partly | Yes if menu item shape `{id,label,url,children}` stays | Changing menu item shape or special URL behavior. |
| `components/Footer.jsx` | `PageLayout` | `logoFooter` | public settings for contact; code constants for links | Yes | contact only | Yes | changing `useSiteContact` field names or moving links without contract. |
| `components/ListingHero.jsx` | Solutions/Services pages | `crumb`, `kicker`, `title`, `lead`, `children`, `aside`, `className` | parent page | Yes | Parent-controlled | Yes | prop renames/type changes. |
| `components/SafeImage.jsx` | home/news/guides | standard image inputs | API media URL or static import | Yes | asset metadata/alt indirectly | Yes | changing URL/alt behavior or fallback contract. |
| `components/detail/SectionRenderer.jsx` | offering detail pages | `offering`, `type`, `backPath`, `backLabel`, `fallbackImage`, `processImage` | normalized offering DTO | High | Structured section data | Yes if `offering`/section contract stays | `sections[].type`, `variant`, `items`, `workflowSteps`, media URL fields, `type` semantics. |
| `pages/Home.jsx` | `/` | none; reads homepage response | homepage API + partners/posts/testimonials/offering APIs + static fallback | Page-specific | ten defined homepage blocks | CSS/markup of a block can change safely if fields/behavior preserved | `HomepageBlock.type`, `data` fields, appearance fields, postMessage preview payload. |
| `pages/SoftwarePage.jsx` | `/phan-mem` | none | public offering list, static fallback | Page-specific | product records only | Yes | normalized offering fields (`title`, `description`, `coverUrl`, `href`). |
| `pages/*Detail.jsx` | offering detail routes | route slug | public offering DTO, static fallback | Pattern shared | offering details | Yes | `normalizeOffering` output and `SectionRenderer` input. |
| `pages/SalesEquipmentPage.jsx` | `/thiet-bi` | none | public sales-equipment list | Page-specific | equipment record fields | Yes | category enum, `specificationGroups`, price/warranty/media field names. |
| `pages/NewsPage.jsx`, `NewsDetail.jsx` | news routes | route slug for detail | public posts, static fallback | Pattern shared | post fields | Yes | `normalizeCmsPost` fields; body HTML/text distinction. |
| `pages/GuidesPage.jsx`, `GuideDetail.jsx` | guide routes | route slug for detail | posts API type `guide` | Pattern shared | post fields | Yes | guide body HTML/checklist semantics. |
| `pages/StaticPage.jsx` | many static/support paths | current route pathname | public content page, then static map | Generic but limited | title/lead/body/SEO | CSS/markup can change with sanitization retained | raw `body` HTML, slug path mapping, static fallback key. |
| `content-editor/ContentEditorPage.tsx` | posts, offerings, content pages | layout slots (`title`, `main`, `sidebar`, actions etc.) | admin local state | High | indirectly | Yes | slot prop API; no public web contract. |
| `content-editor/PublishSidebar` | shared editor managers | status/date/actions callbacks | manager-specific API state | High | lifecycle controls | Yes | status vocabulary or callback lifecycle contract. |
| `content-editor/SeoMetaCard` | shared editor managers | children/title/description/url | manager fields | High | SEO fields | Yes | SEO field contract only. |
| `RichTextEditor.tsx` | posts, offerings, content pages | `value`, `onChange`, `placeholder`, `images` | manager form state | High | body HTML | Styling safe | changing stored Tiptap/HTML output format. |

## Field-level safe-change rule

| Change type | CMS/API impact |
| --- | --- |
| Change CSS, animation, DOM wrappers, responsive layout, or internal icon renderer | Safe when component inputs and visible semantic behavior remain stable. |
| Rename a prop used by a page but not persisted | Frontend refactor only if every local call site is updated. |
| Rename a Zod field, public API key, block/section type, variant, status, slug rule, media ID field or HTML body format | Contract change: update contracts, API serializer/service, admin form, public normalizer/renderer, migration/import compatibility and tests. |
| Add a new optional field with a safe renderer fallback | Usually additive, but must be added to the Zod schema and serializers first. |
| Add arbitrary CSS class/component name into CMS | Do not do this; it would create an unstable coupling to implementation detail. |

## Stable candidates for a future Content Studio

- `ContentEditorPage`, `ContentListPage`, `PublishSidebar`, `SeoMetaCard`, `CoverImageCard`, and media picker are reusable admin UI contracts.
- `homepageBlockSchema` and `offeringSectionSchema` are stable **structured content** contracts, but they are not interchangeable today.
- `PageLayout`, `ListingHero`, `SafeImage`, and `SectionRenderer` are reusable frontend render building blocks.
- `normalizeOffering` and `normalizeCmsPost` are adaptation boundaries; retain or replace them deliberately rather than spreading DTO assumptions into components.

## Coupling findings

1. `Home.jsx` and `SectionRenderer.jsx` are intentionally schema-aware. A general Page Builder must publish only block types that those renderers support.
2. Rich text enters public DOM through `dangerouslySetInnerHTML` in `StaticPage.jsx`, `NewsDetail.jsx`, and `GuideDetail.jsx`; body format is contract-sensitive and needs sanitation guarantees.
3. Public web is JavaScript while contracts/admin/API are TypeScript. Shared contracts prevent many backend/admin mismatches, but web normalizers are not compile-time checked against every API response.
4. The safest redesign boundary is the renderer implementation behind stable data inputs. The unsafe boundary is the persisted/public field vocabulary.
