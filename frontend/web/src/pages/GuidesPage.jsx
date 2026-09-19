import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, Clock, Search, SlidersHorizontal } from 'lucide-react'

import PageLayout from '../components/PageLayout'
import SafeImage from '../components/SafeImage'
import { fetchPublishedPosts } from '../utils/contentApi'
import { setPageSeo } from '../utils/seo'

function categoryName(guide) {
  return guide.categories?.[0]?.name ?? guide.category ?? 'Hướng dẫn iOrder'
}

export default function GuidesPage() {
  const [guides, setGuides] = useState([])
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('Tất cả')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchPublishedPosts(100, null, 'guide')
      .then(setGuides)
      .catch(() => setGuides([]))
      .finally(() => setIsLoading(false))
  }, [])

  useEffect(() => {
    setPageSeo({
      title: 'Hướng dẫn sử dụng iOrder',
      description: 'Tài liệu hướng dẫn thiết lập, bán hàng, kho, hóa đơn điện tử và vận hành iOrder.',
    })
  }, [])

  const categories = useMemo(() => {
    const names = guides.map(categoryName)
    return ['Tất cả', ...new Set(names)]
  }, [guides])

  const filteredGuides = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('vi-VN')
    return guides.filter((guide) => {
      const inCategory = activeCategory === 'Tất cả' || categoryName(guide) === activeCategory
      const searchable = `${guide.title} ${guide.excerpt ?? ''} ${categoryName(guide)}`.toLocaleLowerCase('vi-VN')
      return inCategory && (!normalizedQuery || searchable.includes(normalizedQuery))
    })
  }, [guides, query, activeCategory])

  return (
    <PageLayout mainClassName="guides-page">
      <section className="guides-hero">
        <div className="container guides-hero-inner">
          <div className="guides-hero-copy">
            <span className="guides-kicker">
              <BookOpen size={16} /> Trung tâm trợ giúp
            </span>
            <h1>Hướng dẫn sử dụng iOrder</h1>
            <p>
              Tìm hướng dẫn theo đúng việc bạn đang cần làm: chuẩn bị cửa hàng, bán hàng, kho, hóa đơn và vận hành
              mỗi ngày.
            </p>
          </div>
          <label className="guides-search">
            <Search size={19} aria-hidden="true" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm theo thao tác hoặc tính năng..."
              type="search"
            />
          </label>
        </div>
      </section>

      <section className="guides-library-section">
        <div className="container">
          <div className="guides-library-head">
            <div>
              <span className="guides-library-label">
                <SlidersHorizontal size={15} /> Thư viện tài liệu
              </span>
              <h2>Hướng dẫn theo từng nghiệp vụ</h2>
            </div>
            <p>{guides.length} tài liệu đã xuất bản</p>
          </div>

          <div className="guides-category-tabs" aria-label="Lọc hướng dẫn theo chuyên mục">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                className={activeCategory === category ? 'is-active' : ''}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>

          {isLoading ? <p className="guides-state">Đang tải tài liệu...</p> : null}
          {!isLoading && filteredGuides.length === 0 ? (
            <div className="guides-empty">
              <BookOpen size={28} aria-hidden="true" />
              <h2>{guides.length === 0 ? 'Tài liệu đang được cập nhật' : 'Chưa tìm thấy hướng dẫn phù hợp'}</h2>
              <p>
                {guides.length === 0
                  ? 'Quản trị viên có thể tạo tài liệu đầu tiên trong CMS tại mục “Hướng dẫn sử dụng”.'
                  : 'Hãy thử từ khóa khác hoặc chọn lại chuyên mục.'}
              </p>
            </div>
          ) : null}

          {filteredGuides.length > 0 ? (
            <div className="guides-grid">
              {filteredGuides.map((guide) => (
                <Link to={`/huong-dan/${guide.slug}`} key={guide.id} className="guide-card">
                  <div className="guide-card-media">
                    {guide.image ? (
                      <SafeImage src={guide.image} alt={guide.imageAlt} loading="lazy" decoding="async" />
                    ) : (
                      <span className="guide-card-placeholder">
                        <BookOpen size={27} />
                      </span>
                    )}
                  </div>
                  <div className="guide-card-body">
                    <span className="guide-card-category">{categoryName(guide)}</span>
                    <h2>{guide.title}</h2>
                    {guide.excerpt ? <p>{guide.excerpt}</p> : null}
                    <span className="guide-card-meta">
                      <Clock size={14} /> {guide.readingTime}
                      <b>
                        Đọc hướng dẫn <ArrowRight size={15} />
                      </b>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </section>
    </PageLayout>
  )
}
