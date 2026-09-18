import { useState, useEffect, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { HOMEPAGE_SECTION_ORDER } from '@iorder/contracts'
import PageLayout from '../components/PageLayout'
import SafeImage from '../components/SafeImage'
import { setPageSeo } from '../utils/seo'
import { externalLinks, servicePages, softwareProducts, solutionPages } from '../data/siteContent'
import {
  fetchHomepage,
  fetchHomepagePreview,
  fetchNavOfferings,
  fetchPartners,
  fetchPublishedPosts,
  fetchTestimonials,
} from '../utils/contentApi'
import {
  BarChart3,
  Boxes,
  CheckCircle,
  Headphones,
  Printer,
  ReceiptText,
  ShieldCheck,
  Smartphone,
  Users,
  Utensils,
  Store,
  Building2,
  Rocket,
  Server,
  ArrowRight,
  CirclePlay,
  ChevronLeft,
  ChevronRight,
  Quote,
  ChevronDown,
  Shirt,
  ShoppingCart,
  Sparkles,
  Wrench,
  Pill,
  UtensilsCrossed,
  Coffee,
  Music,
  Wine,
  Truck,
  Flower2,
  Scissors,
  BedDouble,
  TreePine,
  Dumbbell,
  Stethoscope,
  Zap,
  Target,
  Heart,
  Award,
} from 'lucide-react'

import heroIorderSuite from '../assets/products/hero-iorder-suite.png'
import heroPosFnb from '../assets/products/hero-pos-fnb-cutout.png'
import heroPosRetail from '../assets/products/hero-pos-retail-cutout.png'
import heroDashboard from '../assets/products/hero-dashboard-cutout.png'
import posIotImage from '../assets/products/mh-pos-iot.png'
import dashboardLaptop from '../assets/products/documentation/iorder-laptop-dashboard-front.png'
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
import logoTTC from '../assets/partners/ttc.png'
import { newsArticles } from '../data/newsArticles'
import { industryGroups } from '../data/industrySolutions'

const overlayGradients = {
  none: 'linear-gradient(transparent, transparent)',
  light: 'linear-gradient(rgba(255,255,255,.62), rgba(255,255,255,.62))',
  'dark-soft': 'linear-gradient(rgba(8,18,35,.36), rgba(8,18,35,.36))',
  'dark-medium': 'linear-gradient(rgba(8,18,35,.58), rgba(8,18,35,.58))',
}

function cmsSectionProps(block, media) {
  const appearance = block?.appearance
  if (!appearance) return { 'data-cms-section': block?.type }
  const desktop = appearance.backgroundMediaId ? media.get(appearance.backgroundMediaId)?.publicUrl : null
  const mobile = appearance.mobileBackgroundMediaId ? media.get(appearance.mobileBackgroundMediaId)?.publicUrl : desktop
  const imageValue = (url) => (url ? `url(${JSON.stringify(url)})` : 'none')
  return {
    'data-cms-section': block.type,
    className: 'cms-section-appearance',
    style: {
      '--cms-bg-desktop': imageValue(desktop),
      '--cms-bg-mobile': imageValue(mobile),
      '--cms-bg-color': appearance.backgroundColor ?? 'transparent',
      '--cms-bg-fit': appearance.backgroundFit,
      '--cms-bg-position': `${appearance.focalPointX}% ${appearance.focalPointY}%`,
      '--cms-bg-overlay': overlayGradients[appearance.overlay] ?? overlayGradients.none,
    },
  }
}

function mergeSectionProps(baseClassName, baseStyle, block, media) {
  const appearance = cmsSectionProps(block, media)
  return {
    ...appearance,
    className: `${baseClassName}${appearance.className ? ` ${appearance.className}` : ''}`,
    style: { ...baseStyle, ...appearance.style },
  }
}

function getItemIcon(title = '') {
  const t = title.toLowerCase()
  if (t.includes('thời trang')) return Shirt
  if (t.includes('điện thoại') || t.includes('điện máy')) return Smartphone
  if (t.includes('tạp hóa') || t.includes('siêu thị')) return ShoppingCart
  if (t.includes('mỹ phẩm') || t.includes('làm đẹp')) return Sparkles
  if (t.includes('vật liệu') || t.includes('nội thất') || t.includes('xây dựng') || t.includes('máy móc')) return Wrench
  if (t.includes('nhà thuốc') || t.includes('phòng khám')) return Stethoscope
  if (t.includes('thuốc') || t.includes('y tế')) return Pill
  if (t.includes('nhà hàng')) return UtensilsCrossed
  if (t.includes('cafe') || t.includes('trà sữa') || t.includes('cà phê')) return Coffee
  if (t.includes('quán ăn') || t.includes('canteen') || t.includes('căn tin')) return Utensils
  if (t.includes('karaoke') || t.includes('bida') || t.includes('giải trí')) return Music
  if (t.includes('bar') || t.includes('pub') || t.includes('club')) return Wine
  if (t.includes('trạm dừng') || t.includes('vận tải')) return Truck
  if (t.includes('spa') || t.includes('massage') || t.includes('beauty')) return Flower2
  if (t.includes('hair') || t.includes('salon') || t.includes('nails') || t.includes('nails')) return Scissors
  if (t.includes('khách sạn') || t.includes('nhà nghỉ')) return BedDouble
  if (t.includes('homestay') || t.includes('villa') || t.includes('resort')) return TreePine
  if (t.includes('fitness') || t.includes('yoga') || t.includes('gym')) return Dumbbell
  if (t.includes('nông sản') || t.includes('thực phẩm')) return Flower2
  if (t.includes('xe') || t.includes('máy móc')) return Wrench
  if (t.includes('mẹ') || t.includes('bé') || t.includes('trẻ em')) return CheckCircle
  if (t.includes('sách') || t.includes('văn phòng')) return ReceiptText
  if (t.includes('hoa') || t.includes('quà tặng')) return Sparkles
  if (t.includes('sản xuất')) return Building2
  return Store
}

function buildFallbackIndustryGroups() {
  return industryGroups.map((group, index) => ({
    ...group,
    icon: [Store, Utensils, ShieldCheck][index] ?? Store,
    items: group.items.map((item) => ({ ...item, href: `/nganh-hang/${item.slug}` })),
  }))
}

const featureTabs = [
  {
    id: 'all',
    label: 'Tất cả',
    items: [
      {
        icon: ReceiptText,
        title: 'Bán hàng tại quầy nhanh & chính xác',
        desc: 'Giao diện POS cảm ứng trực quan, chốt đơn chỉ vài thao tác. Hỗ trợ thanh toán tiền mặt, chuyển khoản, QR và quét mã vạch.',
        bullets: [
          'Màn hình bán hàng tối ưu tốc độ',
          'Tích hợp máy in bill, máy in bếp/bar',
          'Chốt ca, kiểm doanh thu theo ca làm việc',
        ],
      },
      {
        icon: Boxes,
        title: 'Tồn kho thời gian thực, không cần đếm tay',
        desc: 'Mỗi giao dịch tự động trừ tồn kho, cảnh báo khi hàng sắp hết. Không cần kiểm kho thủ công cuối ngày.',
        bullets: [
          'Nhập/xuất kho nhanh bằng mã vạch',
          'Cảnh báo hàng tồn thấp tự động',
          'Xem lịch sử xuất nhập theo thời gian',
        ],
      },
      {
        icon: Users,
        title: 'Quản lý nhân viên & ca làm việc',
        desc: 'Phân quyền chi tiết từng nhân viên, theo dõi ca làm việc và chấm công. Xem doanh thu theo từng nhân viên bán hàng.',
        bullets: [
          'Phân quyền theo vai trò linh hoạt',
          'Chốt ca tự động, báo cáo hiệu suất',
          'Chấm công, tính lương theo ca',
        ],
      },
      {
        icon: BarChart3,
        title: 'Báo cáo kinh doanh trực quan & chi tiết',
        desc: 'Dashboard doanh thu cập nhật theo ngày, tuần, tháng. Biểu đồ rõ ràng giúp chủ cửa hàng ra quyết định nhanh.',
        bullets: [
          'Doanh thu theo sản phẩm, nhóm hàng',
          'Lợi nhuận, chi phí, hàng bán chạy',
          'Xuất báo cáo Excel, in trực tiếp',
        ],
      },
      {
        icon: Printer,
        title: 'In hóa đơn, in bếp tức thì',
        desc: 'Kết nối nhiều máy in cùng lúc — bill tại quầy, phiếu bếp/bar, tem mã vạch. Hỗ trợ USB, LAN và WiFi.',
        bullets: ['In nhiều bếp/bar khác nhau', 'Tự động in khi đặt món', 'Tùy chỉnh mẫu bill theo thương hiệu'],
      },
      {
        icon: Smartphone,
        title: 'Ứng dụng di động — quản lý mọi lúc mọi nơi',
        desc: 'Xem doanh thu, duyệt đơn hàng và kiểm tồn kho ngay trên điện thoại. Không cần ngồi tại cửa hàng vẫn nắm được tình hình.',
        bullets: ['Theo dõi doanh thu real-time', 'Duyệt đơn, nhập kho từ xa', 'Thông báo khi hết hàng, đơn mới'],
      },
    ],
  },
]

const heroSlides = [
  { image: heroIorderSuite, width: 1254, height: 1254, title: 'Nền tảng iOrder đa thiết bị' },
  { image: heroPosFnb, width: 1536, height: 1024, title: 'Bán hàng nhanh tại quầy' },
  { image: heroPosRetail, width: 1536, height: 1024, title: 'Quản lý bán lẻ trực quan' },
  { image: heroDashboard, width: 1254, height: 1254, title: 'Báo cáo vận hành thời gian thực' },
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

const staticTestimonials = [
  {
    quote: 'Trước mình phải mở sổ rồi đối chiếu từng ca. Giờ cuối ngày mở báo cáo iOrder lên kiểm tra là được.',
    name: 'Anh Minh',
    role: 'Chủ cửa hàng',
    company: 'Cửa hàng đối tác iOrder',
  },
  {
    quote:
      'Trước đây xuất kho xong đôi lúc phải kiểm tra lại khá nhiều. Giờ mỗi lần xuất đều có lịch sử nên cuối tháng đối chiếu nhanh hơn.',
    name: 'Chị Hà',
    role: 'Quản lý cửa hàng',
    company: 'Cửa hàng đối tác iOrder',
  },
  {
    quote: 'Nhân viên mới làm quen khá nhanh. Những thao tác bán hàng cơ bản hướng dẫn một lúc là có thể sử dụng.',
    name: 'Anh Tuấn',
    role: 'Chủ cửa hàng',
    company: 'Cửa hàng đối tác iOrder',
  },
]

const iconByKey = {
  store: Store,
  utensils: Utensils,
  shield: ShieldCheck,
  smartphone: Smartphone,
  server: Server,
  headphones: Headphones,
  check: CheckCircle,
}

const faqItems = [
  {
    q: 'iOrder có dùng thử miễn phí không?',
    a: 'Có. iOrder cung cấp 14 ngày dùng thử đầy đủ tính năng, không cần thẻ tín dụng. Bạn có thể đăng ký ngay tại app.iorder.vn và bắt đầu trải nghiệm ngay hôm nay.',
  },
  {
    q: 'Mất bao lâu để triển khai và đưa vào vận hành?',
    a: 'Phần lớn cửa hàng triển khai xong trong 1–3 ngày. Đội ngũ iOrder hỗ trợ nhập dữ liệu ban đầu (menu, sản phẩm, nhân viên), cài thiết bị và đào tạo nhân viên tại chỗ.',
  },
  {
    q: 'iOrder phù hợp với mô hình kinh doanh nào?',
    a: 'iOrder phục vụ bán lẻ, F&B (nhà hàng, cafe, trà sữa, quán ăn), dịch vụ, lưu trú và làm đẹp. Phần mềm có thể cấu hình theo đặc thù từng ngành để tối ưu quy trình vận hành.',
  },
  {
    q: 'Có thể quản lý nhiều chi nhánh trên cùng một tài khoản không?',
    a: 'Có. Gói Chuyên nghiệp hỗ trợ tới 3 chi nhánh, gói Doanh nghiệp không giới hạn. Bạn xem báo cáo tổng hợp và từng chi nhánh, đồng bộ menu và quản lý nhân viên tập trung từ một màn hình.',
  },
  {
    q: 'Nếu gặp sự cố kỹ thuật thì liên hệ hỗ trợ như thế nào?',
    a: 'iOrder hỗ trợ qua hotline, Zalo OA và email. Gói Chuyên nghiệp và Doanh nghiệp được hỗ trợ 24/7. Thời gian phản hồi trung bình dưới 30 phút trong giờ hành chính.',
  },
  {
    q: 'iOrder có tích hợp với các nền tảng giao đồ ăn và thanh toán không?',
    a: 'Có. iOrder tích hợp với ShopeeFood, GrabFood, các cổng thanh toán điện tử phổ biến và hệ thống hóa đơn điện tử. Danh sách tích hợp được mở rộng liên tục theo nhu cầu thị trường.',
  },
]

export default function Home() {
  const [activeHeroSlide, setActiveHeroSlide] = useState(0)
  const [activeFeatureIndex, setActiveFeatureIndex] = useState(0)
  const [activeNewsIndex, setActiveNewsIndex] = useState(0)
  const previewToken =
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('cmsPreview') : null
  const previewTheme =
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('cmsTheme') : null
  const [cmsHomepage, setCmsHomepage] = useState(() => {
    if (previewToken) return null
    try {
      const raw = sessionStorage.getItem('cms_hp')
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })
  const [cmsPosts, setCmsPosts] = useState([])
  const [cmsNav, setCmsNav] = useState(null)
  const [tablePartners, setTablePartners] = useState([])
  const [tableTestimonials, setTableTestimonials] = useState([])
  const [openFaq, setOpenFaq] = useState(null)
  const location = useLocation()

  useEffect(() => {
    fetchNavOfferings()
      .then(setCmsNav)
      .catch(() => {})
    fetchPartners()
      .then(setTablePartners)
      .catch(() => {})
    fetchTestimonials()
      .then(setTableTestimonials)
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!previewToken || !['light', 'dark'].includes(previewTheme)) return undefined
    const root = document.documentElement
    const previous = root.getAttribute('data-theme')
    if (previewTheme === 'dark') root.setAttribute('data-theme', 'dark')
    else root.removeAttribute('data-theme')
    return () => {
      if (previous) root.setAttribute('data-theme', previous)
      else root.removeAttribute('data-theme')
    }
  }, [previewTheme, previewToken])

  // Count-up animation for numeric stat elements
  useEffect(() => {
    const targets = document.querySelectorAll('[data-count-to]')
    if (!targets.length) return
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          const el = entry.target
          const to = parseFloat(el.dataset.countTo)
          const suffix = el.dataset.countSuffix ?? ''
          const duration = 1500
          let start = null
          const step = (ts) => {
            if (!start) start = ts
            const p = Math.min((ts - start) / duration, 1)
            const ease = 1 - Math.pow(1 - p, 3)
            el.textContent = Math.round(ease * to) + suffix
            if (p < 1) requestAnimationFrame(step)
          }
          requestAnimationFrame(step)
          obs.unobserve(el)
        })
      },
      { threshold: 0.6 },
    )
    targets.forEach((el) => obs.observe(el))
    return () => obs.disconnect()
  }, [cmsHomepage])

  useEffect(() => {
    let active = true
    const loadHomepage = previewToken ? fetchHomepagePreview(previewToken) : fetchHomepage()
    void loadHomepage
      .then((payload) => {
        if (!active) return
        setCmsHomepage(payload)
        if (!previewToken)
          try {
            sessionStorage.setItem('cms_hp', JSON.stringify(payload))
          } catch {}
      })
      .catch(() => {
        if (active) setCmsHomepage(null)
      })
    return () => {
      active = false
    }
  }, [previewToken])

  // Live preview: nhận bản nháp CMS đang gõ qua postMessage — CHỈ khi đang ở chế độ cmsPreview
  // (đã có token) và đã load xong dữ liệu preview lần đầu (mới có sẵn { media } để merge).
  // Media mới upload chưa có trong danh sách vẫn giữ ảnh cũ/bỏ qua — sẽ hiện đúng sau nhịp autosave + refresh.
  const hasCmsHomepage = Boolean(cmsHomepage)

  useEffect(() => {
    if (!previewToken || !hasCmsHomepage) return undefined
    const allowedOrigin = (origin) => {
      const adminOrigin = import.meta.env.VITE_ADMIN_ORIGIN
      if (adminOrigin && origin === adminOrigin) return true
      try {
        const hostname = new URL(origin).hostname
        return hostname === 'localhost' || hostname === '127.0.0.1'
      } catch {
        return false
      }
    }
    const onMessage = (event) => {
      if (event.data?.type !== 'iorder-cms-draft') return
      if (!allowedOrigin(event.origin)) return
      const payload = event.data.payload
      if (!payload || !Array.isArray(payload.blocks)) return
      setCmsHomepage((current) => ({
        ...current,
        item: {
          ...current?.item,
          title: payload.title,
          seoTitle: payload.seoTitle,
          seoDescription: payload.seoDescription,
          canonicalUrl: payload.canonicalUrl,
          blocks: payload.blocks,
        },
      }))
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [hasCmsHomepage, previewToken])

  const cmsMedia = useMemo(() => new Map((cmsHomepage?.media ?? []).map((asset) => [asset.id, asset])), [cmsHomepage])
  const cmsBlock = (type) => cmsHomepage?.item?.blocks?.find((block) => block.type === type && block.isEnabled)
  const cmsHero = cmsBlock('home_hero')
  const cmsStats = cmsBlock('home_stats')
  const cmsFeatures = cmsBlock('home_features')
  const cmsIndustry = cmsBlock('home_industries')
  const cmsEcosystem = cmsBlock('home_ecosystem_services')
  const cmsProcess = cmsBlock('home_process')
  const cmsTestimonials = cmsBlock('home_testimonials')
  const cmsFeaturedPosts = cmsBlock('home_featured_posts')
  const featuredPostsLimit = cmsFeaturedPosts?.data?.limit
  const featuredPostsType = cmsFeaturedPosts?.data?.postType
  const cmsFaq = cmsBlock('home_faq')
  const cmsCta = cmsBlock('home_cta')
  const isCmsMode = hasCmsHomepage
  const shouldShow = (type) => !isCmsMode || Boolean(cmsBlock(type))
  const blockOrder = (type) => {
    const savedIndex = cmsHomepage?.item?.blocks?.findIndex((block) => block.type === type) ?? -1
    return savedIndex >= 0 ? savedIndex : HOMEPAGE_SECTION_ORDER.indexOf(type)
  }
  const resolvedHeroSlides = isCmsMode
    ? (cmsHero?.data?.slides ?? [])
        .map((slide) => ({
          image: cmsMedia.get(slide.imageMediaId)?.publicUrl,
          width: cmsMedia.get(slide.imageMediaId)?.width ?? 1600,
          height: cmsMedia.get(slide.imageMediaId)?.height ?? 900,
          title: slide.title,
          caption: slide.description,
        }))
        .filter((slide) => slide.image)
    : heroSlides
  const heroVisual = resolvedHeroSlides[activeHeroSlide % resolvedHeroSlides.length] ?? heroSlides[0]
  const heroPoints = cmsHero?.data?.points?.length
    ? cmsHero.data.points.map((label) => ({ label, detail: null }))
    : [
        { label: 'Dễ sử dụng', detail: 'Bắt đầu nhanh chóng' },
        { label: 'Triển khai nhanh', detail: 'Sẵn sàng vận hành' },
        { label: 'Hỗ trợ 24/7', detail: 'Luôn đồng hành' },
      ]
  // Ưu tiên danh sách Đối tác quản lý ở CMS (bảng partners) → logo nhúng trong block home_stats → fallback logo tĩnh
  // partnersLimit (cấu hình hiển thị của block home_stats) áp dụng cho cả nguồn kho chung lẫn nguồn nhúng cũ.
  const cmsBlockPartners = isCmsMode
    ? (cmsStats?.data?.partners ?? [])
        .map((item) => ({ src: cmsMedia.get(item.mediaId)?.publicUrl, name: item.name, websiteUrl: item.websiteUrl }))
        .filter((item) => item.src)
    : []
  const partnersLimit = isCmsMode ? (cmsStats?.data?.partnersLimit ?? 12) : undefined
  const resolvedPartnersRaw =
    tablePartners.length > 0 ? tablePartners : cmsBlockPartners.length > 0 ? cmsBlockPartners : partnerItems
  const resolvedPartners = partnersLimit ? resolvedPartnersRaw.slice(0, partnersLimit) : resolvedPartnersRaw
  // Ưu tiên đánh giá quản lý ở CMS (bảng) → block home_testimonials → fallback tĩnh
  // limit (cấu hình hiển thị của block home_testimonials) áp dụng cho cả nguồn kho chung lẫn nguồn nhúng cũ.
  const testimonialsLimit = isCmsMode ? (cmsTestimonials?.data?.limit ?? 6) : undefined
  const resolvedTestimonialsRaw =
    tableTestimonials.length > 0
      ? tableTestimonials
      : isCmsMode && cmsTestimonials?.data?.items?.length
        ? cmsTestimonials.data.items.map((item) => ({ ...item, initials: item.name?.[0] ?? '?' }))
        : staticTestimonials
  const resolvedTestimonials = testimonialsLimit
    ? resolvedTestimonialsRaw.slice(0, testimonialsLimit)
    : resolvedTestimonialsRaw
  const [featuredTestimonial, ...testimonialHighlights] = resolvedTestimonials
  const resolvedFeatures = isCmsMode
    ? (cmsFeatures?.data?.items ?? []).map((item, idx) => {
        const t = (item.title ?? '').toLowerCase()
        const icon =
          t.includes('bán hàng') || t.includes('pos')
            ? ReceiptText
            : t.includes('kho')
              ? Boxes
              : t.includes('nhân viên') || t.includes('nhân sự')
                ? Users
                : t.includes('báo cáo') || t.includes('doanh thu')
                  ? BarChart3
                  : t.includes('in ') || t.includes('hóa đơn')
                    ? Printer
                    : t.includes('di động') || t.includes('điện thoại') || t.includes('app')
                      ? Smartphone
                      : ([ReceiptText, Boxes, Users, BarChart3, Printer, Smartphone][idx] ?? CheckCircle)
        const imgUrl = item.mediaId ? cmsMedia.get(item.mediaId)?.publicUrl : null
        return { icon, imgUrl, title: item.title, desc: item.description, href: item.href }
      })
    : featureTabs[0].items
  const activeFeature = resolvedFeatures[activeFeatureIndex % Math.max(resolvedFeatures.length, 1)]
  const ActiveFeatureIcon = activeFeature?.icon ?? Boxes
  const resolvedIndustryGroups = buildFallbackIndustryGroups()
  const processFeatureImage = isCmsMode ? cmsMedia.get(cmsProcess?.data?.featureMediaId)?.publicUrl : posIotImage

  useEffect(() => {
    if (featuredPostsLimit === undefined || featuredPostsType === undefined) {
      setCmsPosts([])
      return
    }
    fetchPublishedPosts(featuredPostsLimit, null, featuredPostsType === 'all' ? null : featuredPostsType)
      .then(setCmsPosts)
      .catch(() => setCmsPosts([]))
  }, [featuredPostsLimit, featuredPostsType])

  const navSoftware = cmsNav?.software ?? softwareProducts
  const navSolutions = cmsNav?.solutions ?? solutionPages
  const navServices = cmsNav?.services ?? servicePages

  useEffect(() => {
    if (resolvedHeroSlides.length < 2) return undefined
    const timer = window.setInterval(() => {
      setActiveHeroSlide((current) => (current + 1) % resolvedHeroSlides.length)
    }, 5600)
    return () => window.clearInterval(timer)
  }, [resolvedHeroSlides.length])

  const resolvedEcosystemGroups = useMemo(() => {
    const cmsGroups = isCmsMode ? (cmsEcosystem?.data?.groups ?? []) : []
    const g0 = cmsGroups[0]
    const g1 = cmsGroups[1]
    const g2 = cmsGroups[2]
    return [
      {
        icon: iconByKey[g0?.iconKey] ?? Smartphone,
        label: g0?.label ?? 'Sản phẩm',
        title: g0?.title ?? 'Phần mềm',
        href: g0?.href ?? '/phan-mem',
        desc: g0?.description ?? 'Các nền tảng iOrder phục vụ vận hành, đồng bộ dữ liệu và nghiệp vụ chuyên biệt.',
        items: navSoftware.map((item) => ({ title: item.title, href: item.href })),
      },
      {
        icon: iconByKey[g1?.iconKey] ?? Server,
        label: g1?.label ?? 'Hạ tầng',
        title: g1?.title ?? 'Giải pháp hạ tầng mạng',
        href: g1?.href ?? '/giai-phap/ha-tang',
        desc: g1?.description ?? 'Thiết kế hệ thống mạng, máy chủ, bảo mật và thiết bị nền tảng cho vận hành ổn định.',
        items: navSolutions.map((item) => ({ title: item.title, href: item.href })),
      },
      {
        icon: iconByKey[g2?.iconKey] ?? Headphones,
        label: g2?.label ?? 'Triển khai',
        title: g2?.title ?? 'Dịch vụ CNTT',
        href: g2?.href ?? '/dich-vu',
        desc:
          g2?.description ?? 'Đội ngũ kỹ thuật hỗ trợ thi công, bảo trì, phần mềm, hóa đơn điện tử và chuyển đổi số.',
        items: navServices.map((item) => ({ title: item.title, href: item.href })),
      },
    ]
  }, [isCmsMode, cmsEcosystem, navSoftware, navSolutions, navServices])

  useEffect(() => {
    setPageSeo({
      title:
        cmsHomepage?.item?.seoTitle ??
        (location.pathname === '/' ? 'iOrder - Trang chủ' : 'iOrder - Phần mềm quản lý bán hàng'),
      description:
        cmsHomepage?.item?.seoDescription ??
        'iOrder hỗ trợ POS bán hàng, order tại bàn, quản lý kho, nhân viên và báo cáo doanh thu cho nhà hàng, cafe, bán lẻ và chuỗi cửa hàng.',
      noindex: Boolean(previewToken),
    })
  }, [location.pathname, cmsHomepage?.item?.seoTitle, cmsHomepage?.item?.seoDescription, previewToken])

  const homeNews = useMemo(() => {
    const source =
      cmsPosts.length > 0
        ? cmsPosts.map((post) => ({
            slug: post.slug,
            title: post.title,
            excerpt: post.excerpt,
            category: post.type === 'promotion' ? 'Khuyến mãi' : 'Tin tức',
            image: post.coverUrl,
            imageAlt: post.title,
          }))
        : newsArticles
    return Array.from(
      { length: Math.min(3, source.length) },
      (_, index) => source[(activeNewsIndex + index) % source.length],
    )
  }, [activeNewsIndex, cmsPosts])

  const goToNews = (direction) => {
    setActiveNewsIndex((current) => {
      if (direction === 'next') return (current + 1) % newsArticles.length
      return (current - 1 + newsArticles.length) % newsArticles.length
    })
  }

  return (
    <PageLayout
      shellClassName="page-shell home-shell"
      mainClassName={isCmsMode ? 'cms-home-layout' : undefined}
      mainProps={{ 'data-content-source': cmsHomepage ? 'cms' : 'static-fallback' }}
    >
      {previewToken ? (
        <div className="cms-preview-banner" role="status">
          Đang xem bản nháp CMS · Nội dung này chưa được xuất bản
        </div>
      ) : null}
      {/* Hero Section */}
      {shouldShow('home_hero') ? (
        <section {...mergeSectionProps('hero', { order: blockOrder('home_hero') }, cmsHero, cmsMedia)}>
          <div className="container hero-grid">
            <div className="hero-content">
              <span className="eyebrow">
                <CheckCircle size={16} />
                {cmsHero?.data?.eyebrow ?? 'Giải pháp quản lý bán hàng toàn diện'}
              </span>
              <h1>
                {cmsHero?.data?.title ?? (
                  <>
                    Phần mềm quản lý <span>hiệu quả</span> cho mọi mô hình kinh doanh
                  </>
                )}
              </h1>
              <p>
                {cmsHero?.data?.description ??
                  'Quản lý bán hàng, kho, nhân viên và báo cáo chi tiết trên một nền tảng duy nhất — phù hợp từ cửa hàng, quán café đến chuỗi cửa hàng.'}
              </p>

              <div className="hero-points">
                {heroPoints.map((point) => (
                  <div className="hero-point" key={point.label}>
                    <CheckCircle size={20} />
                    <span>
                      <strong>{point.label}</strong>
                      {point.detail ? <small>{point.detail}</small> : null}
                    </span>
                  </div>
                ))}
              </div>

              <div className="hero-actions">
                <a
                  className="btn large primary"
                  href={cmsHero?.data?.primaryUrl ?? externalLinks.trial}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span>{cmsHero?.data?.primaryLabel ?? 'Dùng thử miễn phí'}</span> <ArrowRight size={18} />
                </a>
                {(cmsHero?.data?.secondaryLabel ?? 'Xem demo') ? (
                  <Link className="btn large outline" to={cmsHero?.data?.secondaryUrl ?? '/ho-tro/video'}>
                    <span>{cmsHero?.data?.secondaryLabel ?? 'Xem demo'}</span>
                    <CirclePlay size={20} />
                  </Link>
                ) : null}
              </div>

              <p className="hero-commitment">
                <ShieldCheck size={17} />
                Dùng thử đầy đủ tính năng — không cần thẻ tín dụng
              </p>
            </div>

            <div className="hero-visual">
              <div className="hero-product-stage">
                <img
                  className="hero-product-image"
                  key={heroVisual.image}
                  src={heroVisual.image}
                  alt={heroVisual.title || 'Giao diện phần mềm quản lý bán hàng iOrder'}
                  loading="eager"
                  decoding="sync"
                  fetchPriority="high"
                  width={heroVisual.width}
                  height={heroVisual.height}
                  sizes="(max-width: 1023px) 100vw, 52vw"
                />
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* Logo partners are sourced from the Partners CMS collection and can be changed by admins. */}
      {shouldShow('home_stats') && resolvedPartners.length > 0 ? (
        <section {...mergeSectionProps('home-partner-strip', { order: blockOrder('home_stats') }, cmsStats, cmsMedia)}>
          <div className="container">
            <p className="partners-trust-line">
              {(isCmsMode ? cmsStats?.data?.partnersHeading : null) ?? 'Được hơn 10.000+ cửa hàng tin tưởng sử dụng'}
            </p>
            <div className="home-partner-layout">
              <div className="home-partner-marquee" aria-label="Các đối tác iOrder">
                <div className="home-partner-logo-row">
                  {resolvedPartners.map((partner, index) => (
                    <div className="home-partner-logo" key={`a-${partner.name}-${index}`} title={partner.name}>
                      <SafeImage src={partner.src} alt={partner.name} loading="lazy" decoding="async" />
                    </div>
                  ))}
                  {resolvedPartners.map((partner, index) => (
                    <div className="home-partner-logo" key={`b-${partner.name}-${index}`} aria-hidden="true">
                      <SafeImage src={partner.src} alt="" loading="lazy" decoding="async" />
                    </div>
                  ))}
                </div>
              </div>
              <p className="home-partner-more">Và hàng nghìn khách hàng khác đang sử dụng iOrder</p>
            </div>
          </div>
        </section>
      ) : null}

      {/* Operating outcomes: concise proof after the primary conversion action. */}
      <section className="section about-section" style={isCmsMode ? { order: blockOrder('home_hero') } : undefined}>
        <div className="container">
          <div className="about-overview">
            <div className="about-overview-copy">
              <span className="section-eyebrow">THIẾT KẾ CHO CA BÁN THẬT</span>
              <h2>Biết cửa hàng đang vận hành thế nào, ngay cả khi bạn không ở quầy</h2>
              <p>
                iOrder gom bán hàng, tồn kho, nhân sự và báo cáo vào cùng một luồng làm việc. Nhân viên thao tác nhanh
                hơn; chủ cửa hàng có số liệu đủ rõ để ra quyết định mỗi ngày.
              </p>
              <Link to="/giai-phap" className="about-overview-link">
                Khám phá giải pháp theo mô hình <ArrowRight size={17} />
              </Link>
            </div>
            <div className="about-workspace" aria-label="Giao diện báo cáo vận hành iOrder">
              <div className="about-workspace-copy">
                <span>Vận hành trong tầm tay</span>
                <strong>Dữ liệu đồng bộ theo thời gian thực</strong>
              </div>
              <div className="about-workspace-visual">
                <img src={dashboardLaptop} alt="Báo cáo vận hành iOrder trên laptop" loading="lazy" decoding="async" />
              </div>
              <div className="about-workspace-modules" aria-label="Các mô-đun vận hành">
                <span>
                  <ReceiptText size={16} /> Bán hàng
                </span>
                <span>
                  <Boxes size={16} /> Tồn kho
                </span>
                <span>
                  <BarChart3 size={16} /> Báo cáo
                </span>
              </div>
            </div>
          </div>

          <div className="operating-principles">
            <article className="operating-principle">
              <div className="operating-principle-icon">
                <ReceiptText size={22} />
              </div>
              <div>
                <h3>Một luồng thao tác</h3>
                <p>Từ tạo đơn, thanh toán đến in bill — đội ngũ làm việc theo một quy trình nhất quán.</p>
              </div>
            </article>
            <article className="operating-principle">
              <div className="operating-principle-icon">
                <BarChart3 size={22} />
              </div>
              <div>
                <h3>Dữ liệu để quyết định</h3>
                <p>Doanh thu, tồn kho và hiệu suất ca bán luôn sẵn khi bạn cần kiểm tra.</p>
              </div>
            </article>
            <article className="operating-principle">
              <div className="operating-principle-icon">
                <Headphones size={22} />
              </div>
              <div>
                <h3>Triển khai có người đồng hành</h3>
                <p>Đội ngũ hỗ trợ cùng bạn chuẩn hóa dữ liệu, thiết bị và cách vận hành ban đầu.</p>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* Industry Solutions Section */}
      {shouldShow('home_industries') ? (
        <section
          {...mergeSectionProps(
            'section industry-section',
            { order: blockOrder('home_industries') },
            cmsIndustry,
            cmsMedia,
          )}
        >
          <div className="container">
            <div className="industry-compact-header">
              <div>
                <span className="section-eyebrow">{cmsIndustry?.data?.eyebrow ?? 'THEO NGÀNH HÀNG'}</span>
                <h2>{cmsIndustry?.data?.heading ?? 'Phù hợp nhiều mô hình kinh doanh'}</h2>
                <p>
                  {cmsIndustry?.data?.intro ??
                    'Chọn mô hình của bạn để khám phá quy trình bán hàng và cách iOrder hỗ trợ vận hành mỗi ngày.'}
                </p>
              </div>
            </div>
            <div className="industry-row-grid">
              {resolvedIndustryGroups.map((group, gIdx) => {
                const GroupIcon = group.icon
                return (
                  <div className={`industry-row-group industry-card-${gIdx}`} key={group.title}>
                    <div className="industry-card-head">
                      <div className="industry-card-icon">
                        <GroupIcon size={22} />
                      </div>
                      <div>
                        <span className="industry-card-kicker">NHÓM NGÀNH</span>
                        <span className="industry-pill-label">{group.title}</span>
                      </div>
                      <span className="industry-item-count">{group.items.length}</span>
                    </div>
                    <div className="industry-item-list">
                      {group.items.map((item) => {
                        const ItemIcon = getItemIcon(item.title)
                        return (
                          <Link to={item.href ?? '#'} className="industry-item-row" key={item.href ?? item.title}>
                            <ItemIcon size={15} className="industry-item-icon" />
                            <span>{item.title}</span>
                          </Link>
                        )
                      })}
                    </div>
                    <div className="industry-card-foot">
                      <Sparkles size={15} /> Tư vấn triển khai theo mô hình
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      ) : null}

      {/* Features Section */}
      {shouldShow('home_features') ? (
        <section
          {...mergeSectionProps(
            'section feature-showcase-section feature-command-section',
            { order: blockOrder('home_features') },
            cmsFeatures,
            cmsMedia,
          )}
        >
          <div className="container">
            <div className="section-title feature-command-heading">
              <span className="section-eyebrow">{cmsFeatures?.data?.eyebrow ?? 'TÍNH NĂNG'}</span>
              <h2>{cmsFeatures?.data?.heading ?? 'Một nền tảng cho toàn bộ vận hành cửa hàng'}</h2>
              <p>
                {cmsFeatures?.data?.intro ??
                  'Mỗi thao tác ở quầy đều được kết nối với dữ liệu quản lý để bạn vận hành nhanh hơn và kiểm soát tốt hơn.'}
              </p>
            </div>
            {activeFeature ? (
              <div className="feature-command-layout">
                <div className="feature-command-nav" role="tablist" aria-label="Nhóm tính năng iOrder">
                  {resolvedFeatures.map((item, idx) => {
                    const Icon = item.icon
                    const isActive = idx === activeFeatureIndex % resolvedFeatures.length
                    return (
                      <button
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        className={isActive ? 'is-active' : ''}
                        key={item.title}
                        onClick={() => setActiveFeatureIndex(idx)}
                      >
                        <span className="feature-command-icon">
                          <Icon size={18} />
                        </span>
                        <span>{item.title}</span>
                        <ArrowRight size={16} />
                      </button>
                    )
                  })}
                </div>
                <article className="feature-command-panel" role="tabpanel">
                  <div className="feature-command-copy">
                    <span className="feature-command-number">
                      0{(activeFeatureIndex % resolvedFeatures.length) + 1}
                    </span>
                    <h3>{activeFeature.title}</h3>
                    <p>{activeFeature.desc}</p>
                    {activeFeature.bullets?.length ? (
                      <ul className="feature-command-bullets">
                        {activeFeature.bullets.slice(0, 3).map((bullet) => (
                          <li key={bullet}>
                            <CheckCircle size={16} /> {bullet}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    {activeFeature.href ? (
                      <Link to={activeFeature.href} className="feature-command-link">
                        Khám phá tính năng <ArrowRight size={16} />
                      </Link>
                    ) : null}
                  </div>
                  <div className={`feature-command-visual${activeFeature.imgUrl ? ' has-image' : ''}`}>
                    {activeFeature.imgUrl ? (
                      <img src={activeFeature.imgUrl} alt={activeFeature.title} loading="lazy" decoding="async" />
                    ) : (
                      <ActiveFeatureIcon size={92} strokeWidth={1.35} />
                    )}
                  </div>
                </article>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* Testimonials Section */}
      {shouldShow('home_testimonials') && resolvedTestimonials.length > 0 ? (
        <section
          {...mergeSectionProps(
            'section home-testimonials-section home-proof-section',
            { order: blockOrder('home_testimonials') },
            cmsTestimonials,
            cmsMedia,
          )}
        >
          <div className="container">
            <div className="home-proof-heading">
              <div>
                <span className="section-eyebrow">{cmsTestimonials?.data?.eyebrow ?? 'CÂU CHUYỆN KHÁCH HÀNG'}</span>
                <h2>{cmsTestimonials?.data?.heading ?? 'iOrder trong vận hành thực tế'}</h2>
              </div>
              <p>Những chia sẻ từ các cửa hàng đang sử dụng iOrder trong công việc mỗi ngày.</p>
            </div>
            {featuredTestimonial ? (
              <div className="home-proof-layout">
                <article className="testimonial-featured">
                  <div className="testimonial-featured-media">
                    {featuredTestimonial.avatarUrl ? (
                      <img
                        src={featuredTestimonial.avatarUrl}
                        alt={featuredTestimonial.company ?? `Cửa hàng của ${featuredTestimonial.name}`}
                      />
                    ) : (
                      <div className="customer-story-placeholder">
                        <Store size={28} />
                        <span>Ảnh cửa hàng</span>
                      </div>
                    )}
                  </div>
                  <div className="testimonial-featured-body">
                    <div className="customer-story-title">
                      <span>KHÁCH HÀNG IORDER</span>
                      <h3>{featuredTestimonial.company ?? 'Cửa hàng đang sử dụng iOrder'}</h3>
                    </div>
                    <p className="customer-story-quote">
                      <Quote size={20} /> {featuredTestimonial.quote}
                    </p>
                    <div className="testimonial-author">
                      <div>
                        <strong>{featuredTestimonial.name ?? 'Khách hàng iOrder'}</strong>
                        {featuredTestimonial.role ? <span>{featuredTestimonial.role}</span> : null}
                      </div>
                    </div>
                  </div>
                </article>
                {testimonialHighlights.length > 0 ? (
                  <div className="testimonial-highlights">
                    {testimonialHighlights.slice(0, 2).map((item, idx) => (
                      <article className="testimonial-highlight" key={`${item.name}-${idx}`}>
                        <div className="testimonial-highlight-head">
                          <div className="testimonial-story-thumb">
                            {item.avatarUrl ? (
                              <img src={item.avatarUrl} alt={item.company ?? `Cửa hàng của ${item.name}`} />
                            ) : (
                              <Store size={18} aria-label="Ảnh cửa hàng chưa cập nhật" />
                            )}
                          </div>
                          <div className="customer-story-title">
                            <span>KHÁCH HÀNG IORDER</span>
                            <h3>{item.company ?? 'Cửa hàng đang sử dụng iOrder'}</h3>
                          </div>
                        </div>
                        <p className="customer-story-quote">
                          <Quote size={16} /> {item.quote}
                        </p>
                        <div className="testimonial-author">
                          <div>
                            <strong>{item.name ?? 'Khách hàng iOrder'}</strong>
                            {item.role ? <span>{item.role}</span> : null}
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* Ecosystem Services Section */}
      {shouldShow('home_ecosystem_services') ? (
        <section
          id="giai-phap"
          {...mergeSectionProps(
            'section ecosystem-section',
            { order: blockOrder('home_ecosystem_services') },
            cmsEcosystem,
            cmsMedia,
          )}
        >
          <div className="container">
            <div className="section-title ecosystem-heading">
              <span className="section-eyebrow">{cmsEcosystem?.data?.eyebrow ?? 'TRIỂN KHAI TRỌN GÓI'}</span>
              <h2>{cmsEcosystem?.data?.heading ?? 'Không chỉ phần mềm — triển khai trọn gói'}</h2>
              <p>
                {cmsEcosystem?.data?.intro ??
                  'Từ phần mềm đến hạ tầng và hỗ trợ triển khai, iOrder giúp bạn có một hệ thống vận hành thống nhất.'}
              </p>
            </div>

            <div className="ecosystem-grid">
              {resolvedEcosystemGroups.map((group, index) => {
                const Icon = group.icon
                const actionLabels = ['Khám phá phần mềm', 'Xem giải pháp', 'Xem dịch vụ']
                return (
                  <article className="ecosystem-card" key={group.title}>
                    <span className="ecosystem-order">0{index + 1}</span>
                    <div className="ecosystem-card-head">
                      <div className="ecosystem-icon">
                        <Icon size={24} />
                      </div>
                      <div>
                        <span>{group.label}</span>
                        <h3>
                          <Link to={group.href}>{group.title}</Link>
                        </h3>
                      </div>
                    </div>
                    <p className="ecosystem-desc">{group.desc}</p>
                    <ul>
                      {group.items.slice(0, 3).map((item) => (
                        <li key={item.href}>
                          <Link to={item.href}>{item.title}</Link>
                        </li>
                      ))}
                    </ul>
                    <Link className="ecosystem-link" to={group.href}>
                      {actionLabels[index] ?? 'Khám phá giải pháp'} <ArrowRight size={16} />
                    </Link>
                  </article>
                )
              })}
            </div>
          </div>
        </section>
      ) : null}

      {/* Process Section */}
      {shouldShow('home_process') ? (
        <section
          {...mergeSectionProps(
            'section deployment-section',
            { order: blockOrder('home_process') },
            cmsProcess,
            cmsMedia,
          )}
        >
          <div className="container deployment-grid">
            <div className="deployment-copy">
              <span className="section-eyebrow">{cmsProcess?.data?.eyebrow ?? 'QUY TRÌNH TRIỂN KHAI'}</span>
              <h2>{cmsProcess?.data?.heading ?? 'Từ tư vấn đến vận hành trong một quy trình rõ ràng'}</h2>
              <p>
                {cmsProcess?.data?.intro ??
                  'iOrder không chỉ bàn giao phần mềm. Đội ngũ triển khai sẽ hỗ trợ chuẩn hóa dữ liệu, cấu hình thiết bị, đào tạo nhân viên và kiểm tra ca bán đầu tiên.'}
              </p>
              <Link to={cmsProcess?.data?.buttonUrl ?? '/lien-he'} className="btn primary deployment-link">
                {cmsProcess?.data?.buttonLabel ?? 'Nhận tư vấn triển khai'} <ArrowRight size={18} />
              </Link>
            </div>
            <div className="deployment-visual deployment-model-feature">
              <SafeImage
                src={processFeatureImage}
                alt={cmsProcess?.data?.heading ?? 'Mô hình máy POS kết nối thiết bị IoT iOrder'}
                loading="lazy"
                decoding="async"
                width="1536"
                height="1024"
                sizes="(max-width: 1023px) 100vw, 42vw"
              />
            </div>
            <div className="deployment-steps">
              {(
                cmsProcess?.data?.steps ?? [
                  {
                    title: 'Tư vấn mô hình',
                    description: 'Xác định bạn dùng iOrder cho bán lẻ, cafe, nhà hàng hay chuỗi nhiều chi nhánh.',
                  },
                  {
                    title: 'Chuẩn hóa dữ liệu',
                    description: 'Nhập danh mục sản phẩm, menu, giá bán, nhân viên và tồn kho ban đầu.',
                  },
                  {
                    title: 'Cài đặt thiết bị',
                    description: 'Kết nối máy in hóa đơn, in bếp/bar, máy quét mã vạch và thiết bị bán hàng.',
                  },
                  {
                    title: 'Đào tạo vận hành',
                    description: 'Hướng dẫn nhân viên bán hàng, gọi món, chốt ca và xem báo cáo quản lý.',
                  },
                ]
              ).map((step, index) => (
                <div className="deployment-step" key={step.title}>
                  <span>{index + 1}</span>
                  <div>
                    <h3>{step.title}</h3>
                    {step.description ? <p>{step.description}</p> : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Featured Posts Section */}
      {shouldShow('home_featured_posts') ? (
        <section
          {...mergeSectionProps(
            'section home-news-section',
            { order: blockOrder('home_featured_posts') },
            cmsFeaturedPosts,
            cmsMedia,
          )}
        >
          <div className="container">
            <div className="home-news-heading">
              <div className="section-title">
                <span className="section-eyebrow">{cmsFeaturedPosts?.data?.eyebrow ?? 'TIN TỨC IORDER'}</span>
                <h2>{cmsFeaturedPosts?.data?.heading ?? 'Bài viết nổi bật về vận hành cửa hàng'}</h2>
                {cmsFeaturedPosts?.data?.intro ? <p>{cmsFeaturedPosts.data.intro}</p> : null}
              </div>
              <Link to={cmsFeaturedPosts?.data?.allUrl ?? '/tin-tuc'} className="home-news-all">
                {cmsFeaturedPosts?.data?.allLabel ?? 'Xem tất cả bài viết'} <ArrowRight size={16} />
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
                {homeNews.slice(0, 2).map((article) => (
                  <Link to={`/tin-tuc/${article.slug}`} className="home-news-card" key={article.slug}>
                    <div className="home-news-image">
                      <SafeImage src={article.image} alt={article.imageAlt} loading="lazy" decoding="async" />
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
      ) : null}

      {/* FAQ Section */}
      {shouldShow('home_faq') ? (
        <section
          {...mergeSectionProps('section home-faq-section', { order: blockOrder('home_faq') }, cmsFaq, cmsMedia)}
        >
          <div className="container home-faq-container">
            <div className="section-title">
              <span className="section-eyebrow">{cmsFaq?.data?.eyebrow ?? 'CÂU HỎI THƯỜNG GẶP'}</span>
              <h2>{cmsFaq?.data?.heading ?? 'Giải đáp thắc mắc trước khi bạn bắt đầu'}</h2>
            </div>
            <div className="faq-list">
              {(isCmsMode && cmsFaq?.data?.items?.length
                ? cmsFaq.data.items.map((item) => ({ q: item.question, a: item.answer }))
                : faqItems
              )
                .slice(0, 4)
                .map((item, idx) => {
                  const isOpen = openFaq === idx
                  return (
                    <div className={`faq-item${isOpen ? ' faq-item--open' : ''}`} key={idx}>
                      <button
                        type="button"
                        className="faq-question"
                        onClick={() => setOpenFaq(isOpen ? null : idx)}
                        aria-expanded={isOpen}
                      >
                        <span>{item.q}</span>
                        <ChevronDown size={20} className="faq-chevron" />
                      </button>
                      <div className="faq-answer">
                        <p>{item.a}</p>
                      </div>
                    </div>
                  )
                })}
            </div>
            <div className="faq-cta">
              <p>Còn câu hỏi khác? Đội ngũ iOrder sẵn sàng hỗ trợ bạn.</p>
              <Link to="/lien-he" className="btn outline">
                Liên hệ ngay <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      {/* CTA Section */}
      {shouldShow('home_cta') ? (
        <section {...mergeSectionProps('section home-final-cta', { order: blockOrder('home_cta') }, cmsCta, cmsMedia)}>
          <div className="container">
            <h2>{cmsCta?.data?.title ?? 'Sẵn sàng tăng cường bán hàng?'}</h2>
            <p>
              {cmsCta?.data?.description ??
                'Hãy trải nghiệm miễn phí trong 14 ngày. Không cần thẻ tín dụng, hủy bất cứ lúc nào.'}
            </p>
            <a
              href={cmsCta?.data?.buttonUrl ?? externalLinks.trial}
              target="_blank"
              rel="noreferrer"
              className="btn primary"
            >
              {cmsCta?.data?.buttonLabel ?? 'Bắt đầu dùng thử'}
            </a>
          </div>
        </section>
      ) : null}
    </PageLayout>
  )
}
