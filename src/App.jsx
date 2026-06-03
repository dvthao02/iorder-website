import { Routes, Route } from 'react-router-dom'
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
import ToolsDownloadPage from './pages/ToolsDownloadPage'
import StaticPage from './pages/StaticPage'


export default function App() {
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
      <Route path="/giai-phap/:section/:slug" element={<StaticPage />} />
      <Route path="/dich-vu" element={<ServicesPage />} />
      <Route path="/dich-vu/dich-vu-cntt" element={<StaticPage />} />
      <Route path="/dich-vu/:slug" element={<ServiceDetail />} />
      <Route path="/dich-vu/:section/:slug" element={<StaticPage />} />
      <Route path="/ho-tro/cai-dat" element={<ToolsDownloadPage />} />
      <Route path="/ho-tro/:slug" element={<StaticPage />} />
      <Route path="/huong-dan" element={<StaticPage />} />
      <Route path="/faq" element={<StaticPage />} />
      <Route path="/ho-tro-tu-xa" element={<StaticPage />} />
      <Route path="/gioi-thieu" element={<StaticPage />} />
      <Route path="/terms" element={<StaticPage />} />
      <Route path="/tin-tuc" element={<NewsPage />} />
      <Route path="/tin-tuc/:slug" element={<NewsDetail />} />
      <Route path="/lien-he" element={<ContactPage />} />
      <Route path="*" element={<StaticPage />} />
    </Routes>
  )
}
