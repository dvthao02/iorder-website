import { useEffect } from 'react'
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
import Home from './pages/Home'
import SoftwarePage from './pages/SoftwarePage'
import SoftwareDetail from './pages/SoftwareDetail'
import SolutionsPage from './pages/SolutionsPage'
import SolutionDetail from './pages/SolutionDetail'
import IndustryDetail from './pages/IndustryDetail'
import ServicesPage from './pages/ServicesPage'
import ServiceDetail from './pages/ServiceDetail'
import NewsPage from './pages/NewsPage'
import NewsDetail from './pages/NewsDetail'
import ContactPage from './pages/ContactPage'
import GuideDetail from './pages/GuideDetail'
import GuidesPage from './pages/GuidesPage'
import ToolsDownloadPage from './pages/ToolsDownloadPage'
import PrivacyPolicyPage from './pages/PrivacyPolicyPage'
import StaticPage from './pages/StaticPage'
import NotFound from './pages/NotFound'

export default function App() {
  useAppearance()
  return (
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
  )
}
