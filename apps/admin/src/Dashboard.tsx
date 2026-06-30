import type { PostResponse } from '@iorder/contracts'
import { ArrowUpRight, Boxes, ExternalLink, FileText, Image as ImageIcon, MessageSquareQuote, Plus, Star, Users } from 'lucide-react'
import { useEffect, useState } from 'react'

import { getHomepage, listMedia, listOfferings, listPartners, listPosts, listTestimonials } from './api'
import { PageHeader } from './ui'

const PUBLIC_SITE_URL = import.meta.env.VITE_PUBLIC_SITE_URL ?? 'http://127.0.0.1:5173/'

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  published: { label: 'Đã xuất bản', cls: 'status-published' },
  draft: { label: 'Nháp', cls: 'status-draft' },
  archived: { label: 'Đã ẩn', cls: 'status-archived' },
}

const TYPE_LABEL: Record<string, string> = { news: 'Tin tức', promotion: 'Khuyến mãi' }

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function Dashboard({ onOpen }: { onOpen: (module: string) => void }) {
  const [posts, setPosts] = useState<PostResponse[]>([])
  const [counts, setCounts] = useState({ posts: 0, published: 0, drafts: 0, media: 0, partners: 0, testimonials: 0, offerings: 0, publishedOfferings: 0, hiddenSections: 0, missingAlt: 0, missingSeo: 0, expiringPromotions: 0 })
  const [homepageStatus, setHomepageStatus] = useState('—')

  useEffect(() => {
    Promise.all([listPosts(), listMedia(), listPartners(), listTestimonials(), getHomepage(), listOfferings()])
      .then(([postRes, media, partners, testimonials, homepage, offerings]) => {
        const items = postRes.items
        const soon = Date.now() + 14 * 24 * 60 * 60 * 1000
        setPosts(items)
        setCounts({
          posts: postRes.total,
          published: items.filter((p) => p.status === 'published').length,
          drafts: items.filter((p) => p.status === 'draft').length,
          media: media.total,
          partners: partners.total,
          testimonials: testimonials.total,
          offerings: offerings.total,
          publishedOfferings: offerings.items.filter((o) => o.status === 'published').length,
          hiddenSections: homepage.item?.blocks.filter((block) => !block.isEnabled).length ?? 0,
          missingAlt: media.items.filter((asset) => asset.mimeType.startsWith('image/') && !asset.altText?.trim()).length,
          missingSeo: items.filter((post) => !post.seoTitle?.trim() || !post.seoDescription?.trim()).length,
          expiringPromotions: items.filter((post) => post.type === 'promotion' && post.promotionEndAt && new Date(post.promotionEndAt).getTime() <= soon && new Date(post.promotionEndAt).getTime() >= Date.now()).length,
        })
        setHomepageStatus(homepage.item?.status ?? 'draft')
      })
      .catch(() => undefined)
  }, [])

  const statCards = [
    { key: 'posts', icon: FileText, tone: 'blue', label: 'Bài viết', value: counts.posts, note: `${counts.published} bài đã xuất bản`, module: 'posts' },
    { key: 'offerings', icon: Boxes, tone: 'teal', label: 'Phần mềm & Giải pháp', value: counts.offerings, note: `${counts.publishedOfferings} đang hiển thị`, module: 'offerings' },
    { key: 'partners', icon: Users, tone: 'amber', label: 'Đối tác', value: counts.partners, note: 'Logo trên trang chủ', module: 'partners' },
    { key: 'media', icon: ImageIcon, tone: 'violet', label: 'Thư viện', value: counts.media, note: 'Ảnh và tài liệu', module: 'media' },
  ] as const

  const recent = posts.slice(0, 6)

  const todos: { icon: typeof FileText; text: string; module: string }[] = []
  if (counts.drafts > 0) todos.push({ icon: FileText, text: `${counts.drafts} bài viết đang lưu nháp`, module: 'posts' })
  if (counts.partners === 0) todos.push({ icon: Users, text: 'Chưa có đối tác nào — thêm logo đối tác', module: 'partners' })
  if (counts.testimonials === 0) todos.push({ icon: MessageSquareQuote, text: 'Chưa có đánh giá khách hàng', module: 'testimonials' })
  if (homepageStatus !== 'published') todos.push({ icon: Star, text: 'Trang chủ chưa được xuất bản', module: 'homepage' })
  if (counts.hiddenSections > 0) todos.push({ icon: Star, text: `${counts.hiddenSections} section trang chủ đang ẩn`, module: 'homepage' })
  if (counts.missingAlt > 0) todos.push({ icon: ImageIcon, text: `${counts.missingAlt} ảnh chưa có alt text`, module: 'media' })
  if (counts.missingSeo > 0) todos.push({ icon: FileText, text: `${counts.missingSeo} bài viết thiếu thông tin SEO`, module: 'posts' })
  if (counts.expiringPromotions > 0) todos.push({ icon: FileText, text: `${counts.expiringPromotions} khuyến mãi sắp hết hạn`, module: 'posts' })
  if (todos.length === 0) todos.push({ icon: Star, text: 'Mọi thứ đã sẵn sàng 🎉', module: 'dashboard' })

  return (
    <section className="dashboard-page">
      <PageHeader
        title="Tổng quan CMS iOrder"
        description="Theo dõi nội dung và tình trạng website một cách trực quan."
        actions={<div className="dash-actions">
          <a className="secondary-button" href={PUBLIC_SITE_URL} target="_blank" rel="noreferrer">Xem website <ExternalLink size={16} /></a>
          <button className="primary-cta" type="button" onClick={() => onOpen('posts')}><Plus size={18} /> Tạo bài viết</button>
        </div>}
      />

      <div className="metric-grid">
        {statCards.map((card) => (
          <button key={card.key} type="button" className={`metric-card tone-${card.tone}`} onClick={() => onOpen(card.module)}>
            <span className="metric-icon"><card.icon size={22} /></span>
            <span className="metric-body">
              <span className="metric-label">{card.label}</span>
              <strong className="metric-value">{card.value}</strong>
              <small className="metric-note">{card.note}</small>
            </span>
          </button>
        ))}
      </div>

      <div className="content-health-strip" aria-label="Sức khỏe nội dung">
        <div><span>Section đang ẩn</span><strong>{counts.hiddenSections}</strong></div>
        <div><span>Ảnh thiếu alt</span><strong>{counts.missingAlt}</strong></div>
        <div><span>Bài thiếu SEO</span><strong>{counts.missingSeo}</strong></div>
        <div><span>Khuyến mãi sắp hết hạn</span><strong>{counts.expiringPromotions}</strong></div>
      </div>

      <div className="dash-columns">
        <div className="dash-panel">
          <div className="dash-panel-head">
            <h2>Bài viết gần đây</h2>
            <button className="text-button" type="button" onClick={() => onOpen('posts')}>Xem tất cả <ArrowUpRight size={15} /></button>
          </div>
          {recent.length === 0 ? <p className="dash-empty">Chưa có bài viết nào.</p> : (
            <table className="dash-table">
              <thead><tr><th>Tiêu đề</th><th>Loại</th><th>Trạng thái</th><th>Cập nhật</th></tr></thead>
              <tbody>
                {recent.map((post) => (
                  <tr key={post.id} onClick={() => onOpen('posts')}>
                    <td className="dash-title-cell">{post.title}</td>
                    <td>{TYPE_LABEL[post.type] ?? post.type}</td>
                    <td><span className={`status-pill ${STATUS_BADGE[post.status]?.cls ?? ''}`}>{STATUS_BADGE[post.status]?.label ?? post.status}</span></td>
                    <td className="dash-date-cell">{formatDate(post.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="dash-panel">
          <div className="dash-panel-head"><h2>Việc cần làm</h2></div>
          <ul className="todo-list">
            {todos.map((todo, idx) => (
              <li key={idx}>
                <button type="button" onClick={() => onOpen(todo.module)}>
                  <span className="todo-icon"><todo.icon size={17} /></span>
                  <span>{todo.text}</span>
                  <ArrowUpRight size={16} className="todo-arrow" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
