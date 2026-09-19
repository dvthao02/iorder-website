import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Clock, LifeBuoy, ListTree } from 'lucide-react'

import PageLayout from '../components/PageLayout'
import SafeImage from '../components/SafeImage'
import { fetchPublishedPost, fetchPublishedPosts } from '../utils/contentApi'
import { setPageSeo } from '../utils/seo'

function slugifyHeading(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function buildTableOfContents(html) {
  if (!html || typeof window === 'undefined') return { html: html ?? '', toc: [] }
  const documentFragment = new DOMParser().parseFromString(html, 'text/html')
  const usedIds = {}
  const toc = []
  documentFragment.querySelectorAll('h2, h3').forEach((heading) => {
    const text = heading.textContent.trim()
    if (!text) return
    const baseId = slugifyHeading(text) || 'muc'
    const number = usedIds[baseId] ?? 0
    usedIds[baseId] = number + 1
    const id = number ? `${baseId}-${number + 1}` : baseId
    heading.id = id
    toc.push({ id, text, level: heading.tagName === 'H3' ? 3 : 2 })
  })
  return { html: documentFragment.body.innerHTML, toc }
}

export default function GuideDetail() {
  const { slug } = useParams()
  const [guide, setGuide] = useState(null)
  const [relatedGuides, setRelatedGuides] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeId, setActiveId] = useState('')

  useEffect(() => {
    setIsLoading(true)
    Promise.all([fetchPublishedPost(slug), fetchPublishedPosts(100, null, 'guide')])
      .then(([current, all]) => {
        if (current.type !== 'guide') throw new Error('GUIDE_NOT_FOUND')
        setGuide(current)
        setRelatedGuides(all.filter((item) => item.id !== current.id).slice(0, 4))
      })
      .catch(() => setGuide(null))
      .finally(() => setIsLoading(false))
  }, [slug])

  useEffect(() => {
    setPageSeo({
      title: guide ? `${guide.title} - Hướng dẫn iOrder` : 'Hướng dẫn sử dụng iOrder',
      description: guide?.excerpt ?? 'Tài liệu hướng dẫn vận hành iOrder.',
      image: guide?.image ?? undefined,
      type: 'article',
    })
  }, [guide])

  const { html, toc } = useMemo(() => buildTableOfContents(guide?.bodyHtml), [guide?.bodyHtml])

  useEffect(() => {
    if (!toc.length) return undefined
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActiveId(visible[0].target.id)
      },
      { rootMargin: '-110px 0px -70% 0px' },
    )
    toc.forEach(({ id }) => {
      const heading = document.getElementById(id)
      if (heading) observer.observe(heading)
    })
    return () => observer.disconnect()
  }, [html, toc])

  if (isLoading) {
    return (
      <PageLayout mainClassName="guides-page">
        <div className="container guides-state">Đang tải hướng dẫn...</div>
      </PageLayout>
    )
  }

  if (!guide) {
    return (
      <PageLayout mainClassName="guides-page">
        <div className="container guides-empty guides-empty-page">
          <BookOpen size={30} aria-hidden="true" />
          <h1>Không tìm thấy hướng dẫn</h1>
          <p>Tài liệu có thể chưa được xuất bản hoặc đường dẫn không còn đúng.</p>
          <Link to="/huong-dan" className="btn primary">
            <ArrowLeft size={16} /> Quay lại thư viện hướng dẫn
          </Link>
        </div>
      </PageLayout>
    )
  }

  const category = guide.categories?.[0]?.name ?? guide.category ?? 'Hướng dẫn iOrder'

  return (
    <PageLayout mainClassName="guide-detail-page">
      <section className="guide-detail-hero">
        <div className="container">
          <nav className="guide-breadcrumb" aria-label="Breadcrumb">
            <Link to="/">Trang chủ</Link>
            <span>/</span>
            <Link to="/huong-dan">Hướng dẫn sử dụng</Link>
            <span>/</span>
            <strong>{category}</strong>
          </nav>
          <div className="guide-detail-hero-grid">
            <div>
              <span className="guide-card-category">{category}</span>
              <h1>{guide.title}</h1>
              {guide.excerpt ? <p>{guide.excerpt}</p> : null}
              <span className="guide-detail-meta">
                <Clock size={15} /> {guide.readingTime}
                <span aria-hidden="true">•</span>
                Cập nhật {new Date(guide.updatedAt).toLocaleDateString('vi-VN')}
              </span>
            </div>
            {guide.image ? (
              <div className="guide-detail-cover">
                <SafeImage src={guide.image} alt={guide.imageAlt} loading="eager" decoding="sync" fetchPriority="high" />
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="guide-reading-section">
        <div className="container guide-reading-grid">
          <article className="guide-reading-content">
            {html ? <div className="guide-rich" dangerouslySetInnerHTML={{ __html: html }} /> : null}
            {guide.checklist?.length ? (
              <aside className="guide-steps-box">
                <h2>Cần chuẩn bị</h2>
                {guide.checklist.map((item) => (
                  <p key={item}>
                    <CheckCircle2 size={18} /> {item}
                  </p>
                ))}
              </aside>
            ) : null}
          </article>

          <aside className="guide-sidebar">
            {toc.length ? (
              <nav className="guide-toc" aria-label="Mục lục hướng dẫn">
                <h2>
                  <ListTree size={17} /> Trong hướng dẫn này
                </h2>
                {toc.map((item) => (
                  <a key={item.id} href={`#${item.id}`} className={`level-${item.level}${activeId === item.id ? ' is-active' : ''}`}>
                    {item.text}
                  </a>
                ))}
              </nav>
            ) : null}
            <div className="guide-help-card">
              <LifeBuoy size={22} />
              <h2>Cần hỗ trợ thêm?</h2>
              <p>Đội ngũ iOrder sẵn sàng giúp bạn thao tác đúng quy trình.</p>
              <Link to="/lien-he">
                Liên hệ hỗ trợ <ArrowRight size={15} />
              </Link>
            </div>
          </aside>
        </div>
      </section>

      {relatedGuides.length ? (
        <section className="guide-related-section">
          <div className="container">
            <div className="guide-related-head">
              <div>
                <span className="guides-library-label">Tiếp tục khám phá</span>
                <h2>Hướng dẫn liên quan</h2>
              </div>
              <Link to="/huong-dan">Xem tất cả <ArrowRight size={16} /></Link>
            </div>
            <div className="guide-related-list">
              {relatedGuides.map((item) => (
                <Link to={`/huong-dan/${item.slug}`} key={item.id}>
                  <BookOpen size={18} />
                  <span>
                    <small>{item.categories?.[0]?.name ?? item.category ?? 'Hướng dẫn iOrder'}</small>
                    <strong>{item.title}</strong>
                  </span>
                  <ArrowRight size={17} />
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </PageLayout>
  )
}
