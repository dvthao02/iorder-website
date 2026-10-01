# Content Mapping Matrix

> Source-verified mapping for the current codebase. “Hardcoded” includes fallback data and fixed editorial copy, not React/CSS implementation details.

| Feature | CMS | API | DB | Website | Hardcoded | Notes |
| --- | --- | --- | --- | --- | --- |
| Homepage | `HomepageEditor.tsx` | admin/public homepage endpoints | `pages`, `page_blocks`, `page_revisions` | `pages/Home.jsx` | Yes | CMS block payload is preferred; operating-outcomes section and many fallback strings/assets remain code. |
| Software | `OfferingsManager type=software` | `/api/admin/offerings`, `/api/public/offerings` | `offerings`, revisions | `SoftwarePage.jsx`, `SoftwareDetail.jsx`, header dropdown | Yes | Listing hero/proof copy is hardcoded; detail uses `SectionRenderer`. |
| Solutions | `OfferingsManager type=solution` | offerings endpoints | offerings, revisions | `SolutionsPage.jsx`, `SolutionDetail.jsx`, header dropdown | Yes | Listing comparison/CTA are code; detail contract is API-driven. |
| Services | `OfferingsManager type=service` | offerings endpoints | offerings, revisions | `ServicesPage.jsx`, `ServiceDetail.jsx`, header dropdown | Yes | Listing hero/card copy code-owned; detail API-driven. |
| Industries | `OfferingsManager type=industry` | offerings endpoints | offerings, revisions | `IndustryDetail.jsx`, Homepage industry block | Yes | Homepage group can be CMS block; static industry data remains fallback. |
| Devices | `SalesEquipmentManager.tsx` | `/api/admin/sales-equipment`, `/api/public/sales-equipment` | `sales_equipment`, revisions | `SalesEquipmentPage.jsx` | Page metadata/group labels in code | Product records, price, media, specs and status are API-driven; category enum currently fixes groups. |
| Resources / downloads | `DownloadsManager.tsx` | `/api/admin/downloads`, `/api/public/downloads` | `support_downloads` | `ToolsDownloadPage.jsx` | Yes | Download list dynamic; page hero/support advice fixed. |
| News | `PostsManager.tsx` | `/api/admin/posts`, `/api/public/posts` | posts, revisions, categories/tags | `NewsPage.jsx`, `NewsDetail.jsx` | Yes | API preferred, `newsArticles.js` fallback. |
| Guides | `PostsManager fixedType=guide` | posts API with `type=guide` | same post tables | `GuidesPage.jsx`, `GuideDetail.jsx` | Limited UI copy | Guide content uses post model and raw rich-text body. |
| Static pages | `ContentPagesManager.tsx` | `/api/admin/content-pages`, `/api/public/content-pages/*` | `content_pages` | `StaticPage.jsx` | Yes | CMS overrides same-path static `pages` map; body is raw HTML. |
| Media | `MediaLibrary.tsx` | `/api/admin/media` | `media_assets` + local/MinIO object storage | Referenced across web | Asset imports remain | CMS assets have metadata/usage. Local assets still back static fallbacks. |
| SEO | SEO controls in shared editor / homepage | fields embedded in feature APIs; `/sitemap.xml` and `/robots.txt` | feature columns | `utils/seo.js` on route pages | Defaults/fallbacks | No single SEO domain module; record-local fields are the source. |
| Navigation | `NavigationEditor.tsx` | `/api/admin/menus`, `/api/public/menus/:location` | menus/items/link groups | `Header.jsx` | Yes | Header has special dropdown behavior and hardcoded fallback. Footer currently uses code link columns. |
| Partners | `PartnersManager.tsx` | partners APIs | `partners` | `Home.jsx` partner strip | Yes | CMS collection preferred over historic block and local logos. |
| Testimonials | `TestimonialsManager.tsx` | testimonial APIs | `testimonials` | `Home.jsx` testimonials | Yes | CMS collection preferred over historic block and local testimonial fallback. |
| Site profile / contact | `SiteProfileEditor.tsx` in settings | `/api/admin/settings/*`, `/api/public/settings` | `site_profile`, `site_settings` | `Footer.jsx`, `useSiteContact.js`, `App.jsx` | Yes | Footer contact dynamic; footer columns and contact page copy remain static. |
| Leads | `LeadsManager.tsx` | public contact + admin leads | `contact_leads` | `ContactPage.jsx` submits | Fixed form labels | Operational data, not page content. |
| Users / activity | Users/activity UI | admin only | identity + audit logs | no public consumer | N/A | System functions, not Content Studio content. |

## Actual public endpoint consumers

| Endpoint family | Web client function | Direct consumer |
| --- | --- | --- |
| `/api/public/homepage` | `fetchHomepage` | `Home.jsx` |
| `/api/public/homepage/preview` | `fetchHomepagePreview` | `Home.jsx` in preview mode |
| `/api/public/offerings*` | `fetchOfferings`, `fetchOffering`, `fetchNavOfferings` | listing/detail pages, `Header.jsx`, `Home.jsx` |
| `/api/public/posts*` | `fetchPublishedPosts`, `fetchPublishedPost` | home/news/guides pages |
| `/api/public/sales-equipment` | `fetchSalesEquipment` | `SalesEquipmentPage.jsx` |
| `/api/public/content-pages/*` | `fetchContentPage` | `StaticPage.jsx` |
| `/api/public/downloads` | `fetchDownloads` | `ToolsDownloadPage.jsx` |
| `/api/public/partners`, `/testimonials` | respective functions | `Home.jsx` |
| `/api/public/menus/:location` | `fetchMenu` | `Header.jsx` |
| `/api/public/settings` | `fetchSiteSettings` | `App.jsx`, `useSiteContact.js` |
