import { useState, useEffect } from 'react'
import { useParams, useLocation, Link } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import StaticPage from './StaticPage'
import { CheckCircle, ArrowLeft } from 'lucide-react'

import logoMain from '../assets/header/logo.png'
import logoFooter from '../assets/header/logo.png'

const solutions = [
  {
    slug: 'nha-hang',
    title: 'Giải pháp cho Nhà hàng',
    fullDescription: 'Giải pháp hoàn chỉnh cho nhà hàng modern, tích hợp quản lý bàn ăn, bếp, kho, nhân viên và tài chính.',
    features: [
      'Quản lý bàn ăn và gọi món',
      'In bếp tự động cho bếp/bar',
      'Quản lý kho và cơ cấu giá',
      'Quản lý nhân viên phục vụ',
      'Báo cáo doanh thu theo bàn',
      'Hỗ trợ gọi món QR code',
      'Tích hợp thanh toán online'
    ]
  },
  {
    slug: 'quan-cafe',
    title: 'Giải pháp cho Quán Cafe',
    fullDescription: 'Giải pháp tối ưu cho quán cafe bao gồm POS nhanh, quản lý menu đồ uống, và báo cáo doanh thu.',
    features: [
      'POS bán hàng nhanh',
      'Quản lý menu và giá',
      'Quản lý kho nguyên liệu',
      'Báo cáo doanh thu chi tiết',
      'Quản lý nhân viên pha chế',
      'Tích hợp delivery',
      'QR code thanh toán'
    ]
  },
  {
    slug: 'ban-le',
    title: 'Giải pháp cho Bán lẻ',
    fullDescription: 'Giải pháp bán lẻ toàn diện với POS, quản lý kho, nhân viên và báo cáo chi tiết.',
    features: [
      'POS bán hàng hiệu quả',
      'Quản lý kho hàng',
      'Báo cáo doanh thu',
      'Quản lý nhân viên',
      'Tích hợp bán online',
      'Quản lý khách hàng thân thiết',
      'Tính năng giảm giá và khuyến mãi'
    ]
  },
  {
    slug: 'chuoi-cua-hang',
    title: 'Giải pháp cho Chuỗi Cửa hàng',
    fullDescription: 'Quản lý toàn bộ chuỗi cửa hàng từ một bảng điều khiển tập trung.',
    features: [
      'Quản lý tập trung nhiều cửa hàng',
      'Báo cáo tổng hợp từ toàn chuỗi',
      'Đồng bộ kho hàng',
      'Quản lý nhân viên tập trung',
      'Báo cáo so sánh giữa cửa hàng',
      'Chính sách giá chung',
      'Quản lý khoá ca trung tâm'
    ]
  }
]

const softwareProducts = []
const servicePages = []

export default function SolutionDetail() {
  const { slug } = useParams()
  const [activeDropdown, setActiveDropdown] = useState(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  const solution = solutions.find(s => s.slug === slug)

  useEffect(() => {
    if (location.pathname.startsWith('/phan-mem')) setActiveDropdown('software')
    else if (location.pathname.startsWith('/giai-phap')) setActiveDropdown('solutions')
    else if (location.pathname.startsWith('/dich-vu')) setActiveDropdown('services')
    else setActiveDropdown(null)
  }, [location.pathname])

  if (!solution) {
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
        solutionPages={solutions}
        servicePages={servicePages}
      />

      <main>
        <section className="detail-hero">
          <div className="container">
            <Link to="/giai-phap" className="detail-back-link">
              <ArrowLeft size={20} />
              Quay lại Giải pháp
            </Link>
            <h1 className="detail-title">{solution.title}</h1>
            <p className="detail-summary">
              {solution.fullDescription}
            </p>
          </div>
        </section>

        <section className="detail-section">
          <div className="container">
            <h2 style={{ marginBottom: '30px' }}>Tính năng chính</h2>
            <div className="detail-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
              {solution.features.map((feature, idx) => (
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
            <h2>Sẵn sàng triển khai?</h2>
            <p>
              Liên hệ với chúng tôi để tư vấn giải pháp phù hợp nhất cho kinh doanh của bạn.
            </p>
            <a href="mailto:contact@iorder.vn" className="btn large primary">
              Liên hệ tư vấn
            </a>
          </div>
        </section>
      </main>

      <Footer logoFooter={logoFooter} />
    </div>
  )
}
