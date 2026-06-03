import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { setPageSeo } from '../utils/seo'
import { 
  BarChart3, Boxes, CheckCircle, Headphones, Newspaper, Phone, Printer, 
  ReceiptText, RefreshCw, ShieldCheck, Smartphone, Users, Video, Utensils,
  Coffee, Milk, Store, Building2, ShoppingBag, Home as HomeIcon, BookOpen, Rocket, Server,
  Mail, MapPin, ArrowRight, ChevronLeft, ChevronRight
} from 'lucide-react'

import logoMain from '../assets/header/logo.png'
import logoFooter from '../assets/header/logo.png'
import heroImg from '../assets/products/hero-img.png'
import heroImg2 from '../assets/products/hero-img2.png'
import heroImg3 from '../assets/products/hero-img3.png'
import phoneIotImage from '../assets/products/mh-phone-iot.png'
import computerIotImage from '../assets/products/mh-mt-iot.png'
import posIotImage from '../assets/products/mh-pos-iot.png'
import logoCrm from '../assets/partners/crm_online.png'
import logoHuit from '../assets/partners/huit.png'
import logoTanAnPhat from '../assets/partners/tan_an_phat.png'
import logoCmc from '../assets/partners/cmc.png'
import logoEtelecom from '../assets/partners/etelecom.png'
import logoLacViet from '../assets/partners/lac_viet.png'
import logoBase from '../assets/partners/base.png'
import logoInCard from '../assets/partners/in_card.png'
import logoMobifone from '../assets/partners/mobifone.png'
import logoBni from '../assets/partners/bni.png'
import logoVietnix from '../assets/partners/vietnix.png'
import logoVietsunco from '../assets/partners/vietsunco.png'
import logoShopee from '../assets/partners/shopeefood.png'
import logoGrab from '../assets/partners/grabfood.png'
import logoTaxnet from '../assets/partners/taxnet.png'
import zaloIcon from '../assets/misc/zalo-96.png'
import appStoreBadge from '../assets/footer/download_apple.png'
import googlePlayBadge from '../assets/footer/download_android.png'
import logoTTC from '../assets/partners/ttc.png'
import { newsArticles } from '../data/newsArticles'
import { industryGroups } from '../data/industrySolutions'

const modelCards = [
  { icon: Utensils, title: 'Nhà hàng' },
  { icon: Coffee, title: 'Quán cafe' },
  { icon: Milk, title: 'Trà sữa' },
  { icon: Store, title: 'Bán lẻ' },
  { icon: Building2, title: 'Chuỗi cửa hàng' },
  { icon: ShoppingBag, title: 'Tạp hóa' },
  { icon: HomeIcon, title: 'Mini mart' },
]

const featureTabs = [
  {
    id: 'all',
    label: 'Tất cả',
    items: [
      { icon: ReceiptText, title: 'Quản lý bán hàng', desc: 'Bán hàng nhanh, hỗ trợ nhiều hình thức thanh toán.' },
      { icon: Boxes, title: 'Quản lý kho', desc: 'Theo dõi tồn kho chi tiết, cảnh báo hàng sắp hết.' },
      { icon: Users, title: 'Quản lý nhân viên', desc: 'Phân quyền, chấm công và theo dõi hiệu suất.' },
      { icon: BarChart3, title: 'Báo cáo doanh thu', desc: 'Biểu đồ rõ ràng, cập nhật theo thời gian thực.' },
      { icon: Printer, title: 'In hóa đơn, in bếp', desc: 'In bill nhanh, in bếp/bar, in tem và mã vạch.' },
      { icon: Smartphone, title: 'Ứng dụng di động', desc: 'Quản lý cửa hàng mọi lúc, mọi nơi trên điện thoại.' },
    ],
  },
]

const heroSlides = [
  {
    image: heroImg,
    title: 'Hệ sinh thái bán hàng iOrder',
    caption: 'Đồng bộ phần mềm POS, thiết bị tại quầy, điện thoại và báo cáo kinh doanh trên một nền tảng.',
  },
  {
    image: heroImg2,
    title: 'Order bằng điện thoại, in bill tức thì',
    caption: 'Phù hợp cửa hàng nhỏ, quầy lưu động và mô hình cần kết nối máy in hóa đơn nhanh qua iOrder.',
  },
  {
    image: heroImg3,
    title: 'Máy POS chuyên nghiệp tại quầy',
    caption: 'Màn hình bán hàng lớn, thao tác nhanh, hỗ trợ kết nối thiết bị và vận hành ổn định 24/7.',
  },
]

const deploymentModels = [
  {
    image: phoneIotImage,
    title: 'Mô hình 1 thiết bị',
    description: 'Phù hợp cửa hàng nhỏ, quầy bán lưu động hoặc quán cafe cần bán hàng nhanh bằng điện thoại.',
  },
  {
    image: computerIotImage,
    title: 'Mô hình máy tính + IoT',
    description: 'Quản lý bán hàng trên máy tính, kết nối máy in bill, tem món, máy quét mã vạch và order từ xa.',
  },
  {
    image: posIotImage,
    title: 'Mô hình máy POS + IoT',
    description: 'Bộ vận hành chuyên nghiệp cho quầy bán hàng có POS, máy in, máy quét và dữ liệu đồng bộ iOrder.',
  },
]

const partnerItems = [
  { src: logoTTC, name: 'TTC', desc: 'Đối tác địa phương' },
  { src: logoShopee, name: 'ShopeeFood', desc: 'Giao đồ ăn' },
  { src: logoGrab, name: 'GrabFood', desc: 'Giao đồ ăn' },
  { src: logoTaxnet, name: 'TaxNet', desc: 'Giải pháp thuế' },
  { src: logoCrm, name: 'CRM Online', desc: 'Tích hợp CRM & POS' },
  { src: logoHuit, name: 'HUIT', desc: 'Trường Đại học Công Thương TPHCM' },
  { src: logoTanAnPhat, name: 'Tân An Phát', desc: 'Thiết bị in & phụ kiện' },
  { src: logoCmc, name: 'CMC Telecom', desc: 'Mạng & hạ tầng' },
  { src: logoEtelecom, name: 'eTelecom', desc: 'Giải pháp viễn thông' },
  { src: logoLacViet, name: 'Lạc Việt', desc: 'Hệ thống thanh toán' },
  { src: logoBase, name: 'Base.vn', desc: 'Quản lý nhân sự & ERP' },
  { src: logoInCard, name: 'InCard', desc: 'In ấn & tem nhãn' },
  { src: logoMobifone, name: 'Mobifone', desc: 'Nhà mạng' },
  { src: logoBni, name: 'BNI', desc: 'Mạng doanh nghiệp' },
  { src: logoVietnix, name: 'Vietnix', desc: 'Hosting & Cloud' },
  { src: logoVietsunco, name: 'Vietsunco', desc: 'Giải pháp thanh toán' },
]

export default function Home() {
  const [activeDropdown, setActiveDropdown] = useState(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [activeHeroSlide, setActiveHeroSlide] = useState(0)
  const [activeNewsIndex, setActiveNewsIndex] = useState(0)
  const location = useLocation()

  const softwareProducts = [
    { slug: 'quan-ly-ban-hang-iorder', title: 'Phần mềm quản lý bán hàng - iOrder' },
    { slug: 'quan-ly-truong-mam-non-mimiedu', title: 'Phần mềm quản lý trường mầm non - MimiEdu' },
    { slug: 'dong-bo-du-lieu-iorder-rpa', title: 'Phần mềm đồng bộ dữ liệu iOrder RPA' },
    { slug: 'quan-ly-tram-sac-xe-dien', title: 'Phần mềm quản lý trạm sạc xe điện' },
    { slug: 'quan-ly-van-tai', title: 'Phần mềm quản lý vận tải' },
    { slug: 'hoa-don-dien-tu-chu-ky-so', title: 'Hóa đơn điện tử - Chữ ký số' },
  ]

  const solutionPages = [
    {
      slug: 'mang-wifi-camera',
      title: 'Giải pháp hạ tầng mạng nội bộ, Wifi và camera',
      href: '/giai-phap/ha-tang/mang-wifi-camera',
    },
    {
      slug: 'can-bang-tai-ha-bao-mat',
      title: 'Cân bằng tải Internet, HA và bảo mật',
      href: '/giai-phap/ha-tang/can-bang-tai-ha-bao-mat',
    },
    {
      slug: 'data-center',
      title: 'Hệ thống data center cho doanh nghiệp',
      href: '/giai-phap/ha-tang/data-center',
    },
    {
      slug: 'may-chu-server',
      title: 'Giải pháp máy chủ lưu trữ; Proxy; Web server; Mail server; File server',
      href: '/giai-phap/ha-tang/may-chu-server',
    },
    {
      slug: 'kiem-soat-ra-vao-cham-cong',
      title: 'Giải pháp kiểm soát ra vào, chấm công vân tay, khuôn mặt',
      href: '/giai-phap/ha-tang/kiem-soat-ra-vao-cham-cong',
    },
  ]

  const servicePages = [
    {
      slug: 'thi-cong-mang-wifi-camera',
      title: 'Thiết kế, thi công hệ thống mạng nội bộ, Wifi, Camera, Kiểm soát ra vào',
      href: '/dich-vu/dich-vu-cntt/thi-cong-mang-wifi-camera',
    },
    {
      slug: 'bao-tri-it',
      title: 'Bảo trì và xử lý sự cố IT',
      href: '/dich-vu/dich-vu-cntt/bao-tri-it',
    },
    {
      slug: 'hosting-website',
      title: 'Cung cấp tên miền, hosting, thiết kế website',
      href: '/dich-vu/dich-vu-cntt/hosting-website',
    },
    {
      slug: 'chu-ky-so-hoa-don-dien-tu',
      title: 'Chữ ký số, hóa đơn điện tử, hợp đồng điện tử',
      href: '/dich-vu/dich-vu-cntt/chu-ky-so-hoa-don-dien-tu',
    },
    {
      slug: 'name-card-dien-tu',
      title: 'Name card điện tử cá nhân, doanh nghiệp',
      href: '/dich-vu/dich-vu-cntt/name-card-dien-tu',
    },
    {
      slug: 'phat-trien-phan-mem',
      title: 'Phát triển phần mềm theo yêu cầu',
      href: '/dich-vu/dich-vu-cntt/phat-trien-phan-mem',
    },
    {
      slug: 'tu-van-chuyen-doi-so',
      title: 'Tư vấn, đào tạo chuyển đổi số',
      href: '/dich-vu/dich-vu-cntt/tu-van-chuyen-doi-so',
    },
  ]

  const ecosystemGroups = [
    {
      icon: Smartphone,
      label: 'Sản phẩm',
      title: 'Phần mềm',
      href: '/phan-mem',
      desc: 'Các nền tảng iOrder phục vụ vận hành, đồng bộ dữ liệu và nghiệp vụ chuyên biệt.',
      items: softwareProducts.map((item) => ({
        title: item.title,
        href: `/phan-mem/${item.slug}`,
      })),
    },
    {
      icon: Server,
      label: 'Hạ tầng',
      title: 'Giải pháp hạ tầng mạng',
      href: '/giai-phap/ha-tang',
      desc: 'Thiết kế hệ thống mạng, máy chủ, bảo mật và thiết bị nền tảng cho vận hành ổn định.',
      items: solutionPages.map((item) => ({
        title: item.title,
        href: item.href,
      })),
    },
    {
      icon: Headphones,
      label: 'Triển khai',
      title: 'Dịch vụ CNTT',
      href: '/giai-phap/dich-vu-cntt',
      desc: 'Đội ngũ kỹ thuật hỗ trợ thi công, bảo trì, phần mềm, hóa đơn điện tử và chuyển đổi số.',
      items: servicePages.map((item) => ({
        title: item.title,
        href: item.href,
      })),
    },
  ]

  useEffect(() => {
    const pageTitles = {
      '/': 'iOrder - Trang chủ',
    }
    document.title = pageTitles[location.pathname] ?? 'iOrder - Phần mềm quản lý bán hàng'
    setPageSeo({
      title: 'iOrder - Phần mềm quản lý bán hàng',
      description: 'iOrder hỗ trợ POS bán hàng, order tại bàn, quản lý kho, nhân viên và báo cáo doanh thu cho nhà hàng, cafe, bán lẻ và chuỗi cửa hàng.'
    })
    setMobileOpen(false)

    if (location.pathname.startsWith('/phan-mem')) {
      setActiveDropdown('software')
    } else if (location.pathname.startsWith('/giai-phap')) {
      setActiveDropdown('solutions')
    } else if (location.pathname.startsWith('/dich-vu')) {
      setActiveDropdown('services')
    } else {
      setActiveDropdown(null)
    }
  }, [location.pathname])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveHeroSlide((current) => (current + 1) % heroSlides.length)
    }, 4500)

    return () => window.clearInterval(timer)
  }, [])

  const goToHeroSlide = (direction) => {
    setActiveHeroSlide((current) => {
      if (direction === 'next') return (current + 1) % heroSlides.length
      return (current - 1 + heroSlides.length) % heroSlides.length
    })
  }

  const homeNews = Array.from({ length: Math.min(3, newsArticles.length) }, (_, index) => {
    return newsArticles[(activeNewsIndex + index) % newsArticles.length]
  })

  const goToNews = (direction) => {
    setActiveNewsIndex((current) => {
      if (direction === 'next') return (current + 1) % newsArticles.length
      return (current - 1 + newsArticles.length) % newsArticles.length
    })
  }

  return (
    <div className="page-shell home-shell">
      <Header 
        activeDropdown={activeDropdown}
        setActiveDropdown={setActiveDropdown}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        location={location}
        logoMain={logoMain}
        softwareProducts={softwareProducts}
        solutionPages={solutionPages}
        servicePages={servicePages}
      />

      <main>
        {/* Hero Section */}
        <section className="hero">
          <div className="container hero-grid">
            <div className="hero-content">
              <span className="eyebrow">
                <CheckCircle size={16} />
                Tìm kiếm giải pháp quản lý bán hàng?
              </span>
              <h1>
                Phần mềm quản lý <span>hiệu quả</span> cho mô hình kinh doanh của bạn
              </h1>
              <p>Nền tảng tích hợp hệ thống POS, quản lý kho, nhân viên và báo cáo chi tiết - tối ưu cho nhà hàng, quán café, bán lẻ và chuỗi cửa hàng.</p>

              <div className="hero-points">
                <div className="hero-point">
                  <CheckCircle size={20} />
                  <span>Triển khai nhanh</span>
                </div>
                <div className="hero-point">
                  <CheckCircle size={20} />
                  <span>Hỗ trợ 24/7</span>
                </div>
                <div className="hero-point">
                  <CheckCircle size={20} />
                  <span>Dễ sử dụng</span>
                </div>
                <div className="hero-point">
                  <CheckCircle size={20} />
                  <span>An toàn</span>
                </div>
              </div>

              <div className="hero-actions">
                <button className="btn large primary">
                  <span>Dùng thử miễn phí</span>
                </button>
                <button className="btn large outline">
                  <span>Xem demo</span>
                  <small>Video hướng dẫn</small>
                </button>
              </div>
            </div>

            <div className="hero-visual">
              <div className="hero-carousel" aria-label="Ảnh giới thiệu iOrder">
                <div className="hero-carousel-frame">
                  {heroSlides.map((slide, index) => (
                    <div
                      key={slide.title}
                      className={`hero-slide ${index === activeHeroSlide ? 'active' : ''}`}
                      aria-hidden={index !== activeHeroSlide}
                    >
                      <img src={slide.image} alt={slide.title} />
                      <div className="hero-slide-copy">
                        <b>{slide.title}</b>
                        <span>{slide.caption}</span>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    className="hero-carousel-arrow prev"
                    aria-label="Ảnh trước"
                    onClick={() => goToHeroSlide('prev')}
                  >
                    <ChevronLeft size={22} />
                  </button>

                  <button
                    type="button"
                    className="hero-carousel-arrow next"
                    aria-label="Ảnh tiếp theo"
                    onClick={() => goToHeroSlide('next')}
                  >
                    <ChevronRight size={22} />
                  </button>
                </div>

                <div className="hero-carousel-dots" aria-label="Chọn ảnh">
                  {heroSlides.map((slide, index) => (
                    <button
                      key={slide.title}
                      type="button"
                      className={index === activeHeroSlide ? 'active' : ''}
                      aria-label={`Xem ${slide.title}`}
                      onClick={() => setActiveHeroSlide(index)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Intro Section */}
        <section className="section home-intro-section intro-section">
          <div className="container about-panel">
            <div className="about-copy">
              <span className="section-eyebrow">GIỚI THIỆU</span>
              <h2>iOrder là hệ sinh thái phần mềm, giải pháp và dịch vụ cho vận hành cửa hàng.</h2>
              <p>
                iOrder hỗ trợ từ bán hàng tại quầy, order tại bàn, in bếp/bar, quản lý kho, nhân viên, khách hàng đến báo cáo doanh thu. Mục tiêu là giúp chủ cửa hàng giảm ghi chép thủ công, nhìn rõ dữ liệu và chuẩn hóa quy trình khi mở rộng.
              </p>
              <p>
                Ngoài phần mềm, iOrder còn đồng hành ở các phần triển khai thực tế: thiết bị bán hàng, máy in, mã vạch, hạ tầng mạng, website, hosting, chữ ký số, hóa đơn điện tử và phát triển phần mềm theo yêu cầu.
              </p>
              <div className="about-chip-row">
                {['POS bán hàng', 'Order tại bàn', 'Quản lý kho', 'Báo cáo doanh thu', 'Hạ tầng & thiết bị', 'Dịch vụ CNTT'].map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            </div>

            <div className="about-values">
              {[
                { title: 'Phần mềm bán hàng', desc: 'POS, order tại bàn, in hóa đơn, in bếp/bar, thanh toán và chốt ca cho bán lẻ, cafe, nhà hàng.' },
                { title: 'Quản trị vận hành', desc: 'Tồn kho, nhân viên, phân quyền, khách hàng, chi nhánh và báo cáo doanh thu theo thời gian thực.' },
                { title: 'Giải pháp hạ tầng', desc: 'Tư vấn mạng nội bộ, wifi, camera, máy chủ, kiểm soát ra vào và thiết bị bán hàng tại điểm bán.' },
                { title: 'Dịch vụ CNTT', desc: 'Hosting, website, bảo trì IT, chữ ký số, hóa đơn điện tử và phát triển phần mềm theo yêu cầu.' },
                { title: 'Phù hợp nhiều mô hình', desc: 'Nhà hàng, cafe, trà sữa, mini mart, bán lẻ, tạp hóa, dịch vụ và chuỗi nhiều chi nhánh.' },
                { title: 'Triển khai thực tế', desc: 'Khảo sát nhu cầu, nhập dữ liệu, cài thiết bị, đào tạo nhân viên và hỗ trợ sau khi vận hành.' },
              ].map((item) => (
                <div className="about-value-card" key={item.title}>
                  <CheckCircle size={22} />
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Partners Section */}
        <section className="section partners-section">
          <div className="container">
            <div className="section-title">
              <p>Được tin tưởng bởi 150+ doanh nghiệp</p>
              <h2>Danh sách đối tác</h2>
              <p>
                iOrder đồng hành cùng các đơn vị thanh toán, giao vận, hạ tầng, thiết bị và dịch vụ số để tạo nên hệ sinh thái triển khai trọn vẹn cho cửa hàng.
              </p>
            </div>

            <div className="home-partner-marquee partner-marquee" aria-hidden="false">
              <div className="home-partner-track partner-track">
                {partnerItems.map((p, idx) => (
                  <div key={`a-${idx}`} className="model-card" title={p.name}>
                    <img src={p.src} alt={p.name} />
                    <div className="home-partner-info">
                      <span>{p.desc}</span>
                    </div>
                  </div>
                ))}
                {partnerItems.map((p, idx) => (
                  <div key={`b-${idx}`} className="model-card" title={p.name}>
                    <img src={p.src} alt={p.name} />
                    <div className="home-partner-info">
                      <span>{p.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Industry Solutions Section */}
        <section className="section industry-section">
          <div className="container">
            <div className="section-title">
              <span className="section-eyebrow">THEO NGÀNH HÀNG</span>
              <h2>Thiết kế phần mềm quản lý bán hàng chuyên biệt cho từng mô hình</h2>
              <p>iOrder có thể cấu hình theo đặc thù bán lẻ, F&B, dịch vụ, lưu trú và làm đẹp để quy trình triển khai sát thực tế hơn.</p>
            </div>

            <div className="industry-grid">
              {industryGroups.map((group, groupIndex) => {
                const GroupIcon = [Store, Utensils, ShieldCheck][groupIndex] ?? Store
                return (
                  <div className="industry-group" key={group.title}>
                    <div className="industry-group-title">
                      <span><GroupIcon size={24} /></span>
                      <h3>{group.title}</h3>
                    </div>
                    <div className="industry-list">
                      {group.items.map((item) => (
                        <Link to={`/nganh-hang/${item.slug}`} className="industry-item" key={item.slug}>
                          <CheckCircle size={18} />
                          <div>
                            <strong>{item.title}</strong>
                            <p>{item.desc}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="section feature-showcase-section">
          <div className="container">
            <div className="section-title">
              <span className="section-eyebrow">TÍNH NĂNG</span>
              <h2>Tính năng toàn diện, đơn giản nhưng mạnh mẽ</h2>
            </div>
            <div className="feature-grid">
              {featureTabs[0].items.map((item, idx) => {
                const Icon = item.icon
                return (
                  <div key={idx} className="feature-card">
                    <Icon size={40} />
                    <h3>{item.title}</h3>
                    <p>{item.desc}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Deployment Section */}
        <section className="section deployment-section">
          <div className="container deployment-grid">
            <div className="deployment-copy">
              <span className="section-eyebrow">TRIỂN KHAI IORDER</span>
              <h2>Từ tư vấn đến vận hành trong một quy trình rõ ràng</h2>
              <p>iOrder không chỉ bàn giao phần mềm. Đội ngũ triển khai sẽ hỗ trợ chuẩn hóa dữ liệu, cấu hình thiết bị, đào tạo nhân viên và kiểm tra ca bán đầu tiên.</p>
              <Link to="/lien-he" className="btn primary deployment-link">
                Nhận tư vấn triển khai <ArrowRight size={18} />
              </Link>
            </div>

            <div className="deployment-visual deployment-model-feature">
              <img src={posIotImage} alt="Mô hình máy POS kết nối thiết bị IoT iOrder" />
            </div>

            <div className="deployment-steps">
              {[
                { title: 'Tư vấn mô hình', desc: 'Xác định bạn dùng iOrder cho bán lẻ, cafe, nhà hàng hay chuỗi nhiều chi nhánh.' },
                { title: 'Chuẩn hóa dữ liệu', desc: 'Nhập danh mục sản phẩm, menu, giá bán, nhân viên và tồn kho ban đầu.' },
                { title: 'Cài đặt thiết bị', desc: 'Kết nối máy in hóa đơn, in bếp/bar, máy quét mã vạch và thiết bị bán hàng.' },
                { title: 'Đào tạo vận hành', desc: 'Hướng dẫn nhân viên bán hàng, gọi món, chốt ca và xem báo cáo quản lý.' },
              ].map((step, index) => (
                <div className="deployment-step" key={step.title}>
                  <span>{index + 1}</span>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="deployment-models">
              {deploymentModels.map((model) => (
                <article className="deployment-model-card" key={model.title}>
                  <div className="deployment-model-image">
                    <img src={model.image} alt={`${model.title} iOrder`} />
                  </div>
                  <div>
                    <h3>{model.title}</h3>
                    <p>{model.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Solutions Section (added) */}
        <section id="giai-phap" className="section">
          <div className="container">
            <div className="section-title">
              <span className="section-eyebrow">HỆ SINH THÁI</span>
              <h2>Phần mềm, giải pháp và dịch vụ triển khai</h2>
              <p>Những nhóm nội dung bên dưới được đồng bộ với menu chính để khách truy cập đi từ trang chủ đến đúng danh mục cần tìm.</p>
            </div>

            <div className="solution-grid ecosystem-grid">
              {ecosystemGroups.map((group) => {
                const Icon = group.icon
                return (
                  <article className="ecosystem-card" key={group.title}>
                    <div className="ecosystem-card-head">
                      <div className="ecosystem-icon">
                        <Icon size={24} />
                      </div>
                      <div>
                        <span>{group.label}</span>
                        <h3><a href={group.href}>{group.title}</a></h3>
                      </div>
                    </div>
                    <p className="ecosystem-desc">{group.desc}</p>
                    <ul>
                      {group.items.map((item) => (
                        <li key={item.href}>
                          <a href={item.href}>{item.title}</a>
                        </li>
                      ))}
                    </ul>
                    <a className="ecosystem-link" href={group.href}>
                      Xem {group.items.length} mục <ArrowRight size={16} />
                    </a>
                  </article>
                )
              })}
            </div>
          </div>
        </section>

        {/* News Section */}
        <section className="section home-news-section">
          <div className="container">
            <div className="home-news-heading">
              <div className="section-title">
                <span className="section-eyebrow">TIN TỨC IORDER</span>
                <h2>Bài viết nổi bật về vận hành cửa hàng</h2>
                <p>Các hướng dẫn ngắn giúp chủ cửa hàng hiểu rõ hơn cách iOrder hỗ trợ bán hàng, order tại bàn, quản lý kho và báo cáo doanh thu.</p>
              </div>
              <Link to="/tin-tuc" className="home-news-all">
                Xem tất cả bài viết <ArrowRight size={16} />
              </Link>
            </div>

            <div className="home-news-carousel">
              <button
                type="button"
                className="home-news-arrow prev"
                aria-label="Bài trước"
                onClick={() => goToNews('prev')}
              >
                <ChevronLeft size={22} />
              </button>

              <div className="home-news-grid">
                {homeNews.map((article) => (
                  <Link to={`/tin-tuc/${article.slug}`} className="home-news-card" key={article.slug}>
                    <div className="home-news-image">
                      <img src={article.image} alt={article.imageAlt} />
                    </div>
                    <div className="home-news-copy">
                      <span>{article.category}</span>
                      <h3>{article.title}</h3>
                      <p>{article.excerpt}</p>
                      <b>
                        Xem thêm <ArrowRight size={16} />
                      </b>
                    </div>
                  </Link>
                ))}
              </div>

              <button
                type="button"
                className="home-news-arrow next"
                aria-label="Bài tiếp theo"
                onClick={() => goToNews('next')}
              >
                <ChevronRight size={22} />
              </button>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="section" style={{ textAlign: 'center', padding: '60px 0' }}>
          <div className="container">
            <h2 style={{ fontSize: 'clamp(28px, 3vw, 42px)', marginBottom: '20px' }}>Sẵn sàng tăng cường bán hàng?</h2>
            <p style={{ fontSize: '18px', color: 'var(--muted)', marginBottom: '30px', maxWidth: '600px', margin: '0 auto 30px' }}>
              Hãy trải nghiệm miễn phí trong 14 ngày. Không cần thẻ tín dụng, hủy bất cứ lúc nào.
            </p>
            <a href="https://app.iorder.vn/register-trial" className="btn primary" style={{ display: 'inline-block', minWidth: '200px' }}>
              Bắt đầu dùng thử
            </a>
          </div>
        </section>
      </main>

      <Footer logoFooter={logoFooter} />
    </div>
  )
}
