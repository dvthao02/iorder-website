import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowRight, Calendar, Clock, Newspaper, Search, Sparkles } from 'lucide-react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { newsArticles } from '../data/newsArticles'
import { setPageSeo } from '../utils/seo'

import logoMain from '../assets/header/logo.png'
import logoFooter from '../assets/header/logo.png'

const softwareProducts = []
const solutionPages = []
const servicePages = []

export default function NewsPage() {
  const [activeDropdown, setActiveDropdown] = useState(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState('Tất cả')
  const location = useLocation()

  const categories = useMemo(
    () => ['Tất cả', ...new Set(newsArticles.map((article) => article.category))],
    []
  )

  const filteredArticles = activeCategory === 'Tất cả'
    ? newsArticles
    : newsArticles.filter((article) => article.category === activeCategory)

  const featuredArticle = newsArticles[0]
  const secondaryArticles = newsArticles.slice(1, 3)

  useEffect(() => {
    setPageSeo({
      title: 'Tin tức iOrder - Phần mềm quản lý bán hàng',
      description: 'Bài viết và hướng dẫn sử dụng iOrder cho order tại bàn, POS bán hàng, quản lý kho, báo cáo doanh thu và triển khai cửa hàng.'
    })
    setActiveDropdown(null)
    setMobileOpen(false)
  }, [location.pathname])

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
        solutionPages={solutionPages}
        servicePages={servicePages}
      />

      <main>
        <section className="listing-hero news-hero">
          <div className="container news-hero-grid">
            <div>
              <span className="listing-kicker">
                <Newspaper size={16} />
                Blog iOrder
              </span>
              <h1 className="listing-hero-title">Bài viết nổi bật về iOrder</h1>
              <p className="listing-hero-lead">
                Cập nhật các hướng dẫn và góc nhìn vận hành xoay quanh iOrder: bán hàng tại quầy, quản lý kho, nhà hàng - cafe, báo cáo doanh thu và triển khai cửa hàng mới.
              </p>
              <div className="news-hero-tools">
                <span><Search size={16} /> POS, kho, F&B, báo cáo</span>
                <span><Sparkles size={16} /> Nội dung tư vấn triển khai iOrder</span>
              </div>
            </div>

            <Link to={`/tin-tuc/${featuredArticle.slug}`} className="news-feature-card">
              <div className="news-feature-image">
                <img src={featuredArticle.image} alt={featuredArticle.imageAlt} />
              </div>
              <span className="news-card-badge">{featuredArticle.category}</span>
              <h2>{featuredArticle.title}</h2>
              <p>{featuredArticle.excerpt}</p>
              <div className="news-card-meta">
                <span><Clock size={14} /> {featuredArticle.readingTime}</span>
                <ArrowRight size={18} />
              </div>
            </Link>
          </div>
        </section>

        <section className="listing-section news-highlight-section">
          <div className="container">
            <div className="news-split-grid">
              {secondaryArticles.map((article) => (
                <Link to={`/tin-tuc/${article.slug}`} key={article.id} className="news-insight-card">
                  <div className="news-insight-image">
                    <img src={article.image} alt={article.imageAlt} />
                  </div>
                  <span>{article.focusName}</span>
                  <h3>{article.title}</h3>
                  <p>{article.excerpt}</p>
                  <div>
                    {article.highlights.map((item) => (
                      <b key={item}>{item}</b>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="listing-section">
          <div className="container">
            <div className="category-tabs" aria-label="Lọc bài viết theo chủ đề">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  className={category === activeCategory ? 'active' : ''}
                  onClick={() => setActiveCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>

            <div className="listing-grid news">
              {filteredArticles.map((article) => (
                <Link to={`/tin-tuc/${article.slug}`} key={article.id} className="listing-card-link">
                  <article className="listing-card news-listing-card">
                    <div className="news-card-image">
                      <img src={article.image} alt={article.imageAlt} />
                    </div>
                    <div>
                      <span className="news-card-badge">{article.category}</span>
                    </div>
                    <h3 className="listing-card-title">{article.title}</h3>
                    <p className="listing-card-desc">{article.excerpt}</p>
                    <div className="news-chip-row">
                      {article.highlights.slice(0, 3).map((item) => (
                        <span key={item}>{item}</span>
                      ))}
                    </div>
                    <div className="news-card-meta">
                      <div className="news-card-meta-left">
                        <Calendar size={14} />
                        {new Date(article.date).toLocaleDateString('vi-VN')}
                      </div>
                      <div className="news-card-meta-left">
                        <Clock size={14} />
                        {article.readingTime}
                      </div>
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
