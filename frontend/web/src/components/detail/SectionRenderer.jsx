import { ArrowLeft, ArrowRight, Check, CheckCircle2, CircleHelp, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'

const PROCESS_DEFAULT = [
  'Khảo sát mô hình',
  'Chuẩn hóa dữ liệu',
  'Cài đặt và cấu hình',
  'Hướng dẫn vận hành',
]

function toText(value) {
  return String(value ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function LinkButton({ href = '/lien-he', children, className = 'btn primary detail-section-cta' }) {
  const content = <>{children}<ArrowRight size={17} /></>
  if (href.startsWith('/')) return <Link to={href} className={className}>{content}</Link>
  return <a href={href} className={className}>{content}</a>
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
      items: (offering.metrics ?? []).map((item) => ({ title: item })),
    },
  ]

  if (offering.metrics?.length) common.push({ id: 'legacy-stats', type: 'stats', items: offering.metrics.map((item) => ({ title: item })) })
  if (offering.features?.length) common.push({
    id: 'legacy-features', type: 'featureGrid', eyebrow: 'Khả năng vận hành',
    title: type === 'industry' ? 'Tính năng phù hợp ngành' : 'Tính năng chính',
    variant: type === 'software' ? 'icon-list' : 'default',
    items: offering.features.map((item) => ({ title: item })),
  })
  if (offering.benefits?.length) common.push({
    id: 'legacy-benefits', type: 'benefitList', variant: 'soft', eyebrow: 'Lợi ích',
    title: 'Thiết kế để vận hành nhẹ nhàng hơn', items: offering.benefits.map((item) => ({ title: item })),
  })
  if (type === 'software') common.push({
    id: 'legacy-process', type: 'process', eyebrow: 'Triển khai thực tế',
    title: `Đưa ${title.replace(/\s+-\s+iOrder$/i, '')} vào vận hành`,
    body: 'iOrder đồng hành từ khảo sát mô hình, cấu hình dữ liệu đến hướng dẫn nhân viên vận hành tại điểm bán.',
    imageUrl: offering.coverUrl || fallbackImage, imageAlt: `Thiết bị iOrder`,
    items: PROCESS_DEFAULT.map((item) => ({ title: item })),
  })
  if (offering.faq?.length) common.push({
    id: 'legacy-faq', type: 'faq', eyebrow: 'Giải đáp', title: 'Câu hỏi thường gặp',
    items: offering.faq.map(([title, description]) => ({ title, description })),
  })
  common.push({
    id: 'legacy-cta', type: 'cta', eyebrow: 'Tư vấn cùng iOrder',
    title: `Cần tư vấn ${title.toLowerCase()}?`,
    body: 'Chia sẻ mô hình kinh doanh và nhu cầu vận hành để đội ngũ iOrder đề xuất cấu hình phù hợp.',
    variant: type === 'software' ? 'gradient' : 'default', ctaLabel: 'Liên hệ tư vấn', ctaHref: '/lien-he',
  })
  return common
}

function HeroSection({ section, offering, type, backPath, backLabel, fallbackImage }) {
  const items = section.items?.length ? section.items : (offering.metrics ?? []).map((title) => ({ title }))
  const image = section.imageUrl || offering.coverUrl || fallbackImage
  return (
    <section className={`detail-dynamic-hero detail-dynamic-hero--${section.variant || 'default'}`}>
      <div className={`container detail-dynamic-hero__grid detail-dynamic-hero__grid--${section.alignment || 'left'}`}>
        <div className="detail-dynamic-hero__copy">
          <Link to={backPath} className="detail-back-link"><ArrowLeft size={18} />{backLabel}</Link>
          <span className="detail-eyebrow">{section.eyebrow || offering.category || 'iOrder'}</span>
          <h1>{section.title || offering.title}</h1>
          <p>{toText(section.body || offering.description || offering.summary)}</p>
          {section.ctaLabel ? <LinkButton href={section.ctaHref || '/lien-he'}>{section.ctaLabel}</LinkButton> : null}
        </div>
        <div className="detail-dynamic-hero__visual">
          <ImageFrame src={image} alt={section.imageAlt || `Minh họa ${offering.title}`} />
          {items.length ? <div className="detail-hero-facts">
            {items.slice(0, 3).map((item) => <div key={item.title}><CheckCircle2 size={18} /><span>{item.title}</span></div>)}
          </div> : null}
        </div>
      </div>
    </section>
  )
}

function StatsSection({ section }) {
  if (!section.items?.length) return null
  return <section className="detail-dynamic-section detail-dynamic-section--compact"><div className="container">
    <div className="detail-stat-strip">{section.items.map((item) => <div key={item.title}><strong>{item.title}</strong>{item.description ? <span>{item.description}</span> : null}</div>)}</div>
  </div></section>
}

function FeatureGridSection({ section }) {
  if (!section.items?.length) return null
  return <section className={`detail-dynamic-section detail-dynamic-section--${section.variant || 'default'}`}><div className="container">
    <SectionHeading eyebrow={section.eyebrow} title={section.title} body={section.body} align={section.alignment || 'center'} />
    <div className="detail-feature-grid">{section.items.map((item, index) => <article key={`${item.title}-${index}`} className="detail-feature-item">
      <span>{String(index + 1).padStart(2, '0')}</span><h3>{item.title}</h3>{item.description ? <p>{toText(item.description)}</p> : null}
      {item.href ? <LinkButton href={item.href} className="detail-inline-link">Khám phá</LinkButton> : null}
    </article>)}</div>
  </div></section>
}

function BenefitSection({ section }) {
  if (!section.items?.length) return null
  return <section className="detail-dynamic-section detail-benefit-section"><div className="container detail-benefit-section__grid">
    <SectionHeading eyebrow={section.eyebrow} title={section.title} body={section.body} align={section.alignment || 'left'} />
    <div className="detail-benefit-list">{section.items.map((item) => <div key={item.title}><Check size={19} /><div><strong>{item.title}</strong>{item.description ? <p>{toText(item.description)}</p> : null}</div></div>)}</div>
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

function ProcessSection({ section, offering, fallbackImage }) {
  const items = section.items?.length ? section.items : PROCESS_DEFAULT.map((title) => ({ title }))
  return <section className="detail-dynamic-section detail-process-section"><div className="container detail-process-section__grid">
    <div><SectionHeading eyebrow={section.eyebrow} title={section.title} body={section.body} align={section.alignment || 'left'} />
      <ol>{items.map((item, index) => <li key={item.title}><span>{index + 1}</span><div><strong>{item.title}</strong>{item.description ? <p>{toText(item.description)}</p> : null}</div></li>)}</ol>
    </div>
    <ImageFrame src={section.imageUrl || offering.coverUrl || fallbackImage} alt={section.imageAlt || section.title || offering.title} />
  </div></section>
}

function FaqSection({ section }) {
  if (!section.items?.length) return null
  return <section className="detail-dynamic-section"><div className="container">
    <SectionHeading eyebrow={section.eyebrow} title={section.title} body={section.body} align={section.alignment || 'center'} />
    <div className="detail-faq-accordion">{section.items.map((item, index) => <details key={item.title} open={index === 0}>
      <summary><span><CircleHelp size={20} />{item.title}</span><span aria-hidden="true">+</span></summary>
      <p>{toText(item.description)}</p>
    </details>)}</div>
  </div></section>
}

function CtaSection({ section }) {
  return <section className="detail-dynamic-section detail-cta-section"><div className="container"><div>
    <SectionHeading eyebrow={section.eyebrow} title={section.title} body={section.body} align={section.alignment || 'center'} />
    <LinkButton href={section.ctaHref || '/lien-he'}>{section.ctaLabel || 'Liên hệ tư vấn'}</LinkButton>
  </div></div></section>
}

export default function SectionRenderer({ offering, type, backPath, backLabel, fallbackImage }) {
  const sections = buildDetailSections(offering, type, fallbackImage)
  return sections.map((section) => {
    const props = { section, offering, type, backPath, backLabel, fallbackImage }
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
