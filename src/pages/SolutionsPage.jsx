import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowRight, CheckCircle, Database, Fingerprint, Network, Server, ShieldCheck, Wifi } from 'lucide-react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { setPageSeo } from '../utils/seo'
import { servicePages, softwareProducts, solutionPages } from '../data/siteContent'
import { fetchOfferings } from '../utils/contentApi'

import logoMain from '../assets/header/logo.png'
import logoFooter from '../assets/header/logo.png'
import heroImg from '../assets/products/hero-img.png'
import mhPosIot from '../assets/products/mh-pos-iot.png'
import mhMtIot from '../assets/products/mh-mt-iot.png'
import mhPhoneIot from '../assets/products/mh-phone-iot.png'
import posImg from '../assets/products/pos.jpg'

const solutionIconMap = {
  database: Database,
  fingerprint: Fingerprint,
  server: Server,
  shield: ShieldCheck,
  wifi: Wifi,
}

const staticSolutions = solutionPages

const solutionVisuals = [mhPosIot, heroImg, mhMtIot, mhPhoneIot, posImg]

export default function SolutionsPage() {
  const [activeDropdown, setActiveDropdown] = useState(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [cmsSolutions, setCmsSolutions] = useState(null)
  const location = useLocation()

  useEffect(() => {
    fetchOfferings('solution').then(setCmsSolutions).catch(() => {})
  }, [])

  useEffect(() => {
    setPageSeo({
      title: 'Giải pháp hạ tầng và triển khai - iOrder',
      description: 'Các giải pháp hạ tầng mạng, Wifi, camera, bảo mật, data center, server và kiểm soát ra vào dành cho doanh nghiệp.'
    })
    setActiveDropdown('solutions')
    setMobileOpen(false)
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
        solutionPages={cmsSolutions ?? staticSolutions}
        servicePages={servicePages}
      />

      <main>
        <section className="listing-hero solution-hero">
          <div className="container software-hero-grid">
            <div>
              <span className="listing-kicker">
                <CheckCircle size={16} />
                Giải pháp triển khai
              </span>
              <h1 className="listing-hero-title">Hạ tầng ổn định để phần mềm vận hành mượt hơn</h1>
              <p className="listing-hero-lead">
                iOrder không chỉ cung cấp phần mềm. Chúng tôi hỗ trợ thiết kế, triển khai và chuẩn hóa hạ tầng mạng, thiết bị, máy chủ và bảo mật để hệ thống bán hàng hoạt động ổn định.
              </p>
              <div className="software-stats">
                <div><strong>{(cmsSolutions ?? staticSolutions).length}</strong><span>nhóm giải pháp</span></div>
                <div><strong>LAN/Wifi</strong><span>thiết kế theo mặt bằng</span></div>
                <div><strong>HA</strong><span>dự phòng và bảo mật</span></div>
              </div>
            </div>

            <div className="software-hero-panel">
              <h2>Quy trình triển khai</h2>
              {['Khảo sát hiện trạng', 'Thiết kế sơ đồ và cấu hình', 'Thi công, kiểm thử thiết bị', 'Bàn giao tài liệu và bảo trì'].map((item, index) => (
                <div key={item} className="software-flow-item">
                  <span>{index + 1}</span>
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="listing-section soft solution-products-section">
          <div className="container">
            <div className="section-title compact">
              <span>Danh mục giải pháp</span>
              <h2>Chọn hạ tầng phù hợp với điểm bán và doanh nghiệp</h2>
              <p>Các nhóm giải pháp được tách rõ để khách truy cập nhanh đúng nhu cầu cần tư vấn.</p>
            </div>

            <div className="listing-grid cols-4 solution-product-grid">
              {(cmsSolutions ?? staticSolutions).map((solution, index) => {
                const Icon = solutionIconMap[solution.iconKey] ?? Network
                const visual = solutionVisuals[index % solutionVisuals.length]
                return (
                  <Link to={solution.href} key={solution.slug} className="listing-card-link">
                    <article className="listing-card solution-listing-card">
                      <div className="solution-card-media">
                        <img src={visual} alt="" loading="lazy" decoding="async" />
                        <span>{String(index + 1).padStart(2, '0')}</span>
                      </div>
                      <div className="solution-card-body">
                        <div className="listing-icon-shell">
                          <Icon size={28} className="listing-card-icon" />
                        </div>
                        <h3 className="listing-card-title">{solution.title}</h3>
                        <p className="listing-card-desc">{solution.description}</p>
                        <div className="news-chip-row">
                          {solution.tags.map((tag) => <span key={tag}>{tag}</span>)}
                        </div>
                        <div className="listing-card-action">
                          Xem chi tiết <ArrowRight size={16} />
                        </div>
                      </div>
                    </article>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>

        <section className="listing-section software-compare-section">
          <div className="container">
            <div className="section-title">
              <h2>So sánh nhanh theo nhu cầu</h2>
              <p>Bảng tóm tắt giúp chọn đúng nhóm giải pháp trước khi trao đổi cấu hình chi tiết.</p>
            </div>
            <div className="software-compare-table">
              <div className="software-compare-row compare-header">
                <span>Giải pháp</span>
                <span>Phù hợp nhất với</span>
                <span>Giá trị chính</span>
                <span>Chi tiết</span>
              </div>
              {(cmsSolutions ?? staticSolutions).map((solution) => (
                <div className="software-compare-row" key={solution.slug}>
                  <strong>{solution.title}</strong>
                  <span>{solution.bestFor}</span>
                  <span>{solution.keyValue}</span>
                  <Link to={solution.href}>Xem thêm</Link>
                </div>
              ))}
            </div>
            <div className="software-compare-cta">
              <p>Chưa rõ cần cấu hình hạ tầng nào?</p>
              <Link to="/lien-he" className="btn primary">Liên hệ tư vấn</Link>
            </div>
          </div>
        </section>
      </main>

      <Footer logoFooter={logoFooter} />
    </div>
  )
}
