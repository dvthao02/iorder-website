import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CheckCircle, CircleDollarSign, Clock, Gauge, ShieldCheck } from 'lucide-react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import StaticPage from './StaticPage'
import { setPageSeo } from '../utils/seo'

import logoMain from '../assets/header/logo.png'
import logoFooter from '../assets/header/logo.png'
import posHero from '../assets/products/pos.jpg'

const softwareProducts = [
  {
    slug: 'pos-ban-hang',
    title: 'POS bán hàng',
    summary: 'Màn hình bán hàng nhanh cho quầy thu ngân, cafe, nhà hàng và cửa hàng bán lẻ cần xử lý đơn liên tục.',
    metrics: ['Tạo đơn ít bước', 'Thanh toán linh hoạt', 'Chốt ca rõ ràng'],
    features: ['Tìm sản phẩm bằng tên, nhóm hàng hoặc mã vạch', 'Giảm giá theo hóa đơn hoặc từng sản phẩm', 'Tách/gộp bàn, in bếp/bar cho mô hình F&B', 'Ghi nhận tiền mặt, chuyển khoản và ví điện tử', 'In hóa đơn, in tem và lưu lịch sử giao dịch'],
    benefits: ['Giảm thời gian đào tạo nhân viên mới', 'Hạn chế sai sót khi tính tiền giờ cao điểm', 'Dễ kiểm tra doanh thu cuối ca', 'Tạo trải nghiệm thanh toán nhanh cho khách'],
    faq: [
      ['POS có dùng được cho nhà hàng và bán lẻ không?', 'Có. iOrder có thể cấu hình theo quầy bán lẻ, cafe, nhà hàng hoặc mô hình có bàn/phòng.'],
      ['Có kết nối máy in không?', 'Có thể cấu hình máy in hóa đơn, máy in bếp/bar và các thiết bị bán hàng phổ biến.'],
      ['Mất mạng có bán được không?', 'Tùy cấu hình triển khai thực tế. Đội ngũ iOrder sẽ tư vấn phương án phù hợp với thiết bị và mạng tại cửa hàng.'],
    ]
  },
  {
    slug: 'quan-ly-kho',
    title: 'Quản lý kho',
    summary: 'Kiểm soát nhập xuất, tồn kho, giá vốn và cảnh báo hàng sắp hết theo từng cửa hàng hoặc chi nhánh.',
    metrics: ['Tồn kho realtime', 'Cảnh báo hết hàng', 'Theo dõi giá vốn'],
    features: ['Nhập kho, xuất kho và điều chỉnh tồn', 'Theo dõi tồn theo chi nhánh hoặc kho hàng', 'Quản lý mã vạch, đơn vị tính và nhóm sản phẩm', 'Cảnh báo hàng bán chậm hoặc sắp hết', 'Xuất báo cáo nhập xuất tồn'],
    benefits: ['Giảm thất thoát do lệch kho', 'Chủ động kế hoạch nhập hàng', 'Nhìn rõ sản phẩm bán chạy và tồn chậm', 'Dữ liệu kho đi cùng đơn bán thực tế'],
    faq: [
      ['Có nhập tồn kho ban đầu từ file không?', 'Có thể chuẩn bị file danh mục và tồn kho để đội triển khai hỗ trợ nhập dữ liệu ban đầu.'],
      ['Có quản lý nhiều kho hoặc chi nhánh không?', 'Có. iOrder có thể tách dữ liệu tồn theo từng điểm bán hoặc kho hàng.'],
      ['Có cảnh báo hàng sắp hết không?', 'Có thể thiết lập ngưỡng tồn thấp để quản lý chủ động nhập hàng.'],
    ]
  },
  {
    slug: 'quan-ly-nhan-vien',
    title: 'Quản lý nhân viên',
    summary: 'Phân quyền thao tác, theo dõi ca bán, hiệu suất và trách nhiệm của từng nhân viên trong cửa hàng.',
    metrics: ['Vai trò rõ ràng', 'Theo dõi ca bán', 'Lịch sử thao tác'],
    features: ['Tạo tài khoản theo vai trò', 'Giới hạn quyền xem báo cáo, sửa giá hoặc hủy đơn', 'Theo dõi doanh thu theo nhân viên và ca bán', 'Ghi nhận lịch sử thao tác quan trọng', 'Hỗ trợ quy trình bàn giao ca'],
    benefits: ['Giảm rủi ro dùng chung tài khoản', 'Dễ phát hiện sai lệch trong ca bán', 'Quản lý đội ngũ khi mở thêm chi nhánh', 'Tăng trách nhiệm của từng vị trí'],
    faq: [
      ['Có phân quyền theo vai trò không?', 'Có. Chủ cửa hàng có thể phân quyền cho thu ngân, phục vụ, bếp/bar và quản lý.'],
      ['Có xem doanh thu theo nhân viên không?', 'Có thể theo dõi theo ca bán, nhân viên và chi nhánh tùy cấu hình báo cáo.'],
      ['Nhân viên mới có cần đào tạo lâu không?', 'iOrder ưu tiên thao tác đơn giản để nhân viên mới có thể làm quen nhanh.'],
    ]
  },
  {
    slug: 'bao-cao-doanh-thu',
    title: 'Báo cáo doanh thu',
    summary: 'Dashboard doanh thu, sản phẩm, lợi nhuận và hiệu suất chi nhánh giúp chủ cửa hàng ra quyết định nhanh hơn.',
    metrics: ['Doanh thu realtime', 'Top sản phẩm', 'Theo dõi chi nhánh'],
    features: ['Báo cáo doanh thu theo ngày, tháng, ca và nhân viên', 'Theo dõi sản phẩm bán chạy, bán chậm', 'Tổng hợp thanh toán theo tiền mặt và chuyển khoản', 'So sánh hiệu quả giữa các chi nhánh', 'Xuất dữ liệu phục vụ kế toán và quản lý'],
    benefits: ['Nắm tình hình cửa hàng mọi lúc', 'Ra quyết định nhập hàng dựa trên dữ liệu', 'Phát hiện chi nhánh hoặc ca bán bất thường', 'Giảm phụ thuộc vào sổ sách thủ công'],
    faq: [
      ['Có xem báo cáo từ xa không?', 'Có. Chủ cửa hàng có thể theo dõi dữ liệu vận hành theo tài khoản được phân quyền.'],
      ['Có tách doanh thu theo hình thức thanh toán không?', 'Có thể tách tiền mặt, chuyển khoản và các phương thức thanh toán khác.'],
      ['Có xuất báo cáo cho kế toán không?', 'Có thể xuất dữ liệu phục vụ đối soát và kế toán theo nhu cầu triển khai.'],
    ]
  }
]

const detailIcons = [Gauge, Clock, CircleDollarSign]
const rolloutSteps = ['Khảo sát mô hình', 'Nhập dữ liệu ban đầu', 'Cài thiết bị', 'Đào tạo ca bán đầu tiên']

export default function SoftwareDetail() {
  const { slug } = useParams()
  const [activeDropdown, setActiveDropdown] = useState(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const product = softwareProducts.find((item) => item.slug === slug)

  useEffect(() => {
    setPageSeo({
      title: product ? `${product.title} - iOrder` : 'Phần mềm iOrder',
      description: product?.summary ?? 'Phần mềm iOrder hỗ trợ bán hàng, quản lý kho, nhân viên và báo cáo doanh thu cho cửa hàng.'
    })
    setActiveDropdown('software')
    setMobileOpen(false)
  }, [location.pathname, product])

  if (!product) return <StaticPage />

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
        solutionPages={[]}
        servicePages={[]}
      />

      <main>
        <section className="detail-hero software-detail-hero">
          <div className="container article-hero-grid">
            <div>
              <Link to="/phan-mem" className="detail-back-link">
                <ArrowLeft size={20} />
                Quay lại phần mềm
              </Link>
              <span className="listing-kicker">
                <ShieldCheck size={16} />
                iOrder Software
              </span>
              <h1 className="detail-title">{product.title}</h1>
              <p className="detail-summary">{product.summary}</p>
            </div>
            <div className="software-metric-grid">
              {product.metrics.map((metric, index) => {
                const Icon = detailIcons[index] ?? CheckCircle
                return (
                  <div key={metric} className="software-metric-card">
                    <Icon size={26} />
                    <strong>{metric}</strong>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <section className="detail-section">
          <div className="container">
            <div className="detail-grid">
              <div className="detail-card">
                <h2>Tính năng chính</h2>
                <div className="detail-list">
                  {product.features.map((feature) => (
                    <div key={feature} className="detail-list-item">
                      <CheckCircle size={22} />
                      <p>{feature}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="detail-card">
                <h2>Lợi ích vận hành</h2>
                <div className="detail-benefits">
                  {product.benefits.map((benefit) => (
                    <div key={benefit} className="detail-benefit-card">
                      <p>{benefit}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="detail-section software-rollout-section">
          <div className="container software-rollout-grid">
            <div className="software-rollout-image">
              <img src={posHero} alt={`Minh họa triển khai ${product.title} iOrder`} />
            </div>
            <div className="software-rollout-copy">
              <h2>Quy trình triển khai {product.title.toLowerCase()}</h2>
              <p>Đội ngũ iOrder sẽ hỗ trợ từ khâu khảo sát, chuẩn hóa dữ liệu đến cài đặt thiết bị và hướng dẫn nhân viên vận hành thực tế.</p>
              <div className="software-rollout-steps">
                {rolloutSteps.map((step, index) => (
                  <div key={step}>
                    <span>{index + 1}</span>
                    <strong>{step}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="detail-section">
          <div className="container">
            <div className="section-title">
              <h2>Câu hỏi thường gặp</h2>
            </div>
            <div className="faq-grid">
              {product.faq.map(([question, answer]) => (
                <div key={question} className="faq-card">
                  <h3>{question}</h3>
                  <p>{answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="detail-cta">
          <div className="container">
            <h2>Cần tư vấn cấu hình {product.title.toLowerCase()}?</h2>
            <p>iOrder sẽ hỗ trợ chọn thiết bị, nhập dữ liệu ban đầu và thiết kế quy trình phù hợp với mô hình cửa hàng của bạn.</p>
            <Link to="/lien-he" className="btn large primary">
              <span>Liên hệ tư vấn</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        </section>
      </main>

      <Footer logoFooter={logoFooter} />
    </div>
  )
}
