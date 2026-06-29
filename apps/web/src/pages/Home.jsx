import { useState, useEffect, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { HOMEPAGE_SECTION_ORDER } from '@iorder/contracts'
import PageLayout from '../components/PageLayout'
import SafeImage from '../components/SafeImage'
import { setPageSeo } from '../utils/seo'
import { externalLinks, servicePages, softwareProducts, solutionPages } from '../data/siteContent'
import { fetchNavOfferings, fetchPartners, fetchTestimonials } from '../utils/contentApi'
import {
  BarChart3, Boxes, CheckCircle, Headphones, Printer,
  ReceiptText, ShieldCheck, Smartphone, Users, Utensils,
  Store, Building2, Rocket, Server,
  ArrowRight, ChevronLeft, ChevronRight, Quote, ChevronDown,
  Shirt, ShoppingCart, Sparkles, Wrench, Pill,
  UtensilsCrossed, Coffee, Music, Wine, Truck,
  Flower2, Scissors, BedDouble, TreePine, Dumbbell, Stethoscope,
  Zap, Target, Heart, Award
} from 'lucide-react'

import heroImg from '../assets/products/hero-img.png'
import heroImg2 from '../assets/products/hero-img2.png'
import heroImg3 from '../assets/products/hero-img3.jpg'
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
import logoTTC from '../assets/partners/ttc.png'
import { newsArticles } from '../data/newsArticles'
import { industryGroups } from '../data/industrySolutions'

const isLocal = typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname)
const localApiHost = typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'localhost' : '127.0.0.1'
// Khi mở qua IP LAN thì gọi tương đối để đi qua proxy của vite (giống contentApi.js).
const API_URL = import.meta.env.VITE_API_URL ?? (isLocal ? `http://${localApiHost}:4000` : '')

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
  const imageValue = (url) => url ? `url(${JSON.stringify(url)})` : 'none'
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


const featureTabs = [
  {
    id: 'all',
    label: 'Tất cả',
    items: [
      { icon: ReceiptText, title: 'Bán hàng tại quầy nhanh & chính xác', desc: 'Giao diện POS cảm ứng trực quan, chốt đơn chỉ vài thao tác. Hỗ trợ thanh toán tiền mặt, chuyển khoản, QR và quét mã vạch.', bullets: ['Màn hình bán hàng tối ưu tốc độ', 'Tích hợp máy in bill, máy in bếp/bar', 'Chốt ca, kiểm doanh thu theo ca làm việc'] },
      { icon: Boxes, title: 'Tồn kho thời gian thực, không cần đếm tay', desc: 'Mỗi giao dịch tự động trừ tồn kho, cảnh báo khi hàng sắp hết. Không cần kiểm kho thủ công cuối ngày.', bullets: ['Nhập/xuất kho nhanh bằng mã vạch', 'Cảnh báo hàng tồn thấp tự động', 'Xem lịch sử xuất nhập theo thời gian'] },
      { icon: Users, title: 'Quản lý nhân viên & ca làm việc', desc: 'Phân quyền chi tiết từng nhân viên, theo dõi ca làm việc và chấm công. Xem doanh thu theo từng nhân viên bán hàng.', bullets: ['Phân quyền theo vai trò linh hoạt', 'Chốt ca tự động, báo cáo hiệu suất', 'Chấm công, tính lương theo ca'] },
      { icon: BarChart3, title: 'Báo cáo kinh doanh trực quan & chi tiết', desc: 'Dashboard doanh thu cập nhật theo ngày, tuần, tháng. Biểu đồ rõ ràng giúp chủ cửa hàng ra quyết định nhanh.', bullets: ['Doanh thu theo sản phẩm, nhóm hàng', 'Lợi nhuận, chi phí, hàng bán chạy', 'Xuất báo cáo Excel, in trực tiếp'] },
      { icon: Printer, title: 'In hóa đơn, in bếp tức thì', desc: 'Kết nối nhiều máy in cùng lúc — bill tại quầy, phiếu bếp/bar, tem mã vạch. Hỗ trợ USB, LAN và WiFi.', bullets: ['In nhiều bếp/bar khác nhau', 'Tự động in khi đặt món', 'Tùy chỉnh mẫu bill theo thương hiệu'] },
      { icon: Smartphone, title: 'Ứng dụng di động — quản lý mọi lúc mọi nơi', desc: 'Xem doanh thu, duyệt đơn hàng và kiểm tồn kho ngay trên điện thoại. Không cần ngồi tại cửa hàng vẫn nắm được tình hình.', bullets: ['Theo dõi doanh thu real-time', 'Duyệt đơn, nhập kho từ xa', 'Thông báo khi hết hàng, đơn mới'] },
    ],
  },
]

const heroSlides = [
  { image: heroImg,  width: 1672, height: 941 },
  { image: heroImg2, width: 1802, height: 873 },
  { image: heroImg3, width: 1804, height: 872 },
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
  { quote: 'iOrder giúp tôi theo dõi doanh thu từng ca, từng nhân viên mà không cần ngồi đối chiếu sổ sách. Mỗi tháng tiết kiệm được gần chục giờ đồng hồ.', name: 'Anh Minh', role: 'Chủ chuỗi 3 quán cafe tại TP.HCM', initials: 'M' },
  { quote: 'Trước đây kho hay bị thất thoát mà không biết lý do. Từ khi dùng iOrder, mỗi lần xuất kho đều có ghi nhận, cuối tháng so khớp rất nhanh.', name: 'Chị Hà', role: 'Quản lý chuỗi trà sữa 5 chi nhánh', initials: 'H' },
  { quote: 'Nhân viên mới chỉ cần học 30 phút là dùng được. Triển khai xong trong 1 ngày, hôm sau mở cửa bán hàng bình thường.', name: 'Anh Tuấn', role: 'Chủ cửa hàng bán lẻ tại Hà Nội', initials: 'T' },
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
  const [loadedHeroSlides, setLoadedHeroSlides] = useState([0])
  const [activeNewsIndex, setActiveNewsIndex] = useState(0)
  const previewToken = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('cmsPreview') : null
  const previewTheme = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('cmsTheme') : null
  const [cmsHomepage, setCmsHomepage] = useState(() => {
    if (previewToken) return null
    try {
      const raw = sessionStorage.getItem('cms_hp')
      return raw ? JSON.parse(raw) : null
    } catch { return null }
  })
  const [cmsPosts, setCmsPosts] = useState([])
  const [cmsNav, setCmsNav] = useState(null)
  const [tablePartners, setTablePartners] = useState([])
  const [tableTestimonials, setTableTestimonials] = useState([])
  const [openFaq, setOpenFaq] = useState(null)
  const location = useLocation()

  useEffect(() => {
    fetchNavOfferings().then(setCmsNav).catch(() => {})
    fetchPartners().then(setTablePartners).catch(() => {})
    fetchTestimonials().then(setTableTestimonials).catch(() => {})
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
    const obs = new IntersectionObserver((entries) => {
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
    }, { threshold: 0.6 })
    targets.forEach((el) => obs.observe(el))
    return () => obs.disconnect()
  }, [cmsHomepage])

  useEffect(() => {
    let active = true
    const endpoint = previewToken
      ? `${API_URL}/api/public/homepage/preview?token=${encodeURIComponent(previewToken)}`
      : `${API_URL}/api/public/homepage`
    const loadHomepage = () => fetch(endpoint, { cache: 'no-store' })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('CMS unavailable')))
      .then((payload) => {
        if (!active) return
        setCmsHomepage(payload)
        if (!previewToken) try { sessionStorage.setItem('cms_hp', JSON.stringify(payload)) } catch {}
      })
      .catch(() => { if (active) setCmsHomepage(null) })
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') void loadHomepage()
    }

    void loadHomepage()
    window.addEventListener('focus', loadHomepage)
    document.addEventListener('visibilitychange', refreshWhenVisible)
    return () => {
      active = false
      window.removeEventListener('focus', loadHomepage)
      document.removeEventListener('visibilitychange', refreshWhenVisible)
    }
  }, [previewToken])

  const cmsMedia = useMemo(() => new Map((cmsHomepage?.media ?? []).map((asset) => [asset.id, asset])), [cmsHomepage])
  const cmsBlock = (type) => cmsHomepage?.item?.blocks?.find((block) => block.type === type && block.isEnabled)
  const cmsHero          = cmsBlock('home_hero')
  const cmsStats         = cmsBlock('home_stats')
  const cmsFeatures      = cmsBlock('home_features')
  const cmsIndustry      = cmsBlock('home_industries')
  const cmsEcosystem     = cmsBlock('home_ecosystem_services')
  const cmsProcess       = cmsBlock('home_process')
  const cmsTestimonials  = cmsBlock('home_testimonials')
  const cmsFeaturedPosts = cmsBlock('home_featured_posts')
  const cmsFaq           = cmsBlock('home_faq')
  const cmsCta           = cmsBlock('home_cta')
  const isCmsMode = Boolean(cmsHomepage)
  const shouldShow = (type) => !isCmsMode || Boolean(cmsBlock(type))
  const blockOrder = (type) => HOMEPAGE_SECTION_ORDER.indexOf(type)
  const resolvedHeroSlides = isCmsMode
    ? (cmsHero?.data?.slides ?? []).map((slide) => ({ image: cmsMedia.get(slide.imageMediaId)?.publicUrl, width: cmsMedia.get(slide.imageMediaId)?.width ?? 1600, height: cmsMedia.get(slide.imageMediaId)?.height ?? 900, title: slide.title, caption: slide.description })).filter((slide) => slide.image)
    : heroSlides
  // Ưu tiên danh sách Đối tác quản lý ở CMS (bảng partners) → logo nhúng trong block home_stats → fallback logo tĩnh
  const cmsBlockPartners = isCmsMode
    ? (cmsStats?.data?.partners ?? []).map((item) => ({ src: cmsMedia.get(item.mediaId)?.publicUrl, name: item.name, websiteUrl: item.websiteUrl })).filter((item) => item.src)
    : []
  const resolvedPartners = tablePartners.length > 0
    ? tablePartners
    : cmsBlockPartners.length > 0
    ? cmsBlockPartners
    : partnerItems
  // Số liệu: lấy từ block home_stats (sửa trong CMS là hiện ra) → fallback tĩnh
  const resolvedStats = isCmsMode && cmsStats?.data?.stats?.length
    ? cmsStats.data.stats
    : [
        { value: '10000+', label: 'Cửa hàng tin dùng' },
        { value: '5+', label: 'Năm kinh nghiệm' },
        { value: '24/7', label: 'Hỗ trợ kỹ thuật' },
        { value: '1–3 ngày', label: 'Triển khai nhanh' },
      ]
  // Ưu tiên đánh giá quản lý ở CMS (bảng) → block home_testimonials → fallback tĩnh
  const resolvedTestimonials = tableTestimonials.length > 0
    ? tableTestimonials
    : (isCmsMode && cmsTestimonials?.data?.items?.length
        ? cmsTestimonials.data.items.map((item) => ({ ...item, initials: item.name?.[0] ?? '?' }))
        : staticTestimonials)
  const resolvedFeatures = isCmsMode
    ? (cmsFeatures?.data?.items ?? []).map((item, idx) => {
        const t = (item.title ?? '').toLowerCase()
        const icon = t.includes('bán hàng') || t.includes('pos') ? ReceiptText
          : t.includes('kho') ? Boxes
          : t.includes('nhân viên') || t.includes('nhân sự') ? Users
          : t.includes('báo cáo') || t.includes('doanh thu') ? BarChart3
          : t.includes('in ') || t.includes('hóa đơn') ? Printer
          : t.includes('di động') || t.includes('điện thoại') || t.includes('app') ? Smartphone
          : [ReceiptText, Boxes, Users, BarChart3, Printer, Smartphone][idx] ?? CheckCircle
        const imgUrl = item.mediaId ? cmsMedia.get(item.mediaId)?.publicUrl : null
        return { icon, imgUrl, title: item.title, desc: item.description, href: item.href }
      })
    : featureTabs[0].items
  const resolvedIndustryGroups = isCmsMode
    ? (cmsIndustry?.data?.groups ?? []).map((group) => ({ ...group, icon: iconByKey[group.iconKey] ?? Store }))
    : industryGroups.map((group, index) => ({ ...group, icon: [Store, Utensils, ShieldCheck][index] ?? Store, items: group.items.map((item) => ({ ...item, href: `/nganh-hang/${item.slug}` })) }))
  const processFeatureImage = isCmsMode ? cmsMedia.get(cmsProcess?.data?.featureMediaId)?.publicUrl : posIotImage

  useEffect(() => {
    if (!cmsFeaturedPosts) return
    const params = new URLSearchParams({ limit: String(cmsFeaturedPosts.data.limit) })
    if (cmsFeaturedPosts.data.postType !== 'all') params.set('type', cmsFeaturedPosts.data.postType)
    fetch(`${API_URL}/api/public/posts?${params}`)
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('Posts unavailable')))
      .then((payload) => setCmsPosts(payload.items ?? []))
      .catch(() => setCmsPosts([]))
  }, [cmsFeaturedPosts?.data?.limit, cmsFeaturedPosts?.data?.postType])

  const navSoftware = cmsNav?.software ?? softwareProducts
  const navSolutions = cmsNav?.solutions ?? solutionPages
  const navServices = cmsNav?.services ?? servicePages

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
        desc: g2?.description ?? 'Đội ngũ kỹ thuật hỗ trợ thi công, bảo trì, phần mềm, hóa đơn điện tử và chuyển đổi số.',
        items: navServices.map((item) => ({ title: item.title, href: item.href })),
      },
    ]
  }, [isCmsMode, cmsEcosystem, navSoftware, navSolutions, navServices])

  useEffect(() => {
    setPageSeo({
      title: cmsHomepage?.item?.seoTitle ?? (location.pathname === '/' ? 'iOrder - Trang chủ' : 'iOrder - Phần mềm quản lý bán hàng'),
      description: cmsHomepage?.item?.seoDescription ?? 'iOrder hỗ trợ POS bán hàng, order tại bàn, quản lý kho, nhân viên và báo cáo doanh thu cho nhà hàng, cafe, bán lẻ và chuỗi cửa hàng.',
      noindex: Boolean(previewToken),
    })
  }, [location.pathname, cmsHomepage?.item?.seoTitle, cmsHomepage?.item?.seoDescription, previewToken])

  useEffect(() => {
    if (resolvedHeroSlides.length === 0) return undefined
    const timer = window.setInterval(() => {
      setActiveHeroSlide((current) => (current + 1) % resolvedHeroSlides.length)
    }, 4500)

    return () => window.clearInterval(timer)
  }, [resolvedHeroSlides.length])

  useEffect(() => {
    setLoadedHeroSlides((current) => {
      const nextSlide = (activeHeroSlide + 1) % resolvedHeroSlides.length
      const next = new Set([...current, activeHeroSlide, nextSlide])
      return next.size === current.length ? current : Array.from(next)
    })
  }, [activeHeroSlide, resolvedHeroSlides.length])

  const goToHeroSlide = (direction) => {
    setActiveHeroSlide((current) => {
      if (direction === 'next') return (current + 1) % resolvedHeroSlides.length
      return (current - 1 + resolvedHeroSlides.length) % resolvedHeroSlides.length
    })
  }

  const homeNews = useMemo(() => {
    const source = cmsPosts.length > 0
      ? cmsPosts.map((post) => ({
          slug: post.slug,
          title: post.title,
          excerpt: post.excerpt,
          category: post.type === 'promotion' ? 'Khuyến mãi' : 'Tin tức',
          image: post.coverUrl,
          imageAlt: post.title,
        }))
      : newsArticles
    return Array.from({ length: Math.min(3, source.length) }, (_, index) => source[(activeNewsIndex + index) % source.length])
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
        {previewToken ? <div className="cms-preview-banner" role="status">Đang xem bản nháp CMS · Nội dung này chưa được xuất bản</div> : null}
        {/* Hero Section */}
        {shouldShow('home_hero') ? <section {...mergeSectionProps('hero', { order: blockOrder('home_hero') }, cmsHero, cmsMedia)}>
          <div className="container hero-grid">
            <div className="hero-content">
              <span className="eyebrow">
                <CheckCircle size={16} />
                 {cmsHero?.data?.eyebrow ?? 'Tìm kiếm giải pháp quản lý bán hàng?'}
              </span>
              <h1>
                 {cmsHero?.data?.title ?? <>Phần mềm quản lý <span>hiệu quả</span> cho mô hình kinh doanh của bạn</>}
              </h1>
               <p>{cmsHero?.data?.description ?? 'Nền tảng tích hợp hệ thống POS, quản lý kho, nhân viên và báo cáo chi tiết - tối ưu cho nhà hàng, quán café, bán lẻ và chuỗi cửa hàng.'}</p>

              <div className="hero-points">
                {(cmsHero?.data?.points ?? ['Triển khai nhanh', 'Hỗ trợ 24/7', 'Dễ sử dụng', 'An toàn']).map((point) => <div className="hero-point" key={point}><CheckCircle size={20} /><span>{point}</span></div>)}
              </div>

              <div className="hero-actions">
                <a className="btn large primary" href={cmsHero?.data?.primaryUrl ?? externalLinks.trial} target="_blank" rel="noreferrer">
                  <span>{cmsHero?.data?.primaryLabel ?? 'Dùng thử miễn phí'}</span>
                </a>
                {(cmsHero?.data?.secondaryLabel ?? 'Xem demo') ? <Link className="btn large outline" to={cmsHero?.data?.secondaryUrl ?? '/ho-tro/video'}>
                  <span>{cmsHero?.data?.secondaryLabel ?? 'Xem demo'}</span>
                  <small>Video hướng dẫn</small>
                </Link> : null}
              </div>
            </div>

            <div className="hero-visual">
              <div className="hero-carousel" aria-label="Ảnh giới thiệu iOrder">
                <div className="hero-carousel-frame">
                  {resolvedHeroSlides.map((slide, index) => (
                    <div
                      key={slide.title}
                      className={`hero-slide ${index === activeHeroSlide ? 'active' : ''}`}
                      aria-hidden={index !== activeHeroSlide}
                    >
                      {loadedHeroSlides.includes(index) ? (
                        <img
                          src={slide.image}
                          alt={slide.title}
                          loading={index === 0 ? 'eager' : 'lazy'}
                          decoding={index === 0 ? 'sync' : 'async'}
                          fetchPriority={index === 0 ? 'high' : 'low'}
                          width={slide.width}
                          height={slide.height}
                          sizes="100vw"
                          onError={(e) => {
                            const fallback = heroSlides[index % heroSlides.length]?.image
                            if (fallback && e.currentTarget.src !== String(fallback)) {
                              e.currentTarget.src = fallback
                              e.currentTarget.onerror = null
                            }
                          }}
                        />
                      ) : null}
                      {slide.title || slide.caption ? (
                        <div className="hero-slide-copy">
                          <b>{slide.title}</b>
                          <span>{slide.caption}</span>
                        </div>
                      ) : null}
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
                  {resolvedHeroSlides.map((slide, index) => (
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
        </section> : null}

        {/* About + Core Values Section */}
        <section className="section about-section" style={isCmsMode ? { order: blockOrder('home_hero') } : undefined}>
          <div className="container">

            {/* Giới thiệu công ty */}
            <div className="about-company-intro">
              <span className="section-eyebrow">GIỚI THIỆU CÔNG TY</span>
              <h2>iOrder — Nền tảng quản lý bán hàng toàn diện cho doanh nghiệp Việt</h2>
              <p>Được thành lập với mục tiêu mang lại giải pháp công nghệ thiết thực cho doanh nghiệp vừa và nhỏ, iOrder cung cấp hệ thống quản lý bán hàng tích hợp đầy đủ từ POS, quản lý kho, nhân viên đến báo cáo kinh doanh thời gian thực.</p>
              <p>Với đội ngũ kỹ thuật tâm huyết và am hiểu thực tế vận hành tại thị trường Việt Nam, chúng tôi không chỉ cung cấp phần mềm mà còn là người bạn đồng hành lâu dài giúp doanh nghiệp phát triển bền vững.</p>
              <div className="about-company-stats">
                {resolvedStats.map((stat, idx) => {
                  const numeric = String(stat.value).match(/^(\d+)(\D*)$/)
                  return (
                    <div className="about-stat" key={`${stat.label}-${idx}`}>
                      {numeric
                        ? <strong data-count-to={numeric[1]} data-count-suffix={numeric[2]}>{stat.value}</strong>
                        : <strong>{stat.value}</strong>}
                      <span>{stat.label}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Row 1: Sứ mệnh — text trái, ảnh phải */}
            <div className="about-split">
              <div className="about-split-text">
                <span className="section-eyebrow">SỨ MỆNH</span>
                <h2>Đồng hành cùng người bán hàng Việt</h2>
                <p>iOrder ra đời với mục tiêu giúp các doanh nghiệp vừa và nhỏ tại Việt Nam số hóa vận hành bán hàng một cách đơn giản và hiệu quả nhất.</p>
                <p>Từ cửa hàng tạp hóa đơn lẻ đến chuỗi nhà hàng nhiều chi nhánh — chúng tôi cung cấp nền tảng quản lý toàn diện, dễ dùng và liên tục phát triển cùng doanh nghiệp.</p>
              </div>
              <div className="about-split-visual">
                <img src={heroImg} alt="iOrder - Phần mềm quản lý bán hàng" loading="lazy" />
              </div>
            </div>

            {/* Row 2: Giá trị cốt lõi — ảnh trái, text phải */}
            <div className="about-split about-split--reverse">
              <div className="about-split-visual">
                <img src={heroImg2} alt="iOrder quản lý trên nhiều thiết bị" loading="lazy" />
              </div>
              <div className="about-split-text">
                <span className="section-eyebrow">GIÁ TRỊ CỐT LÕI</span>
                <h2>Cam kết của chúng tôi với từng khách hàng</h2>
                <ul className="about-values-list">
                  <li><b>Sáng tạo không ngừng:</b> Liên tục cập nhật tính năng mới, ứng dụng công nghệ hiện đại vào quản lý bán hàng.</li>
                  <li><b>Chuyên nghiệp &amp; Tận tâm:</b> Đội ngũ hỗ trợ kỹ thuật 24/7, sẵn sàng phục vụ 365 ngày trong năm.</li>
                  <li><b>Đảm bảo an toàn dữ liệu:</b> Mã hóa toàn bộ, sao lưu tự động mỗi ngày, cam kết uptime 99.9%.</li>
                  <li><b>Đơn giản &amp; Chính xác:</b> Giao diện thân thiện, báo cáo thời gian thực, bám sát thực tế vận hành.</li>
                </ul>
              </div>
            </div>

          </div>
        </section>

        {/* Partners Section (số liệu đã hiển thị ở mục Giới thiệu công ty phía trên) */}
        {shouldShow('home_stats') && resolvedPartners.length > 0 ? <section {...mergeSectionProps('section home-stats-section', { order: blockOrder('home_stats') }, cmsStats, cmsMedia)}>
          <div className="container">
            {resolvedPartners.length > 0 ? <>
              <p className="partners-trust-line">
                {(isCmsMode ? cmsStats?.data?.partnersHeading : null) ?? 'Tin dùng bởi 10000+ doanh nghiệp & đơn vị đối tác'}
              </p>
              <div className="home-partner-marquee partner-marquee" aria-hidden="false">
                <div className="home-partner-track partner-track">
                  {resolvedPartners.map((p, idx) => (
                    <div key={`a-${idx}`} className="model-card" title={p.name}>
                      <SafeImage src={p.src} alt={p.name} loading="lazy" decoding="async" />
                    </div>
                  ))}
                  {resolvedPartners.map((p, idx) => (
                    <div key={`b-${idx}`} className="model-card" title={p.name}>
                      <SafeImage src={p.src} alt={p.name} loading="lazy" decoding="async" />
                    </div>
                  ))}
                </div>
              </div>
            </> : null}
          </div>
        </section> : null}

        {/* Industry Solutions Section */}
        {shouldShow('home_industries') ? <section {...mergeSectionProps('section industry-section', { order: blockOrder('home_industries') }, cmsIndustry, cmsMedia)}>
          <div className="container">
            <div className="industry-compact-header">
              <div>
                <span className="section-eyebrow">{cmsIndustry?.data?.eyebrow ?? 'THEO NGÀNH HÀNG'}</span>
                <h2>{cmsIndustry?.data?.heading ?? 'Phù hợp nhiều mô hình kinh doanh'}</h2>
              </div>
            </div>
            <div className="industry-row-grid">
              {resolvedIndustryGroups.map((group, gIdx) => {
                const GroupIcon = group.icon
                return (
                  <div className={`industry-row-group industry-card-${gIdx}`} key={group.title}>
                    <div className="industry-card-head">
                      <div className="industry-card-icon"><GroupIcon size={22} /></div>
                      <span className="industry-pill-label">{group.title}</span>
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
                  </div>
                )
              })}
            </div>
          </div>
        </section> : null}

        {/* Features Section */}
        {shouldShow('home_features') ? <section {...mergeSectionProps('section feature-showcase-section', { order: blockOrder('home_features') }, cmsFeatures, cmsMedia)}>
          <div className="container">
            <div className="section-title">
              <span className="section-eyebrow">{cmsFeatures?.data?.eyebrow ?? 'TÍNH NĂNG'}</span>
              <h2>{cmsFeatures?.data?.heading ?? 'Một nền tảng cho toàn bộ vận hành cửa hàng'}</h2>
              {cmsFeatures?.data?.intro ? <p>{cmsFeatures.data.intro}</p> : null}
            </div>
            <div className="feature-split-list">
              {resolvedFeatures.map((item, idx) => {
                const Icon = item.icon
                const isEven = idx % 2 === 1
                return (
                  <div className={`feature-split-row${isEven ? ' feature-split-row--reverse' : ''}`} key={idx}>
                    <div className={`feature-split-visual${item.imgUrl ? ' feature-split-visual--img' : ''}`}>
                      {item.imgUrl
                        ? <img className="feature-split-img" src={item.imgUrl} alt={item.title} loading="lazy" decoding="async" />
                        : <div className="feature-split-icon-wrap"><Icon size={52} /></div>}
                    </div>
                    <div className="feature-split-text">
                      <span className="feature-split-num">0{idx + 1}</span>
                      <h3>{item.title}</h3>
                      <p>{item.desc}</p>
                      {item.bullets?.length ? (
                        <ul className="feature-split-bullets">
                          {item.bullets.map((b) => <li key={b}>{b}</li>)}
                        </ul>
                      ) : null}
                      {item.href ? <Link to={item.href} className="feature-split-link">Xem chi tiết →</Link> : null}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section> : null}

        {/* Testimonials Section */}
        {shouldShow('home_testimonials') && resolvedTestimonials.length > 0 ? <section {...mergeSectionProps('section home-testimonials-section', { order: blockOrder('home_testimonials') }, cmsTestimonials, cmsMedia)}>
          <div className="container">
            <div className="section-title">
              <span className="section-eyebrow">{cmsTestimonials?.data?.eyebrow ?? 'KHÁCH HÀNG NÓI GÌ'}</span>
              <h2>{cmsTestimonials?.data?.heading ?? 'Trải nghiệm thực tế từ chủ cửa hàng'}</h2>
            </div>
            <div className="testimonial-grid">
              {resolvedTestimonials.map((item, idx) => (
                <div className="testimonial-card" key={`${item.name}-${idx}`}>
                  <Quote size={30} className="testimonial-quote-icon" />
                  <p>{item.quote}</p>
                  <div className="testimonial-author">
                    <div className="testimonial-avatar">
                      {item.avatarUrl ? <img src={item.avatarUrl} alt={item.name} /> : (item.initials ?? item.name?.[0])}
                    </div>
                    <div>
                      <strong>{item.name}</strong>
                      <span>{item.role ?? item.company}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section> : null}

        {/* Ecosystem Services Section */}
        {shouldShow('home_ecosystem_services') ? <section id="giai-phap" {...mergeSectionProps('section', { order: blockOrder('home_ecosystem_services') }, cmsEcosystem, cmsMedia)}>
          <div className="container">
            <div className="section-title">
              <span className="section-eyebrow">{cmsEcosystem?.data?.eyebrow ?? 'TRIỂN KHAI TRỌN GÓI'}</span>
              <h2>{cmsEcosystem?.data?.heading ?? 'Không chỉ phần mềm — triển khai trọn gói'}</h2>
              {cmsEcosystem?.data?.intro ? <p>{cmsEcosystem.data.intro}</p> : null}
            </div>

            <div className="solution-grid ecosystem-grid">
              {resolvedEcosystemGroups.map((group) => {
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
        </section> : null}

        {/* Process Section */}
        {shouldShow('home_process') ? <section {...mergeSectionProps('section deployment-section', { order: blockOrder('home_process') }, cmsProcess, cmsMedia)}>
          <div className="container deployment-grid">
            <div className="deployment-copy">
              <span className="section-eyebrow">{cmsProcess?.data?.eyebrow ?? 'QUY TRÌNH TRIỂN KHAI'}</span>
              <h2>{cmsProcess?.data?.heading ?? 'Từ tư vấn đến vận hành trong một quy trình rõ ràng'}</h2>
              <p>{cmsProcess?.data?.intro ?? 'iOrder không chỉ bàn giao phần mềm. Đội ngũ triển khai sẽ hỗ trợ chuẩn hóa dữ liệu, cấu hình thiết bị, đào tạo nhân viên và kiểm tra ca bán đầu tiên.'}</p>
              <Link to={cmsProcess?.data?.buttonUrl ?? '/lien-he'} className="btn primary deployment-link">
                {cmsProcess?.data?.buttonLabel ?? 'Nhận tư vấn triển khai'} <ArrowRight size={18} />
              </Link>
            </div>
            <div className="deployment-visual deployment-model-feature">
              <SafeImage src={processFeatureImage} alt={cmsProcess?.data?.heading ?? 'Mô hình máy POS kết nối thiết bị IoT iOrder'} loading="lazy" decoding="async" width="1536" height="1024" sizes="(max-width: 1023px) 100vw, 42vw" />
            </div>
            <div className="deployment-steps">
              {(cmsProcess?.data?.steps ?? [
                { title: 'Tư vấn mô hình', description: 'Xác định bạn dùng iOrder cho bán lẻ, cafe, nhà hàng hay chuỗi nhiều chi nhánh.' },
                { title: 'Chuẩn hóa dữ liệu', description: 'Nhập danh mục sản phẩm, menu, giá bán, nhân viên và tồn kho ban đầu.' },
                { title: 'Cài đặt thiết bị', description: 'Kết nối máy in hóa đơn, in bếp/bar, máy quét mã vạch và thiết bị bán hàng.' },
                { title: 'Đào tạo vận hành', description: 'Hướng dẫn nhân viên bán hàng, gọi món, chốt ca và xem báo cáo quản lý.' },
              ]).map((step, index) => (
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
        </section> : null}

        {/* Featured Posts Section */}
        {shouldShow('home_featured_posts') ? <section {...mergeSectionProps('section home-news-section', { order: blockOrder('home_featured_posts') }, cmsFeaturedPosts, cmsMedia)}>
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
              <button type="button" className="home-news-arrow prev" aria-label="Bài trước" onClick={() => goToNews('prev')}><ChevronLeft size={22} /></button>
              <div className="home-news-grid">
                {homeNews.map((article) => (
                  <Link to={`/tin-tuc/${article.slug}`} className="home-news-card" key={article.slug}>
                    <div className="home-news-image">
                      <SafeImage src={article.image} alt={article.imageAlt} loading="lazy" decoding="async" />
                    </div>
                    <div className="home-news-copy">
                      <span>{article.category}</span>
                      <h3>{article.title}</h3>
                      <p>{article.excerpt}</p>
                      <b>Xem thêm <ArrowRight size={16} /></b>
                    </div>
                  </Link>
                ))}
              </div>
              <button type="button" className="home-news-arrow next" aria-label="Bài tiếp theo" onClick={() => goToNews('next')}><ChevronRight size={22} /></button>
            </div>
          </div>
        </section> : null}

        {/* FAQ Section */}
        {shouldShow('home_faq') ? <section {...mergeSectionProps('section home-faq-section', { order: blockOrder('home_faq') }, cmsFaq, cmsMedia)}>
          <div className="container home-faq-container">
            <div className="section-title">
              <span className="section-eyebrow">{cmsFaq?.data?.eyebrow ?? 'CÂU HỎI THƯỜNG GẶP'}</span>
              <h2>{cmsFaq?.data?.heading ?? 'Giải đáp thắc mắc trước khi bạn bắt đầu'}</h2>
            </div>
            <div className="faq-list">
              {(isCmsMode && cmsFaq?.data?.items?.length
                ? cmsFaq.data.items.map((item) => ({ q: item.question, a: item.answer }))
                : faqItems
              ).map((item, idx) => {
                const isOpen = openFaq === idx
                return (
                  <div className={`faq-item${isOpen ? ' faq-item--open' : ''}`} key={idx}>
                    <button type="button" className="faq-question" onClick={() => setOpenFaq(isOpen ? null : idx)} aria-expanded={isOpen}>
                      <span>{item.q}</span>
                      <ChevronDown size={20} className="faq-chevron" />
                    </button>
                    <div className="faq-answer"><p>{item.a}</p></div>
                  </div>
                )
              })}
            </div>
            <div className="faq-cta">
              <p>Còn câu hỏi khác? Đội ngũ iOrder sẵn sàng hỗ trợ bạn.</p>
              <Link to="/lien-he" className="btn outline">Liên hệ ngay <ArrowRight size={16} /></Link>
            </div>
          </div>
        </section> : null}

        {/* CTA Section */}
        {shouldShow('home_cta') ? <section {...mergeSectionProps('section', { textAlign: 'center', padding: '60px 0', order: blockOrder('home_cta') }, cmsCta, cmsMedia)}>
          <div className="container">
            <h2 style={{ fontSize: 'clamp(28px, 3vw, 42px)', marginBottom: '20px' }}>{cmsCta?.data?.title ?? 'Sẵn sàng tăng cường bán hàng?'}</h2>
            <p style={{ fontSize: '18px', color: 'var(--muted)', marginBottom: '30px', maxWidth: '600px', margin: '0 auto 30px' }}>
              {cmsCta?.data?.description ?? 'Hãy trải nghiệm miễn phí trong 14 ngày. Không cần thẻ tín dụng, hủy bất cứ lúc nào.'}
            </p>
            <a href={cmsCta?.data?.buttonUrl ?? externalLinks.trial} target="_blank" rel="noreferrer" className="btn primary" style={{ display: 'inline-block', minWidth: '200px' }}>
              {cmsCta?.data?.buttonLabel ?? 'Bắt đầu dùng thử'}
            </a>
          </div>
        </section> : null}
    </PageLayout>
  )
}
