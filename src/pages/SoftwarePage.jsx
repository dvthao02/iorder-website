import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowRight, BarChart3, Boxes, CheckCircle, Printer, ReceiptText, ShieldCheck, Smartphone, Users } from 'lucide-react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { setPageSeo } from '../utils/seo'

import logoMain from '../assets/header/logo.png'
import logoFooter from '../assets/header/logo.png'
import heroImg from '../assets/products/hero-img.png'
import mhPosIot from '../assets/products/mh-pos-iot.png'
import mhMtIot from '../assets/products/mh-mt-iot.png'
import mhPhoneIot from '../assets/products/mh-phone-iot.png'
import softWareImg from '../assets/products/soft_ware.png'
import posImg from '../assets/products/pos.jpg'

const reasons = [
  {
    icon: Smartphone,
    title: 'Dùng được trên nhiều thiết bị',
    desc: 'Máy tính, tablet và điện thoại cùng truy cập dữ liệu cửa hàng.'
  },
  {
    icon: Printer,
    title: 'Kết nối thiết bị bán hàng',
    desc: 'Máy in hóa đơn, in bếp, máy quét mã vạch và ngăn kéo tiền.'
  },
  {
    icon: ShieldCheck,
    title: 'Dữ liệu và phân quyền rõ ràng',
    desc: 'Tách vai trò nhân viên, quản lý thao tác quan trọng và giảm rủi ro thất thoát.'
  }
]

const productPages = [
  {
    id: 1,
    slug: 'quan-ly-ban-hang-iorder',
    title: 'Phần mềm quản lý bán hàng - iOrder',
    description: 'Nền tảng POS cho cửa hàng, nhà hàng, cafe và chuỗi bán lẻ cần quản lý bán hàng, kho, nhân viên và báo cáo.',
    icon: ReceiptText,
    tags: ['POS', 'Bán hàng', 'Báo cáo'],
    bestFor: 'Cửa hàng, cafe, nhà hàng và chuỗi bán lẻ',
    keyValue: 'Vận hành bán hàng tập trung'
  },
  {
    id: 2,
    slug: 'quan-ly-truong-mam-non-mimiedu',
    title: 'Phần mềm quản lý trường mầm non - MimiEdu',
    description: 'Hỗ trợ trường mầm non quản lý học sinh, lớp học, học phí, điểm danh và kết nối phụ huynh.',
    icon: Users,
    tags: ['Giáo dục', 'Học phí', 'Điểm danh'],
    bestFor: 'Trường mầm non, nhóm lớp và cơ sở giáo dục',
    keyValue: 'Quản lý hồ sơ và phụ huynh rõ ràng'
  },
  {
    id: 3,
    slug: 'dong-bo-du-lieu-iorder-rpa',
    title: 'Phần mềm đồng bộ dữ liệu iOrder RPA',
    description: 'Tự động đồng bộ dữ liệu giữa hệ thống bán hàng, kế toán, sàn thương mại và phần mềm nội bộ.',
    icon: Boxes,
    tags: ['RPA', 'Đồng bộ', 'Tự động'],
    bestFor: 'Doanh nghiệp có nhiều nguồn dữ liệu vận hành',
    keyValue: 'Giảm nhập liệu lặp lại'
  },
  {
    id: 4,
    slug: 'quan-ly-tram-sac-xe-dien',
    title: 'Phần mềm quản lý trạm sạc xe điện',
    description: 'Theo dõi trạm sạc, phiên sạc, doanh thu, thiết bị và tình trạng vận hành theo thời gian thực.',
    icon: BarChart3,
    tags: ['Trạm sạc', 'Thiết bị', 'Realtime'],
    bestFor: 'Đơn vị vận hành trạm sạc và bãi xe điện',
    keyValue: 'Giám sát vận hành thiết bị'
  },
  {
    id: 5,
    slug: 'quan-ly-van-tai',
    title: 'Phần mềm quản lý vận tải',
    description: 'Quản lý đơn vận, phương tiện, tài xế, lịch trình và báo cáo chi phí trong hoạt động vận tải.',
    icon: Smartphone,
    tags: ['Vận tải', 'Tài xế', 'Lịch trình'],
    bestFor: 'Đội xe, giao nhận và doanh nghiệp logistics',
    keyValue: 'Theo dõi chuyến và chi phí'
  },
  {
    id: 6,
    slug: 'hoa-don-dien-tu-chu-ky-so',
    title: 'Hóa đơn điện tử - Chữ ký số',
    description: 'Cung cấp giải pháp hóa đơn điện tử, chữ ký số và hợp đồng điện tử cho doanh nghiệp.',
    icon: ShieldCheck,
    tags: ['Hóa đơn', 'Chữ ký số', 'Pháp lý'],
    bestFor: 'Doanh nghiệp cần chứng từ điện tử hợp lệ',
    keyValue: 'Số hóa chứng từ nhanh'
  }
]

const productVisuals = [heroImg, mhPosIot, mhMtIot, mhPhoneIot, softWareImg, posImg]
const solutionPages = []
const servicePages = []

export default function SoftwarePage() {
  const [activeDropdown, setActiveDropdown] = useState(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setPageSeo({
      title: 'Phần mềm quản lý bán hàng - iOrder',
      description: 'Khám phá các sản phẩm phần mềm iOrder cho bán hàng, quản lý trường mầm non, đồng bộ dữ liệu, trạm sạc xe điện, vận tải và hóa đơn điện tử.'
    })
    setActiveDropdown('software')
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
        softwareProducts={productPages}
        solutionPages={solutionPages}
        servicePages={servicePages}
      />

      <main>
        <section className="listing-hero software-hero">
          <div className="container software-hero-grid">
            <div>
              <span className="listing-kicker">
                <CheckCircle size={16} />
                Bộ phần mềm iOrder
              </span>
              <h1 className="listing-hero-title">Quản lý bán hàng, dữ liệu và vận hành trên một nền tảng</h1>
              <p className="listing-hero-lead">
                iOrder gom các nghiệp vụ quan trọng vào một hệ sinh thái: bán hàng tại quầy, thiết bị POS, dữ liệu đồng bộ, báo cáo vận hành và các giải pháp mở rộng cho doanh nghiệp.
              </p>
              <div className="software-stats">
                <div><strong>{productPages.length}</strong><span>sản phẩm phần mềm</span></div>
                <div><strong>24/7</strong><span>hỗ trợ triển khai</span></div>
                <div><strong>Realtime</strong><span>báo cáo vận hành</span></div>
              </div>
            </div>

            <div className="software-hero-panel">
              <h2>Luồng vận hành mẫu</h2>
              {['Tạo sản phẩm và giá bán', 'Bán hàng tại quầy hoặc gọi món', 'Tự động trừ kho và in hóa đơn', 'Chốt ca, xem báo cáo và đối soát'].map((item, index) => (
                <div key={item} className="software-flow-item">
                  <span>{index + 1}</span>
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="listing-section soft software-products-section">
          <div className="container">
            <div className="section-title compact">
              <span>Danh mục phần mềm</span>
              <h2>Chọn sản phẩm phù hợp với mô hình của bạn</h2>
              <p>Mỗi nhóm phần mềm có trang chi tiết riêng để khách xem đúng giải pháp, đúng nhu cầu.</p>
            </div>

            <div className="listing-grid cols-4 software-product-grid">
              {productPages.map((product, index) => {
                const Icon = product.icon
                const visual = productVisuals[index % productVisuals.length]
                return (
                  <Link to={`/phan-mem/${product.slug}`} key={product.id} className="listing-card-link">
                    <article className="listing-card software-listing-card">
                      <div className="software-card-media">
                        <img src={visual} alt="" loading="lazy" decoding="async" />
                        <span>{String(index + 1).padStart(2, '0')}</span>
                      </div>
                      <div className="software-card-body">
                        <div className="listing-icon-shell">
                          <Icon size={28} className="listing-card-icon" />
                        </div>
                        <h3 className="listing-card-title">{product.title}</h3>
                        <p className="listing-card-desc">{product.description}</p>
                        <div className="news-chip-row">
                          {product.tags.map((tag) => <span key={tag}>{tag}</span>)}
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
              <h2>Chọn module theo nhu cầu vận hành</h2>
              <p>Bảng tóm tắt giúp khách truy cập hiểu nhanh nên bắt đầu từ phần nào của iOrder.</p>
            </div>
            <div className="software-compare-table">
              <div className="software-compare-row compare-header">
                <span>Module</span>
                <span>Phù hợp nhất với</span>
                <span>Giá trị chính</span>
                <span>Chi tiết</span>
              </div>
              {productPages.map((product) => (
                <div className="software-compare-row" key={product.slug}>
                  <strong>{product.title}</strong>
                  <span>{product.bestFor}</span>
                  <span>{product.keyValue}</span>
                  <Link to={`/phan-mem/${product.slug}`}>Xem thêm</Link>
                </div>
              ))}
            </div>
            <div className="software-compare-cta">
              <p>Chưa chắc cửa hàng nên bắt đầu từ module nào?</p>
              <Link to="/lien-he" className="btn primary">Nhận tư vấn cấu hình</Link>
            </div>
          </div>
        </section>

        <section className="listing-section software-reasons-section">
          <div className="container">
            <div className="section-title">
              <h2>Tại sao chọn iOrder?</h2>
              <p>Giao diện tập trung vào thao tác thật tại cửa hàng, không chỉ là màn hình quản trị.</p>
            </div>
            <div className="news-split-grid three">
              {reasons.map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.title} className="news-insight-card">
                    <Icon size={30} />
                    <h3>{item.title}</h3>
                    <p>{item.desc}</p>
                  </div>
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
