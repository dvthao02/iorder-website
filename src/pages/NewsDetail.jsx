import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Calendar, CheckCircle, Clock, ExternalLink } from 'lucide-react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { findNewsArticle, newsArticles } from '../data/newsArticles'
import { setPageSeo } from '../utils/seo'

import logoMain from '../assets/header/logo.png'
import logoFooter from '../assets/header/logo.png'

export default function NewsDetail() {
  const { slug } = useParams()
  const [activeDropdown, setActiveDropdown] = useState(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const article = findNewsArticle(slug)
  const relatedArticles = newsArticles.filter((item) => item.slug !== slug).slice(0, 3)

  useEffect(() => {
    setPageSeo({
      title: article ? `${article.title} - iOrder` : 'Tin tức - iOrder',
      description: article?.excerpt ?? 'Tin tức và hướng dẫn vận hành iOrder cho nhà hàng, cafe, bán lẻ và chuỗi cửa hàng.'
    })
    setActiveDropdown(null)
    setMobileOpen(false)
  }, [article, location.pathname])

  if (!article) {
    return (
      <div className="page-shell">
        <Header
          activeDropdown={activeDropdown}
          setActiveDropdown={setActiveDropdown}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
          location={location}
          logoMain={logoMain}
          softwareProducts={[]}
          solutionPages={[]}
          servicePages={[]}
        />
        <main className="detail-not-found">
          <div className="container">
            <h1>Không tìm thấy bài viết</h1>
            <Link to="/tin-tuc" className="btn primary">Quay lại tin tức</Link>
          </div>
        </main>
        <Footer logoFooter={logoFooter} />
      </div>
    )
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
        softwareProducts={[]}
        solutionPages={[]}
        servicePages={[]}
      />

      <main>
        <section className="detail-hero article-hero">
          <div className="container article-hero-grid">
            <div>
              <nav className="breadcrumb" aria-label="Breadcrumb">
                <Link to="/">Trang chủ</Link>
                <span>/</span>
                <Link to="/tin-tuc">Tin tức</Link>
                <span>/</span>
                <strong>{article.category}</strong>
              </nav>
              <Link to="/tin-tuc" className="detail-back-link">
                <ArrowLeft size={20} />
                Quay lại tin tức
              </Link>
              <span className="news-card-badge">{article.category}</span>
              <h1 className="detail-title">{article.title}</h1>
              <p className="detail-summary">{article.excerpt}</p>
              <div className="article-meta-row">
                <span><Calendar size={15} /> {new Date(article.date).toLocaleDateString('vi-VN')}</span>
                <span><Clock size={15} /> {article.readingTime}</span>
              </div>
            </div>

            <aside className="article-source-card">
              <div className="article-source-image">
                <img
                  src={article.image}
                  alt={article.imageAlt}
                  loading="eager"
                  decoding="sync"
                  fetchPriority="high"
                />
              </div>
              <span>Trọng tâm iOrder</span>
              <h2>{article.focusName}</h2>
              <p>Bài viết tập trung vào cách iOrder hỗ trợ vận hành thực tế tại cửa hàng, từ thao tác nhân viên đến dữ liệu quản lý.</p>
              {article.sourceUrl ? (
                <a href={article.sourceUrl} target="_blank" rel="noreferrer">
                  Xem bài iOrder gốc <ExternalLink size={16} />
                </a>
              ) : null}
            </aside>
          </div>
        </section>

        <section className="detail-section">
          <div className="container article-layout">
            <article className="article-content">
              {article.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </article>

            <aside className="detail-card article-checklist">
              <h2>Checklist nhanh</h2>
              <div className="detail-list">
                {article.checklist.map((item) => (
                  <div key={item} className="detail-list-item">
                    <CheckCircle size={22} />
                    <p>{item}</p>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </section>

        <section className="article-inline-cta">
          <div className="container article-inline-cta-box">
            <div>
              <h2>Muốn áp dụng nội dung này vào cửa hàng của bạn?</h2>
              <p>Gửi mô hình kinh doanh, số chi nhánh và nhu cầu hiện tại để iOrder tư vấn cấu hình phù hợp.</p>
            </div>
            <Link to="/lien-he" className="btn primary">
              Liên hệ tư vấn <ArrowRight size={16} />
            </Link>
          </div>
        </section>

        <section className="detail-section related-news-section">
          <div className="container">
            <div className="section-title">
              <h2>Bài viết liên quan</h2>
            </div>
            <div className="listing-grid news">
              {relatedArticles.map((item) => (
                <Link to={`/tin-tuc/${item.slug}`} key={item.slug} className="listing-card-link">
                  <article className="listing-card news-listing-card">
                    <div className="news-card-image">
                      <img src={item.image} alt={item.imageAlt} loading="lazy" decoding="async" />
                    </div>
                    <span className="news-card-badge">{item.category}</span>
                    <h3 className="listing-card-title">{item.title}</h3>
                    <p className="listing-card-desc">{item.excerpt}</p>
                    <div className="listing-card-action">
                      Đọc tiếp <ArrowRight size={16} />
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer logoFooter={logoFooter} />
    </div>
  )
}
