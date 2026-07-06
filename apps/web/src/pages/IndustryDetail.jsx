import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CheckCircle, Printer, ScanBarcode, Smartphone, Wifi } from 'lucide-react'
import PageLayout from '../components/PageLayout'
import StaticPage from './StaticPage'
import { findIndustrySolution, industrySolutions } from '../data/industrySolutions'
import { setPageSeo } from '../utils/seo'
import { fetchOffering } from '../utils/contentApi'

import posHero from '../assets/products/pos.jpg'

const hardwarePoints = [
  { icon: ScanBarcode, title: 'Mã vạch & tìm kiếm nhanh', desc: 'Hỗ trợ quét mã, tìm sản phẩm và kiểm kho nhanh hơn.' },
  { icon: Printer, title: 'Máy in hóa đơn, in bếp/bar', desc: 'Kết nối thiết bị bán hàng phù hợp từng mô hình.' },
  {
    icon: Smartphone,
    title: 'Quản lý trên nhiều thiết bị',
    desc: 'Dùng trên máy tính, tablet hoặc điện thoại theo phân quyền.',
  },
  {
    icon: Wifi,
    title: 'Hạ tầng triển khai thực tế',
    desc: 'Tư vấn wifi, mạng nội bộ, camera và thiết bị tại điểm bán.',
  },
]

export default function IndustryDetail() {
  const { slug } = useParams()
  const [cmsIndustry, setCmsIndustry] = useState(null)

  useEffect(() => {
    fetchOffering('industry', slug)
      .then(setCmsIndustry)
      .catch(() => {})
  }, [slug])

  // Map đủ các trường mà JSX bên dưới dùng (title/group/features/benefits...) —
  // thiếu trường sẽ nổ runtime (vd industry.title.toLowerCase()) → trang trắng.
  const industry = cmsIndustry
    ? {
        // Cùng công thức hero với bản tĩnh để trang không "nghèo" đi khi chuyển sang CMS.
        hero: `Phần mềm quản lý ${cmsIndustry.title.toLowerCase()} iOrder`,
        title: cmsIndustry.title,
        group: cmsIndustry.category ?? 'Ngành hàng',
        lead:
          cmsIndustry.description ||
          cmsIndustry.summary ||
          `iOrder được cấu hình theo đặc thù ngành ${cmsIndustry.title.toLowerCase()}, giúp quản lý bán hàng, tồn kho, nhân viên, khách hàng và báo cáo trên cùng một nền tảng.`,
        features: cmsIndustry.features ?? [],
        benefits: cmsIndustry.benefits ?? [],
      }
    : findIndustrySolution(slug)
  const relatedIndustries = industrySolutions.filter((item) => item.slug !== slug).slice(0, 6)

  useEffect(() => {
    setPageSeo({
      title: industry ? `${industry.hero} - iOrder` : 'Giải pháp ngành hàng - iOrder',
      description:
        industry?.lead ??
        'Giải pháp iOrder theo từng ngành hàng: bán lẻ, nhà hàng, cafe, thời trang, điện máy, spa, khách sạn và nhiều mô hình khác.',
    })
  }, [industry])

  if (!industry) return <StaticPage />

  return (
    <PageLayout>
      <section className="detail-hero industry-hero">
        <div className="container article-hero-grid">
          <div>
            <nav className="breadcrumb" aria-label="Breadcrumb">
              <Link to="/">Trang chủ</Link>
              <span>/</span>
              <Link to="/giai-phap">Giải pháp</Link>
              <span>/</span>
              <strong>{industry.group}</strong>
            </nav>
            <Link to="/" className="detail-back-link">
              <ArrowLeft size={20} />
              Quay lại trang chủ
            </Link>
            <span className="listing-kicker">{industry.group}</span>
            <h1 className="detail-title">{industry.hero}</h1>
            <p className="detail-summary">{industry.lead}</p>
            <Link to="/lien-he" className="btn large primary industry-hero-cta">
              <span>Tư vấn ngành này</span>
              <ArrowRight size={18} />
            </Link>
          </div>
          <div className="article-source-card">
            <div className="article-source-image">
              <img src={posHero} alt={`Minh họa giải pháp ${industry.title} iOrder`} loading="lazy" decoding="async" />
            </div>
            <span>iOrder theo ngành</span>
            <h2>{industry.title}</h2>
            <p>Cấu hình quy trình, dữ liệu, thiết bị và báo cáo theo đặc thù vận hành của từng ngành hàng.</p>
          </div>
        </div>
      </section>

      <section className="detail-section">
        <div className="container">
          <div className="detail-grid">
            <div className="detail-card">
              <h2>Tính năng phù hợp ngành</h2>
              <div className="detail-list">
                {industry.features.map((feature) => (
                  <div key={feature} className="detail-list-item">
                    <CheckCircle size={22} />
                    <p>{feature}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="detail-card">
              <h2>Lợi ích khi triển khai</h2>
              <div className="detail-list">
                {industry.benefits.map((benefit) => (
                  <div key={benefit} className="detail-list-item">
                    <CheckCircle size={22} />
                    <p>{benefit}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="detail-section industry-hardware-section">
        <div className="container">
          <div className="section-title">
            <h2>Công nghệ và thiết bị triển khai</h2>
            <p>iOrder có thể đi cùng phần cứng, hạ tầng và dịch vụ CNTT để cửa hàng vận hành ổn định hơn.</p>
          </div>
          <div className="faq-grid">
            {hardwarePoints.map((item) => {
              const Icon = item.icon
              return (
                <div className="faq-card industry-hardware-card" key={item.title}>
                  <Icon size={28} />
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="detail-section related-news-section">
        <div className="container">
          <div className="section-title">
            <h2>Ngành hàng khác</h2>
          </div>
          <div className="industry-related-grid">
            {relatedIndustries.map((item) => (
              <Link key={item.slug} to={`/nganh-hang/${item.slug}`}>
                <span>{item.group}</span>
                <strong>{item.title}</strong>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="detail-cta">
        <div className="container">
          <h2>Muốn cấu hình iOrder cho ngành {industry.title.toLowerCase()}?</h2>
          <p>Gửi thông tin mô hình kinh doanh, số chi nhánh và thiết bị hiện có để iOrder tư vấn lộ trình phù hợp.</p>
          <Link to="/lien-he" className="btn large primary">
            <span>Liên hệ tư vấn</span>
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </PageLayout>
  )
}
