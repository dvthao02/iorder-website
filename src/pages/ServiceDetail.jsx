import { useState, useEffect } from 'react'
import { useParams, useLocation, Link } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import StaticPage from './StaticPage'
import { CheckCircle, ArrowLeft } from 'lucide-react'
import { servicePages, softwareProducts, solutionPages } from '../data/siteContent'
import { setPageSeo } from '../utils/seo'
import { fetchOffering } from '../utils/contentApi'

import logoMain from '../assets/header/logo.png'
import logoFooter from '../assets/header/logo.png'

export default function ServiceDetail() {
  const { slug } = useParams()
  const [activeDropdown, setActiveDropdown] = useState(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [cmsService, setCmsService] = useState(null)
  const location = useLocation()

  useEffect(() => {
    fetchOffering('service', slug).then(setCmsService).catch(() => {})
  }, [slug])

  const service = cmsService ?? servicePages.find(s => s.slug === slug)

  useEffect(() => {
    setPageSeo({
      title: service ? `${service.title} - iOrder` : 'Dịch vụ iOrder',
      description: service?.description ?? 'Dịch vụ CNTT iOrder hỗ trợ triển khai, bảo trì và chuyển đổi số cho cửa hàng, doanh nghiệp.',
    })
    if (location.pathname.startsWith('/phan-mem')) setActiveDropdown('software')
    else if (location.pathname.startsWith('/giai-phap')) setActiveDropdown('solutions')
    else if (location.pathname.startsWith('/dich-vu')) setActiveDropdown('services')
    else setActiveDropdown(null)
  }, [location.pathname, service])

  if (!service) {
    return <StaticPage />
  }

  return (
    <div className="page-shell">
      <Header 
        activeDropdown={activeDropdown}
        setActiveDropdown={setActiveDropdown}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        location={location}
        logoMain={logoMain}
        softwareProducts={softwareProducts}
        solutionPages={solutionPages}
        servicePages={servicePages}
      />

      <main>
        <section className="detail-hero">
          <div className="container">
            <Link to="/dich-vu" className="detail-back-link">
              <ArrowLeft size={20} />
              Quay lại Dịch vụ
            </Link>
            <h1 className="detail-title">{service.title}</h1>
            <p className="detail-summary">
              {service.description}
            </p>
          </div>
        </section>

        <section className="detail-section">
          <div className="container">
            <h2 style={{ marginBottom: '30px' }}>Chi tiết dịch vụ</h2>
            <div className="detail-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
              {service.features.map((feature, idx) => (
                <div key={idx} className="detail-list-item">
                  <CheckCircle size={24} color="#1588e3" />
                  <p>{feature}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="detail-cta">
          <div className="container">
            <h2>Liên hệ với chúng tôi</h2>
            <p>
              Hãy nói cho chúng tôi về nhu cầu của bạn, chúng tôi sẽ cung cấp giải pháp tốt nhất.
            </p>
            <Link to="/lien-he" className="btn large primary">
              Liên hệ ngay
            </Link>
          </div>
        </section>
      </main>

      <Footer logoFooter={logoFooter} />
    </div>
  )
}
