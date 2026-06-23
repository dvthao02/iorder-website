import { useState, useEffect } from 'react'
import { useLocation, Link } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { ArrowRight, BookOpen, Code2, Headphones, Network, Phone, Server, ShieldCheck, Sparkles, Video } from 'lucide-react'
import { servicePages, softwareProducts, solutionPages } from '../data/siteContent'
import { setPageSeo } from '../utils/seo'
import { fetchOfferings } from '../utils/contentApi'

import logoMain from '../assets/header/logo.png'
import logoFooter from '../assets/header/logo.png'

const serviceIconMap = {
  card: BookOpen,
  code: Code2,
  headphones: Headphones,
  network: Network,
  server: Server,
  shield: ShieldCheck,
  sparkles: Sparkles,
  video: Video,
}

const staticServices = servicePages

export default function ServicesPage() {
  const [activeDropdown, setActiveDropdown] = useState(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [cmsServices, setCmsServices] = useState(null)
  const location = useLocation()

  useEffect(() => {
    fetchOfferings('service').then(setCmsServices).catch(() => {})
  }, [])

  useEffect(() => {
    setPageSeo({
      title: 'Dịch vụ CNTT iOrder',
      description: 'Dịch vụ thi công mạng, bảo trì IT, hosting website, chữ ký số, phát triển phần mềm và tư vấn chuyển đổi số.',
    })
    if (location.pathname.startsWith('/phan-mem')) setActiveDropdown('software')
    else if (location.pathname.startsWith('/giai-phap')) setActiveDropdown('solutions')
    else if (location.pathname.startsWith('/dich-vu')) setActiveDropdown('services')
    else setActiveDropdown(null)
  }, [location.pathname])

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
        servicePages={cmsServices ?? staticServices}
      />

      <main>
        <section className="listing-hero">
          <div className="container">
            <h1 className="listing-hero-title">Dịch vụ & Hỗ trợ</h1>
            <p className="listing-hero-lead">
              Dịch vụ CNTT hỗ trợ triển khai, bảo trì, website, hóa đơn điện tử và chuyển đổi số cho cửa hàng, doanh nghiệp.
            </p>
          </div>
        </section>

        <section className="listing-section soft">
          <div className="container">
            <div className="listing-grid cols-4">
              {(cmsServices ?? staticServices).map(service => {
                const Icon = serviceIconMap[service.iconKey] ?? Phone
                return (
                  <Link to={service.href} key={service.slug} className="listing-card-link">
                    <div className="listing-card">
                      <Icon size={40} className="listing-card-icon" />
                      <h3 className="listing-card-title">{service.title}</h3>
                      <p className="listing-card-desc">
                        {service.description}
                      </p>
                      <div className="listing-card-action">
                        Tìm hiểu thêm <ArrowRight size={16} />
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      </main>

      <Footer logoFooter={logoFooter} />
    </div>
  )
}
