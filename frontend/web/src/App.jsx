import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { fetchSiteSettings } from './utils/contentApi'

function useAppearance() {
  useEffect(() => {
    fetchSiteSettings()
      .then((data) => {
        const a = data?.appearance
        if (!a) return
        const root = document.documentElement
        if (a.primaryColor) root.style.setProperty('--primary', a.primaryColor)
        if (a.accentColor) root.style.setProperty('--accent-3', a.accentColor)
        if (a.darkMode) root.setAttribute('data-theme', 'dark')
        else root.removeAttribute('data-theme')
      })
      .catch(() => undefined)
  }, [])
}
// Tách từng route thành chunk riêng: khách truy cập chỉ tải UI của trang họ mở.
// Các template vẫn giữ nguyên; đây chỉ là tối ưu tải trang đầu.
const Home = lazy(() => import('./pages/Home'))
const SoftwarePage = lazy(() => import('./pages/SoftwarePage'))
const SoftwareDetail = lazy(() => import('./pages/SoftwareDetail'))
const SolutionsPage = lazy(() => import('./pages/SolutionsPage'))
const SolutionDetail = lazy(() => import('./pages/SolutionDetail'))
const IndustryDetail = lazy(() => import('./pages/IndustryDetail'))
const ServicesPage = lazy(() => import('./pages/ServicesPage'))
const ServiceDetail = lazy(() => import('./pages/ServiceDetail'))
const NewsPage = lazy(() => import('./pages/NewsPage'))
const NewsDetail = lazy(() => import('./pages/NewsDetail'))
const ContactPage = lazy(() => import('./pages/ContactPage'))
const GuideDetail = lazy(() => import('./pages/GuideDetail'))
const GuidesPage = lazy(() => import('./pages/GuidesPage'))
const ToolsDownloadPage = lazy(() => import('./pages/ToolsDownloadPage'))
const SalesEquipmentPage = lazy(() => import('./pages/SalesEquipmentPage'))
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'))
const StaticPage = lazy(() => import('./pages/StaticPage'))
const NotFound = lazy(() => import('./pages/NotFound'))

function RouteLoading() {
  return (
    <div className="route-loading" role="status" aria-live="polite">
      <span className="route-loading-spinner" aria-hidden="true" />
      <span>Đang tải trang…</span>
    </div>
  )
}

export default function App() {
  useAppearance()
  return (
    <Suspense fallback={<RouteLoading />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/phan-mem" element={<SoftwarePage />} />
        <Route path="/phan-mem/:slug" element={<SoftwareDetail />} />
        <Route path="/giai-phap" element={<SolutionsPage />} />
        <Route path="/giai-phap/phan-mem" element={<StaticPage />} />
        <Route path="/giai-phap/ha-tang" element={<StaticPage />} />
        <Route path="/giai-phap/dich-vu-cntt" element={<StaticPage />} />
        <Route path="/giai-phap/:slug" element={<SolutionDetail />} />
        <Route path="/nganh-hang/:slug" element={<IndustryDetail />} />
        <Route path="/giai-phap/:section/:slug" element={<SolutionDetail />} />
        <Route path="/dich-vu" element={<ServicesPage />} />
        <Route path="/dich-vu/dich-vu-cntt" element={<StaticPage />} />
        <Route path="/dich-vu/:slug" element={<ServiceDetail />} />
        <Route path="/dich-vu/:section/:slug" element={<ServiceDetail />} />
        <Route path="/ho-tro/cai-dat" element={<ToolsDownloadPage />} />
        <Route path="/thiet-bi" element={<SalesEquipmentPage />} />
        <Route path="/ho-tro/:slug" element={<StaticPage />} />
        <Route path="/huong-dan" element={<GuidesPage />} />
        <Route path="/huong-dan/:slug" element={<GuideDetail />} />
        {/* /faq trùng nội dung với /ho-tro/faq — hợp nhất về một URL để tránh trùng lặp nội dung (SEO) */}
        <Route path="/faq" element={<Navigate to="/ho-tro/faq" replace />} />
        <Route path="/ho-tro-tu-xa" element={<StaticPage />} />
        <Route path="/gioi-thieu" element={<StaticPage />} />
        <Route path="/terms" element={<StaticPage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/tin-tuc" element={<NewsPage />} />
        <Route path="/tin-tuc/:slug" element={<NewsDetail />} />
        <Route path="/lien-he" element={<ContactPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}
