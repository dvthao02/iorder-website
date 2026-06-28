import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowRight, Calendar, CheckCircle, Clock, Eye, Link2, Users } from 'lucide-react'
import PageLayout from '../components/PageLayout'
import SafeImage from '../components/SafeImage'

// Lucide đã gỡ icon thương hiệu → dùng SVG glyph cho Facebook và X.
function IconFacebook() {
  return <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M13.5 21v-7h2.3l.4-2.7h-2.7V9.5c0-.8.2-1.3 1.4-1.3h1.4V5.8c-.7-.1-1.4-.1-2.1-.1-2.1 0-3.5 1.3-3.5 3.6v2H8.3V14h2.3v7h2.9z" /></svg>
}
function IconX() {
  return <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true"><path d="M17.5 3h3l-6.6 7.5L21.7 21h-5.9l-4.6-6-5.3 6H3l7-8L2.6 3h6l4.2 5.5L17.5 3zm-1 16h1.6L8 4.7H6.3L16.5 19z" /></svg>
}
import { findNewsArticle, newsArticles } from '../data/newsArticles'
import { setPageSeo } from '../utils/seo'
import { fetchPublishedPost, fetchPublishedPosts } from '../utils/contentApi'

function slugifyHeading(value) {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

// Tách mục lục từ HTML nội dung và gắn id cho các thẻ tiêu đề (h2/h3).
function buildTableOfContents(html) {
  if (!html || typeof window === 'undefined') return { html: html ?? '', toc: [] }
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const headings = doc.querySelectorAll('h2, h3')
  const toc = []
  const used = {}
  headings.forEach((heading) => {
    const text = heading.textContent.trim()
    if (!text) return
    let id = slugifyHeading(text) || 'muc'
    if (used[id]) { used[id] += 1; id = `${id}-${used[id]}` } else used[id] = 1
    heading.setAttribute('id', id)
    toc.push({ id, text, level: heading.tagName === 'H3' ? 3 : 2 })
  })
  return { html: doc.body.innerHTML, toc }
}

function formatViews(count) {
  if (typeof count !== 'number') return '0'
  if (count >= 1000) return `${(count / 1000).toFixed(count >= 10000 ? 0 : 1)}K`
  return String(count)
}

export default function NewsDetail() {
  const { slug } = useParams()
  const [article, setArticle] = useState(() => findNewsArticle(slug))
  const [relatedArticles, setRelatedArticles] = useState(() => newsArticles.filter((item) => item.slug !== slug).slice(0, 3))
  const [isLoadingArticle, setIsLoadingArticle] = useState(true)
  const [activeId, setActiveId] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setIsLoadingArticle(true)
    Promise.all([fetchPublishedPost(slug), fetchPublishedPosts(6)])
      .then(([current, all]) => {
        setArticle(current)
        setRelatedArticles(all.filter((item) => item.slug !== slug).slice(0, 3))
      })
      .catch(() => setArticle(findNewsArticle(slug)))
      .finally(() => setIsLoadingArticle(false))
  }, [slug])

  useEffect(() => {
    setPageSeo({
      title: article ? `${article.title} - iOrder` : 'Tin tức - iOrder',
      description: article?.excerpt ?? 'Tin tức và hướng dẫn vận hành iOrder cho nhà hàng, cafe, bán lẻ và chuỗi cửa hàng.'
    })
  }, [article])

  const { html: bodyHtml, toc } = useMemo(() => buildTableOfContents(article?.bodyHtml), [article?.bodyHtml])

  // Scroll-spy: làm nổi mục đang xem trong "Mục lục".
  useEffect(() => {
    if (toc.length === 0) return undefined
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActiveId(visible[0].target.id)
      },
      { rootMargin: '-90px 0px -70% 0px' },
    )
    toc.forEach((item) => {
      const el = document.getElementById(item.id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [toc, bodyHtml])

  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''
  const shareFacebook = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
  const shareTwitter = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(article?.title ?? '')}`

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch { /* clipboard không khả dụng */ }
  }

  if (isLoadingArticle && !article) return <main className="detail-not-found"><div className="container"><p>Đang tải bài viết...</p></div></main>

  if (!article) {
    return (
      <PageLayout mainClassName="detail-not-found">
        <div className="container">
          <h1>Không tìm thấy bài viết</h1>
          <Link to="/tin-tuc" className="btn primary">Quay lại tin tức</Link>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <section className="article-detail-section">
        <div className="container">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link to="/">Trang chủ</Link>
            <span>/</span>
            <Link to="/tin-tuc">Tin tức</Link>
            <span>/</span>
            <strong>{article.category}</strong>
          </nav>

          <div className="article-grid">
            <main className="article-main">
              <span className="news-card-badge">{article.category}</span>
              <h1 className="article-page-title">{article.title}</h1>
              {article.excerpt ? <p className="article-page-summary">{article.excerpt}</p> : null}

              <div className="article-meta-bar">
                <div className="article-meta-left">
                  <span><Calendar size={15} /> {new Date(article.date).toLocaleDateString('vi-VN')}</span>
                  <span><Clock size={15} /> {article.readingTime}</span>
                  <span><Eye size={15} /> {formatViews(article.viewCount)} lượt xem</span>
                  <span><Users size={15} /> Đội ngũ iOrder</span>
                </div>
                <div className="article-share">
                  <span className="article-share-label">Chia sẻ:</span>
                  <a href={shareFacebook} target="_blank" rel="noreferrer" aria-label="Chia sẻ Facebook"><IconFacebook /></a>
                  <a href={shareTwitter} target="_blank" rel="noreferrer" aria-label="Chia sẻ X"><IconX /></a>
                  <button type="button" onClick={copyLink} aria-label="Sao chép liên kết" title={copied ? 'Đã sao chép!' : 'Sao chép liên kết'}><Link2 size={16} /></button>
                </div>
              </div>

              {article.image ? (
                <div className="article-cover">
                  <SafeImage src={article.image} alt={article.imageAlt} loading="eager" decoding="sync" fetchPriority="high" />
                </div>
              ) : null}

              <div id="article-body">
                {bodyHtml ? (
                  <article className="article-rich" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
                ) : (
                  <article className="article-rich">
                    {article.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                  </article>
                )}

                {article.checklist?.length ? (
                  <div className="article-highlight-box">
                    <h2>Điểm chính</h2>
                    <div className="detail-list">
                      {article.checklist.map((item) => (
                        <div key={item} className="detail-list-item">
                          <CheckCircle size={20} />
                          <p>{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {article.tags?.length ? (
                  <div className="article-tags">
                    {article.tags.map((tag) => (
                      <span key={tag.id ?? tag.slug ?? tag} className="article-tag">#{tag.name ?? tag}</span>
                    ))}
                  </div>
                ) : null}
              </div>
            </main>

            <aside className="article-sidebar">
              <div className="sidebar-card summary-card">
                <h2 className="sidebar-card-title">Tóm tắt bài viết</h2>
                <div className="summary-thumb"><SafeImage src={article.image} alt={article.imageAlt} loading="lazy" /></div>
                <p className="summary-text">{article.excerpt}</p>
                <a className="summary-readmore" href="#article-body">Đọc tiếp <ArrowRight size={15} /></a>
              </div>

              {toc.length > 0 ? (
                <div className="sidebar-card toc-card">
                  <h2 className="sidebar-card-title">Mục lục</h2>
                  <ul className="toc-list">
                    {toc.map((item) => (
                      <li key={item.id} className={`toc-item level-${item.level}${activeId === item.id ? ' is-active' : ''}`}>
                        <a href={`#${item.id}`}>{item.text}</a>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {relatedArticles.length > 0 ? (
                <div className="sidebar-card related-card">
                  <h2 className="sidebar-card-title">Bài viết liên quan</h2>
                  <div className="sidebar-related-list">
                    {relatedArticles.map((item) => (
                      <Link to={`/tin-tuc/${item.slug}`} key={item.slug} className="sidebar-related-item">
                        <span className="sidebar-related-thumb">
                          <SafeImage src={item.image} alt={item.imageAlt} loading="lazy" />
                        </span>
                        <span className="sidebar-related-body">
                          <strong>{item.title}</strong>
                          <span className="sidebar-related-meta">
                            <span><Calendar size={12} /> {new Date(item.date).toLocaleDateString('vi-VN')}</span>
                            <span><Eye size={12} /> {formatViews(item.viewCount)} lượt xem</span>
                          </span>
                        </span>
                      </Link>
                    ))}
                  </div>
                  <Link to="/tin-tuc" className="summary-readmore">Xem tất cả bài viết <ArrowRight size={15} /></Link>
                </div>
              ) : null}

              <div className="sidebar-card cta-card">
                <h2 className="sidebar-card-title">Đăng ký dùng thử iOrder</h2>
                <p>Trải nghiệm đầy đủ tính năng miễn phí 7 ngày, không cần thẻ.</p>
                <Link to="/lien-he" className="cta-card-btn">Dùng thử miễn phí <ArrowRight size={16} /></Link>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </PageLayout>
  )
}
