import { useState, useEffect } from 'react'
import { useParams, useLocation, Link } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import StaticPage from './StaticPage'
import { CheckCircle, ArrowLeft } from 'lucide-react'

import logoMain from '../assets/header/logo.png'
import logoFooter from '../assets/header/logo.png'

const services = [
  {
    slug: 'tro-giup-24-7',
    title: 'Hỗ trợ 24/7',
    fullDescription: 'Đội ngũ hỗ trợ chuyên nghiệp của chúng tôi luôn sẵn sàng trợ giúp bạn bất cứ lúc nào qua email, chat, hoặc điện thoại.',
    features: [
      'Hỗ trợ qua email (phản hồi trong 1 giờ)',
      'Chat trực tiếp với nhân viên hỗ trợ',
      'Hotline hỗ trợ qua điện thoại',
      'Hỗ trợ trực tiếp qua TeamViewer',
      'Giải quyết các vấn đề kỹ thuật nhanh chóng',
      'Hỗ trợ bằng tiếng Việt'
    ]
  },
  {
    slug: 'huong-dan-su-dung',
    title: 'Hướng dẫn Sử dụng',
    fullDescription: 'Thư viện tài liệu, video hướng dẫn chi tiết giúp bạn sử dụng iOrder một cách tối ưu.',
    features: [
      'Video hướng dẫn từng tính năng',
      'Tài liệu PDF chi tiết',
      'FAQ - Câu hỏi thường gặp',
      'Hướng dẫn cài đặt thiết bị ngoại vi',
      'Hướng dẫn nhập dữ liệu ban đầu',
      'Chuỗi video khóa học online'
    ]
  },
  {
    slug: 'dao-tao-online',
    title: 'Đào tạo Online',
    fullDescription: 'Khóa đào tạo toàn diện cho nhân viên của bạn, từ cơ bản đến nâng cao.',
    features: [
      'Đào tạo cho nhân viên bán hàng',
      'Đào tạo cho quản lý cửa hàng',
      'Đào tạo cho kế toán',
      'Đào tạo quản trị hệ thống',
      'Đào tạo theo yêu cầu',
      'Cấp chứng chỉ hoàn thành khóa'
    ]
  },
  {
    slug: 'tu-van-theo-yen-cau',
    title: 'Tư vấn Theo yêu cầu',
    fullDescription: 'Tư vấn cá nhân hóa từ các chuyên gia của iOrder để tối ưu hóa quy trình kinh doanh của bạn.',
    features: [
      'Tư vấn quy trình kinh doanh',
      'Tư vấn cấu hình hệ thống',
      'Tư vấn triển khai tính năng mới',
      'Tư vấn tối ưu hóa báo cáo',
      'Tư vấn tích hợp với hệ thống khác',
      'Tư vấn nâng cấp hệ thống'
    ]
  }
]

const softwareProducts = []
const solutionPages = []

export default function ServiceDetail() {
  const { slug } = useParams()
  const [activeDropdown, setActiveDropdown] = useState(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  const service = services.find(s => s.slug === slug)

  useEffect(() => {
    if (location.pathname.startsWith('/phan-mem')) setActiveDropdown('software')
    else if (location.pathname.startsWith('/giai-phap')) setActiveDropdown('solutions')
    else if (location.pathname.startsWith('/dich-vu')) setActiveDropdown('services')
    else setActiveDropdown(null)
  }, [location.pathname])

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
        servicePages={services}
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
              {service.fullDescription}
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
            <a href="mailto:contact@iorder.vn" className="btn large primary">
              Liên hệ ngay
            </a>
          </div>
        </section>
      </main>

      <Footer logoFooter={logoFooter} />
    </div>
  )
}
