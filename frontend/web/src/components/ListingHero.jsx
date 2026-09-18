import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'

// Khung mở đầu dùng cho các trang danh mục: cùng breadcrumb và typography,
// còn mỗi nhóm nội dung vẫn có thể truyền stats hoặc panel vận hành riêng.
export default function ListingHero({ crumb, kicker, title, lead, children, aside, className = '' }) {
  const copy = (
    <div className="listing-hero-copy">
      {kicker ? <span className="listing-kicker">{kicker}</span> : null}
      <h1 className="listing-hero-title">{title}</h1>
      <p className="listing-hero-lead">{lead}</p>
      {children}
    </div>
  )

  return (
    <section className={`listing-hero ${className}`.trim()}>
      <div className="container">
        <nav className="listing-breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Trang chủ</Link>
          <ChevronRight size={15} aria-hidden="true" />
          <strong>{crumb}</strong>
        </nav>

        {aside ? (
          <div className="listing-hero-grid">
            {copy}
            {aside}
          </div>
        ) : (
          copy
        )}
      </div>
    </section>
  )
}
