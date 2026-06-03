import { useState, useEffect } from 'react'
import { useLocation, Link } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { Headphones, BookOpen, Video, Phone, ArrowRight } from 'lucide-react'

import logoMain from '../assets/header/logo.png'
import logoFooter from '../assets/header/logo.png'

const services = [
  {
    slug: 'tro-giup-24-7',
    title: 'Hỗ trợ 24/7',
    description: 'Đội ngũ hỗ trợ sẵn sàng giúp bạn bất cứ lúc nào',
    icon: Headphones
  },
  {
    slug: 'huong-dan-su-dung',
    title: 'Hướng dẫn Sử dụng',
    description: 'Video, tài liệu và hướng dẫn chi tiết từng bước',
    icon: BookOpen
  },
  {
    slug: 'dao-tao-online',
    title: 'Đào tạo Online',
    description: 'Khóa đào tạo chi tiết cho nhân viên',
    icon: Video
  },
  {
    slug: 'tu-van-theo-yen-cau',
    title: 'Tư vấn Theo yêu cầu',
    description: 'Tư vấn cá nhân hóa cho doanh nghiệp của bạn',
    icon: Phone
  }
]

const softwareProducts = []
const solutionPages = []

export default function ServicesPage() {
  const [activeDropdown, setActiveDropdown] = useState(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
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
        servicePages={services}
      />

      <main>
        <section className="listing-hero">
          <div className="container">
            <h1 className="listing-hero-title">Dịch vụ & Hỗ trợ</h1>
            <p className="listing-hero-lead">
              Chúng tôi cung cấp dịch vụ hỗ trợ toàn diện để đảm bảo bạn thành công
            </p>
          </div>
        </section>

        <section className="listing-section soft">
          <div className="container">
            <div className="listing-grid cols-4">
              {services.map(service => {
                const Icon = service.icon
                return (
                  <Link to={`/dich-vu/${service.slug}`} key={service.slug} className="listing-card-link">
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
