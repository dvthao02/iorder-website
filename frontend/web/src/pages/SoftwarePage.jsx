import { useEffect, useState } from 'react'
import { ArrowRight, CheckCircle2, MonitorSmartphone, Printer, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageLayout from '../components/PageLayout'
import { setPageSeo } from '../utils/seo'
import { softwareProducts } from '../data/siteContent'
import { fetchOfferings } from '../utils/contentApi'
import productSuite from '../assets/products/hero-iorder-suite.png'
import dashboard from '../assets/products/hero-dashboard-cutout.png'
import tablet from '../assets/products/mh-pos-iot.png'
import phone from '../assets/products/mh-phone-iot.png'
import pos from '../assets/products/hero-pos-retail-cutout.png'

const fallbackVisuals = [productSuite, dashboard, tablet, phone, pos]

const ecosystem = [
  {
    icon: MonitorSmartphone,
    title: 'Một hệ thống, nhiều điểm chạm',
    description: 'Từ quầy bán hàng đến màn hình quản trị và điện thoại của người chủ.',
  },
  {
    icon: Printer,
    title: 'Sẵn sàng cho thiết bị thực tế',
    description: 'Kết nối thiết bị POS, máy in hóa đơn, máy in bếp và máy quét mã vạch.',
  },
  {
    icon: ShieldCheck,
    title: 'Dữ liệu rõ ràng theo từng vai trò',
    description: 'Theo dõi vận hành, phân quyền và đối soát theo đúng cách cửa hàng làm việc.',
  },
]

function productHref(product) {
  return product.href ?? `/phan-mem/${product.slug}`
}

export default function SoftwarePage() {
  const [cmsProducts, setCmsProducts] = useState(null)

  useEffect(() => {
    fetchOfferings('software')
      .then(setCmsProducts)
      .catch(() => {})
  }, [])

  useEffect(() => {
    setPageSeo({
      title: 'Phần mềm quản lý bán hàng - iOrder',
      description:
        'Khám phá các sản phẩm phần mềm iOrder cho bán hàng, quản lý trường mầm non, đồng bộ dữ liệu, trạm sạc xe điện, vận tải và hóa đơn điện tử.',
    })
  }, [])

  const products = cmsProducts ?? softwareProducts
  const [featured, ...otherProducts] = products
  const featuredHref = featured ? productHref(featured) : '/phan-mem/quan-ly-ban-hang-iorder'

  return (
    <PageLayout>
      <section className="software-editorial-hero">
        <div className="container software-editorial-hero-grid">
          <div className="software-editorial-hero-copy">
            <p className="software-eyebrow">
              <CheckCircle2 size={17} aria-hidden="true" /> HỆ SINH THÁI PHẦN MỀM IORDER
            </p>
            <h1>Phần mềm cho vận hành thật, không chỉ để quản lý trên màn hình</h1>
            <p className="software-editorial-lead">
              Xây dựng từ quy trình bán hàng tại quầy, iOrder kết nối dữ liệu, nhân sự và thiết bị để
              cửa hàng vận hành nhất quán hơn mỗi ngày.
            </p>
            <div className="software-editorial-actions">
              <Link to={featuredHref} className="btn primary">
                Khám phá iOrder POS <ArrowRight size={18} />
              </Link>
              <Link to="/lien-he" className="software-text-link">
                Trao đổi về mô hình của bạn <ArrowRight size={16} />
              </Link>
            </div>
          </div>
          <div className="software-editorial-hero-visual" aria-label="Bộ giải pháp iOrder">
            <img src={productSuite} alt="Thiết bị và phần mềm quản lý bán hàng iOrder" fetchPriority="high" />
          </div>
        </div>
      </section>

      <section className="software-featured-product">
        <div className="container software-featured-product-grid">
          <div className="software-featured-product-copy">
            <p className="software-eyebrow">SẢN PHẨM NỔI BẬT</p>
            <h2>{featured?.title ?? 'Phần mềm quản lý bán hàng iOrder'}</h2>
            <p>
              {featured?.description ??
                'Một không gian làm việc tập trung cho bán hàng, kho, nhân viên và báo cáo vận hành.'}
            </p>
            <ul className="software-proof-list">
              <li>Thao tác nhanh tại quầy và trên thiết bị di động</li>
              <li>Kho, đơn hàng và báo cáo cùng nằm trong một luồng dữ liệu</li>
              <li>Dễ cấu hình theo cách vận hành riêng của từng cửa hàng</li>
            </ul>
            <Link to={featuredHref} className="software-arrow-link">
              Xem chi tiết sản phẩm <ArrowRight size={18} />
            </Link>
          </div>
          <div className="software-featured-product-visual">
            <img src={featured?.coverUrl ?? dashboard} alt="Giao diện dashboard iOrder" loading="eager" />
          </div>
        </div>
      </section>

      <section className="software-product-editorial">
        <div className="container">
          <div className="software-section-heading">
            <p className="software-eyebrow">CÁC SẢN PHẨM KHÁC</p>
            <h2>Mở rộng theo đúng nghiệp vụ doanh nghiệp cần</h2>
            <p>Không phải mô hình nào cũng vận hành giống nhau. Các sản phẩm được thiết kế cho từng bài toán riêng.</p>
          </div>

          <div className="software-editorial-product-list">
            {otherProducts.map((product, index) => {
              const visual = product.coverUrl ?? fallbackVisuals[(index + 1) % fallbackVisuals.length]
              const reversed = index % 2 === 1
              return (
                <article className={`software-editorial-product ${reversed ? 'is-reversed' : ''}`} key={product.id ?? product.slug}>
                  <div className="software-editorial-product-index">{String(index + 2).padStart(2, '0')}</div>
                  <div className="software-editorial-product-copy">
                    <p>{product.tags?.[0] ?? 'iOrder platform'}</p>
                    <h3>{product.title}</h3>
                    <span>{product.description}</span>
                    <Link to={productHref(product)} className="software-arrow-link">
                      Khám phá sản phẩm <ArrowRight size={17} />
                    </Link>
                  </div>
                  <Link to={productHref(product)} className="software-editorial-product-visual" aria-label={`Xem ${product.title}`}>
                    <img src={visual} alt="" loading="lazy" decoding="async" />
                  </Link>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section className="software-ecosystem-section">
        <div className="container software-ecosystem-grid">
          <div>
            <p className="software-eyebrow">HỆ SINH THÁI VẬN HÀNH</p>
            <h2>Phần mềm cần đi cùng cách cửa hàng làm việc.</h2>
            <p>
              iOrder không chỉ dừng ở một màn hình bán hàng. Hệ thống được triển khai cùng thiết bị, quy trình và đội ngũ của bạn.
            </p>
            <Link to="/lien-he" className="btn light">
              Nhận tư vấn cấu hình <ArrowRight size={18} />
            </Link>
          </div>
          <div className="software-ecosystem-list">
            {ecosystem.map((item, index) => {
              const Icon = item.icon
              return (
                <div className="software-ecosystem-item" key={item.title}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <Icon size={25} aria-hidden="true" />
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>
    </PageLayout>
  )
}
