import { ArrowLeft, ArrowRight, BarChart3, Boxes, Check, CheckCircle2, ChevronDown, CircleHelp, FileText, LayoutGrid, Printer, Settings2, ShoppingCart, Sparkles, Users, WalletCards } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { externalLinks } from '../../data/siteContent'

const PROCESS_DEFAULT = [
  'Khảo sát mô hình',
  'Chuẩn hóa dữ liệu',
  'Cài đặt và cấu hình',
  'Hướng dẫn vận hành',
]

function toText(value) {
  return String(value ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function toSectionItem(value) {
  if (typeof value === 'string') return { title: value }
  return value ?? { title: '' }
}

function LinkButton({ href = '/lien-he', children, className = 'btn primary detail-section-cta' }) {
  const content = <>{children}<ArrowRight size={17} /></>
  if (href.startsWith('/')) return <Link to={href} className={className}>{content}</Link>
  return <a href={href} className={className}>{content}</a>
}

function Reveal({ children, className = '' }) {
  const ref = useRef(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element || !('IntersectionObserver' in window)) {
      setIsVisible(true)
      return undefined
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true)
        observer.disconnect()
      }
    }, { threshold: 0.14 })

    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return <div ref={ref} className={`reveal ${isVisible ? 'is-visible' : ''} ${className}`.trim()}>{children}</div>
}

function SectionHeading({ eyebrow, title, body, align = 'left' }) {
  if (!eyebrow && !title && !body) return null
  return (
    <header className={`detail-section-heading detail-section-heading--${align}`}>
      {eyebrow ? <span className="detail-eyebrow">{eyebrow}</span> : null}
      {title ? <h2>{title}</h2> : null}
      {body ? <p>{toText(body)}</p> : null}
    </header>
  )
}

function ImageFrame({ src, alt, className = '' }) {
  if (!src) return null
  return <div className={`detail-media-frame ${className}`}><img src={src} alt={alt || ''} loading="lazy" decoding="async" /></div>
}

export function buildDetailSections(offering, type, fallbackImage) {
  const visibleSections = (offering.sections ?? []).filter((section) => section.isVisible !== false)
  if (visibleSections.length) return visibleSections

  const title = offering.title
  const description = offering.description || offering.summary
  const common = [
    {
      id: 'legacy-hero', type: 'hero', eyebrow: offering.category || (type === 'software' ? 'iOrder Software' : 'iOrder'),
      title, body: description, imageUrl: offering.coverUrl || fallbackImage, imageAlt: `Minh họa ${title}`,
      variant: type === 'software' ? 'product-showcase' : 'default',
      items: (offering.metrics ?? []).map(toSectionItem),
    },
  ]

  if (offering.metrics?.length) common.push({ id: 'legacy-stats', type: 'stats', items: offering.metrics.map(toSectionItem) })
  if (offering.features?.length) common.push({
    id: 'legacy-features', type: 'featureGrid', eyebrow: 'Khả năng vận hành',
    title: type === 'software' ? 'Quy trình vận hành trên iOrder' : type === 'industry' ? 'Tính năng phù hợp ngành' : 'Tính năng chính',
    body: type === 'software' ? 'Từ chuẩn bị dữ liệu đến bán hàng, chốt ca và theo dõi vận hành — mọi module được kết nối theo một luồng rõ ràng.' : undefined,
    variant: type === 'software' ? 'product-workflow' : 'default',
    items: offering.features.map(toSectionItem),
  })
  if (offering.benefits?.length) common.push({
    id: 'legacy-benefits', type: 'benefitList', variant: 'soft', eyebrow: 'Lợi ích',
    title: 'Thiết kế để vận hành nhẹ nhàng hơn', items: offering.benefits.map(toSectionItem),
  })
  if (type === 'software') common.push({
    id: 'legacy-process', type: 'process', eyebrow: 'Triển khai thực tế',
    title: `Đưa ${title.replace(/\s+-\s+iOrder$/i, '')} vào vận hành`,
    body: 'iOrder đồng hành từ khảo sát mô hình, cấu hình dữ liệu đến hướng dẫn nhân viên vận hành tại điểm bán.',
    imageAlt: `Thiết bị iOrder`,
    items: PROCESS_DEFAULT.map((item) => ({ title: item })),
  })
  if (offering.faq?.length) common.push({
    id: 'legacy-faq', type: 'faq', eyebrow: 'Giải đáp', title: 'Câu hỏi thường gặp',
    items: offering.faq.map(([title, description]) => ({ title, description })),
  })
  common.push({
    id: 'legacy-cta', type: 'cta', eyebrow: 'Tư vấn cùng iOrder',
    title: type === 'software' ? `Sẵn sàng vận hành ${title.replace(/\s+-\s+iOrder$/i, '').toLowerCase()} hiệu quả hơn?` : `Cần tư vấn ${title.toLowerCase()}?`,
    body: type === 'software'
      ? 'Chia sẻ mô hình kinh doanh và nhu cầu vận hành. Đội ngũ iOrder sẽ tư vấn cấu hình phù hợp nhất.'
      : 'Chia sẻ mô hình kinh doanh và nhu cầu vận hành để đội ngũ iOrder đề xuất cấu hình phù hợp.',
    variant: type === 'software' ? 'gradient' : 'default', ctaLabel: type === 'software' ? 'Đăng ký dùng thử' : 'Liên hệ tư vấn', ctaHref: type === 'software' ? externalLinks.trial : '/lien-he',
  })
  return common
}

function HeroSection({ section, offering, type, backPath, backLabel, fallbackImage, hasStats }) {
  const items = section.items?.length ? section.items : (offering.metrics ?? []).map(toSectionItem)
  const image = section.imageUrl || offering.coverUrl || fallbackImage
  const ctaLabel = section.ctaLabel || (type === 'software' ? 'Dùng thử miễn phí' : null)
  const primaryHref = section.ctaHref || (type === 'software' ? externalLinks.trial : '/lien-he')
  const hasVideo = Boolean(section.videoUrl || offering.videoUrl || section.secondaryCtaHref)
  const secondaryHref = section.secondaryCtaHref || section.videoUrl || offering.videoUrl || '#quy-trinh'
  return (
    <section className={`detail-dynamic-hero detail-dynamic-hero--${section.variant || 'default'}`}>
      <div className="container detail-dynamic-hero__back-row">
        <Link to={backPath} className="detail-back-link"><ArrowLeft size={18} />{backLabel}</Link>
      </div>
      <Reveal className={`container detail-dynamic-hero__grid detail-dynamic-hero__grid--${section.alignment || 'left'}`}>
        <div className="detail-dynamic-hero__copy">
          <span className="detail-eyebrow">{section.eyebrow || offering.category || 'iOrder'}</span>
          <h1>{section.title || offering.title}</h1>
          <p>{toText(section.body || offering.description || offering.summary)}</p>
          <div className="detail-hero-actions">
            {ctaLabel ? <LinkButton href={primaryHref}>{ctaLabel}</LinkButton> : null}
            {type === 'software' ? <LinkButton href={secondaryHref} className="detail-secondary-cta">{hasVideo ? 'Xem video giới thiệu' : 'Xem quy trình triển khai'}</LinkButton> : null}
          </div>
        </div>
        <div className="detail-dynamic-hero__visual">
          <ImageFrame src={image} alt={section.imageAlt || `Minh họa ${offering.title}`} />
          {!hasStats && items.length ? <div className="detail-hero-facts">
            {items.slice(0, 3).map((item) => <div key={item.title}><CheckCircle2 size={18} /><span>{item.title}</span></div>)}
          </div> : null}
        </div>
      </Reveal>
    </section>
  )
}

function StatsSection({ section }) {
  if (!section.items?.length) return null
  return <section className="detail-dynamic-section detail-dynamic-section--compact"><div className="container">
    <div className="detail-stat-strip">{section.items.map((item) => <div key={item.title}><CheckCircle2 size={20} /><div><strong>{item.title}</strong>{item.description ? <span>{item.description}</span> : null}</div></div>)}</div>
  </div></section>
}

const PRODUCT_FEATURE_ICONS = {
  sales: ShoppingCart,
  invoice: FileText,
  catalog: Boxes,
  tables: LayoutGrid,
  inventory: Boxes,
  customers: Users,
  staff: Users,
  cashflow: WalletCards,
  reporting: BarChart3,
  devices: Printer,
  settings: Settings2,
  integrations: Sparkles,
}
const PRODUCT_FEATURE_FALLBACK_ICONS = [ShoppingCart, Boxes, Printer, Users, BarChart3]
const PRODUCT_BENEFIT_ICONS = [Users, CheckCircle2, BarChart3, Boxes]
const PRODUCT_WORKFLOW_STEPS = [
  { id: 'setup', title: 'Thiết lập cửa hàng', description: 'Tạo danh mục, giá bán và quy tắc vận hành trước khi mở quầy.' },
  { id: 'inventory', title: 'Chuẩn bị hàng hóa', description: 'Nhập kho và kết nối thiết bị cần thiết trước khi bán.' },
  { id: 'sales', title: 'Bán hàng tại quầy', description: 'Tạo đơn, gọi món và xử lý đơn theo thời gian thực.' },
  { id: 'settlement', title: 'Thanh toán & chốt ca', description: 'Phát hành hóa đơn và đối soát dòng tiền cuối ca.' },
  { id: 'growth', title: 'Theo dõi & mở rộng', description: 'Chăm sóc khách, đọc báo cáo và kết nối hệ thống.' },
]

function ProductWorkflowSection({ section }) {
  const ref = useRef(null)
  const [isVisible, setIsVisible] = useState(false)
  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    const element = ref.current
    if (!element) return undefined

    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion || !('IntersectionObserver' in window)) {
      setIsVisible(true)
      setActiveStep(PRODUCT_WORKFLOW_STEPS.length)
      return undefined
    }

    let interval
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      setIsVisible(true)
      setActiveStep(1)
      interval = window.setInterval(() => {
        setActiveStep((current) => current >= PRODUCT_WORKFLOW_STEPS.length ? 1 : current + 1)
      }, 3000)
      observer.disconnect()
    }, { threshold: 0.28 })

    observer.observe(element)
    return () => {
      observer.disconnect()
      if (interval) window.clearInterval(interval)
    }
  }, [])

  return <section className="detail-dynamic-section detail-product-workflow"><div className="container">
    <SectionHeading eyebrow={section.eyebrow} title={section.title} body={section.body} align={section.alignment || 'center'} />
    <div ref={ref} className={`detail-workflow-reveal ${isVisible ? 'is-visible' : ''}`}><div className="detail-workflow-grid" aria-label="Quy trình vận hành trên iOrder">
      {PRODUCT_WORKFLOW_STEPS.map((step, stepIndex) => {
        const modules = section.items.filter((item) => item.workflow === step.id)
        if (!modules.length) return null
        const isActive = stepIndex < activeStep
        const isCurrent = stepIndex === activeStep - 1
        return <article className={`detail-workflow-step ${isActive ? 'is-active' : ''} ${isCurrent ? 'is-current' : ''}`} key={step.id}>
          <span className="detail-workflow-step__index">{String(stepIndex + 1).padStart(2, '0')}</span>
          <h3>{step.title}</h3>
          <p>{step.description}</p>
          <ul>{modules.map((item, index) => {
            const Icon = PRODUCT_FEATURE_ICONS[item.icon] || PRODUCT_FEATURE_FALLBACK_ICONS[index % PRODUCT_FEATURE_FALLBACK_ICONS.length]
            return <li key={item.title}><Icon size={16} /><span>{item.title}</span></li>
          })}</ul>
          {isCurrent && stepIndex < PRODUCT_WORKFLOW_STEPS.length - 1 ? <span className="detail-workflow-step__signal" aria-hidden="true" /> : null}
          {stepIndex < PRODUCT_WORKFLOW_STEPS.length - 1 ? <ArrowRight className={`detail-workflow-step__arrow ${isCurrent ? 'is-transmitting' : ''}`} size={18} aria-hidden="true" /> : null}
        </article>
      })}
    </div></div>
  </div></section>
}

function FeatureGridSection({ section, type }) {
  if (!section.items?.length) return null
  const usesIconBadge = section.variant === 'icon-list'
  const usesProductGrid = type === 'software' && section.variant === 'product-grid'
  const usesProductWorkflow = type === 'software' && section.variant === 'product-workflow' && section.items.some((item) => item.workflow)
  if (usesProductWorkflow) return <ProductWorkflowSection section={section} />
  return <section className={`detail-dynamic-section detail-dynamic-section--${section.variant || 'default'}`}><div className="container">
    <SectionHeading eyebrow={section.eyebrow} title={section.title} body={section.body} align={section.alignment || 'center'} />
    <div className="detail-feature-grid">{section.items.map((item, index) => <article key={`${item.title}-${index}`} className="detail-feature-item card feature-row">
      {usesProductGrid ? (() => { const Icon = PRODUCT_FEATURE_ICONS[item.icon] || PRODUCT_FEATURE_FALLBACK_ICONS[index % PRODUCT_FEATURE_FALLBACK_ICONS.length]; return <><span className="detail-feature-item__badge icon-badge"><Icon size={22} /></span><span className="detail-feature-item__number">{String(index + 1).padStart(2, '0')}</span></> })() : usesIconBadge ? <span className="detail-feature-item__badge icon-badge"><Check size={20} /></span> : <span>{String(index + 1).padStart(2, '0')}</span>}
      <h3>{item.title}</h3>{item.description ? <p>{toText(item.description)}</p> : null}
      {item.href ? <LinkButton href={item.href} className="detail-inline-link">Khám phá</LinkButton> : null}
    </article>)}</div>
  </div></section>
}

function BenefitSection({ section, type }) {
  if (!section.items?.length) return null
  return <section id={type === 'software' ? 'loi-ich' : undefined} className="detail-dynamic-section detail-benefit-section"><div className="container detail-benefit-section__grid">
    <div className="detail-benefit-section__copy">
      <SectionHeading eyebrow={section.eyebrow} title={section.title} body={section.body} align={section.alignment || 'left'} />
      {type === 'software' ? <LinkButton href={section.ctaHref || '/lien-he'} className="detail-inline-link detail-benefit-cta">Khám phá lợi ích</LinkButton> : null}
    </div>
    <div className={`detail-benefit-list ${type === 'software' ? 'detail-benefit-list--cards' : ''}`}>{section.items.map((item, index) => {
      const Icon = PRODUCT_BENEFIT_ICONS[index % PRODUCT_BENEFIT_ICONS.length]
      return <div key={item.title}>{type === 'software' ? <Icon size={19} /> : <Check size={19} />}<div><strong>{item.title}</strong>{item.description ? <p>{toText(item.description)}</p> : null}</div></div>
    })}</div>
  </div></section>
}

function ImageTextSection({ section, offering, fallbackImage }) {
  return <section className={`detail-dynamic-section detail-image-text detail-image-text--${section.variant || 'default'}`}><div className="container detail-image-text__grid">
    <ImageFrame src={section.imageUrl || offering.coverUrl || fallbackImage} alt={section.imageAlt || section.title || offering.title} />
    <div><SectionHeading eyebrow={section.eyebrow} title={section.title} body={section.body} align={section.alignment || 'left'} />
      {section.items?.length ? <div className="detail-mini-list">{section.items.map((item) => <div key={item.title}><Sparkles size={18} /><span>{item.title}</span></div>)}</div> : null}
      {section.ctaLabel ? <LinkButton href={section.ctaHref || '/lien-he'}>{section.ctaLabel}</LinkButton> : null}
    </div>
  </div></section>
}

function ProcessStepper({ items }) {
  const ref = useRef(null)
  const [isVisible, setIsVisible] = useState(false)
  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    const element = ref.current
    if (!element) return undefined

    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion || !('IntersectionObserver' in window)) {
      setIsVisible(true)
      setActiveStep(items.length)
      return undefined
    }

    const timers = []
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      setIsVisible(true)
      items.forEach((_, index) => {
        timers.push(window.setTimeout(() => setActiveStep(index + 1), 220 + index * 680))
      })
      observer.disconnect()
    }, { threshold: 0.32 })

    observer.observe(element)
    return () => {
      observer.disconnect()
      timers.forEach((timer) => window.clearTimeout(timer))
    }
  }, [items])

  return <div ref={ref} className={`detail-stepper ${isVisible ? 'is-visible' : ''}`}>
    <ol>{items.map((item, index) => <li className={index < activeStep ? 'is-active' : ''} key={item.title}>
      <span>{index + 1}</span><div><strong>{item.title}</strong>{item.description ? <p>{toText(item.description)}</p> : null}</div>
    </li>)}</ol>
  </div>
}

function ProcessSection({ section, offering, fallbackImage, processImage }) {
  const items = section.items?.length ? section.items : PROCESS_DEFAULT.map((title) => ({ title }))
  const image = section.imageUrl || processImage || offering.coverUrl || fallbackImage
  return <section id="quy-trinh" className="detail-dynamic-section detail-process-section"><div className="container detail-process-section__grid">
    <div><SectionHeading eyebrow={section.eyebrow} title={section.title} body={section.body} align={section.alignment || 'left'} />
      <ProcessStepper items={items} />
    </div>
    <ImageFrame className={processImage ? 'detail-process-visual' : ''} src={image} alt={section.imageAlt || section.title || offering.title} />
  </div></section>
}

function FaqItem({ item, index }) {
  const [isOpen, setIsOpen] = useState(index === 0)
  return <article className={`detail-faq-item ${isOpen ? 'open' : ''}`}>
    <button type="button" aria-expanded={isOpen} onClick={() => setIsOpen((current) => !current)}>
      <span><CircleHelp size={20} />{item.title}</span>
      <ChevronDown className="faq-icon" size={20} aria-hidden="true" />
    </button>
    <div className="faq-content"><p>{toText(item.description)}</p></div>
  </article>
}

function FaqSection({ section }) {
  if (!section.items?.length) return null
  return <section className="detail-dynamic-section"><div className="container">
    <SectionHeading eyebrow={section.eyebrow} title={section.title} body={section.body} align={section.alignment || 'center'} />
    <div className="detail-faq-accordion">{section.items.map((item, index) => <FaqItem key={item.title} item={item} index={index} />)}</div>
  </div></section>
}

function CtaSection({ section, type }) {
  return <section className={`detail-dynamic-section detail-cta-section detail-cta-section--${type}`}><Reveal className="container"><div>
    <SectionHeading eyebrow={section.eyebrow} title={section.title} body={section.body} align={type === 'software' ? 'left' : section.alignment || 'center'} />
    <LinkButton href={section.ctaHref || '/lien-he'}>{section.ctaLabel || 'Liên hệ tư vấn'}</LinkButton>
  </div></Reveal></section>
}

export default function SectionRenderer({ offering, type, backPath, backLabel, fallbackImage, processImage }) {
  const sections = buildDetailSections(offering, type, fallbackImage)
  const hasStats = sections.some((section) => section.type === 'stats' && section.isVisible !== false)
  return sections.map((section) => {
    const props = { section, offering, type, backPath, backLabel, fallbackImage, processImage, hasStats }
    const classes = [
      'detail-section-renderer-block',
      `detail-section-renderer-block--${section.background || 'white'}`,
      `detail-section-renderer-block--${section.container || 'standard'}`,
      `detail-section-renderer-block--${section.spacing || 'normal'}`,
      `detail-section-renderer-block--variant-${String(section.variant || 'default').replace(/[^a-z0-9-]/gi, '-').toLowerCase()}`,
    ].join(' ')
    let content = null
    switch (section.type) {
      case 'hero': content = <HeroSection {...props} />; break
      case 'stats': content = <StatsSection {...props} />; break
      case 'featureGrid': case 'useCases': case 'comparison': content = <FeatureGridSection {...props} />; break
      case 'benefitList': case 'highlight': case 'testimonial': content = <BenefitSection {...props} />; break
      case 'imageText': case 'richText': content = <ImageTextSection {...props} />; break
      case 'imageShowcase': case 'deviceShowcase': case 'gallery': content = <ImageTextSection {...props} />; break
      case 'process': case 'steps': content = <ProcessSection {...props} />; break
      case 'faq': content = <FaqSection {...props} />; break
      case 'cta': content = <CtaSection {...props} />; break
      case 'spacer': content = <div className="detail-section-spacer" aria-hidden="true" />; break
      default: content = null
    }
    return content ? <div key={section.id} className={classes}>{content}</div> : null
  })
}
