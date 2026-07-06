import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BookOpen,
  Code2,
  Headphones,
  Network,
  Phone,
  Server,
  ShieldCheck,
  Sparkles,
  Video,
} from 'lucide-react'
import PageLayout from '../components/PageLayout'
import { servicePages } from '../data/siteContent'
import { setPageSeo } from '../utils/seo'
import { fetchOfferings } from '../utils/contentApi'

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
  const [cmsServices, setCmsServices] = useState(null)

  useEffect(() => {
    fetchOfferings('service')
      .then(setCmsServices)
      .catch(() => {})
  }, [])

  useEffect(() => {
    setPageSeo({
      title: 'Dịch vụ CNTT iOrder',
      description:
        'Dịch vụ thi công mạng, bảo trì IT, hosting website, chữ ký số, phát triển phần mềm và tư vấn chuyển đổi số.',
    })
  }, [])

  return (
    <PageLayout>
      <section className="listing-hero">
        <div className="container">
          <h1 className="listing-hero-title">Dịch vụ & Hỗ trợ</h1>
          <p className="listing-hero-lead">
            Dịch vụ CNTT hỗ trợ triển khai, bảo trì, website, hóa đơn điện tử và chuyển đổi số cho cửa hàng, doanh
            nghiệp.
          </p>
        </div>
      </section>

      <section className="listing-section soft">
        <div className="container">
          <div className="listing-grid cols-4">
            {(cmsServices ?? staticServices).map((service) => {
              const Icon = serviceIconMap[service.iconKey] ?? Phone
              return (
                <Link to={service.href} key={service.slug} className="listing-card-link">
                  <div className="listing-card">
                    <Icon size={40} className="listing-card-icon" />
                    <h3 className="listing-card-title">{service.title}</h3>
                    <p className="listing-card-desc">{service.description}</p>
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
    </PageLayout>
  )
}
