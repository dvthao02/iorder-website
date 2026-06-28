import type { MediaAsset, PostInput, PostResponse } from '@iorder/contracts'
import { Calendar, ChevronDown, ChevronRight, Eye, FileText, Image as ImageIcon, MoreVertical, Plus, Search, Send, SlidersHorizontal, Trash2, Upload } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { archivePost, createPost, listMedia, listPosts, publishPost, updatePost } from './api'
import { RichTextEditor } from './RichTextEditor'
import { EditorFooter, ImagePicker, PageHeader, StatusDot } from './ui'

const POST_STATUS: Record<string, { label: string; tone: 'on' | 'muted' | 'danger' }> = {
  published: { label: 'Đã đăng', tone: 'on' },
  draft: { label: 'Bản nháp', tone: 'muted' },
  archived: { label: 'Đã ẩn', tone: 'danger' },
}

type PostFilter = 'all' | 'news' | 'promotion' | 'draft'
const PAGE_SIZE = 6

const emptyPost: PostInput = {
  type: 'news',
  title: '',
  slug: '',
  excerpt: null,
  body: '',
  category: null,
  checklist: [],
  coverMediaId: null,
  seoTitle: null,
  seoDescription: null,
  canonicalUrl: null,
  promotionStartAt: null,
  promotionEndAt: null,
  ctaLabel: null,
  ctaUrl: null,
  badgeText: null,
}

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function toInput(post: PostResponse): PostInput {
  return {
    type: post.type,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    body: post.body,
    category: post.category,
    checklist: post.checklist,
    coverMediaId: post.coverMediaId,
    seoTitle: post.seoTitle,
    seoDescription: post.seoDescription,
    canonicalUrl: post.canonicalUrl,
    promotionStartAt: post.promotionStartAt ? new Date(post.promotionStartAt) : null,
    promotionEndAt: post.promotionEndAt ? new Date(post.promotionEndAt) : null,
    ctaLabel: post.ctaLabel,
    ctaUrl: post.ctaUrl,
    badgeText: post.badgeText,
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatViews(count: number) {
  if (count >= 1000) return `${(count / 1000).toFixed(count >= 10000 ? 0 : 1)}K`
  return String(count)
}

export function PostsManager() {
  const [posts, setPosts] = useState<PostResponse[]>([])
  const [images, setImages] = useState<MediaAsset[]>([])

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<PostInput>(emptyPost)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<PostFilter>('all')
  const [showArchived, setShowArchived] = useState(false)
  const [page, setPage] = useState(1)

  const [menuId, setMenuId] = useState<string | null>(null)
  const [publishMenu, setPublishMenu] = useState(false)
  const [showCoverPicker, setShowCoverPicker] = useState(false)
  const didInit = useRef(false)

  const loadData = async () => {
    const [postResult, mediaResult] = await Promise.all([listPosts(), listMedia('image')])
    setPosts(postResult.items)
    setImages(mediaResult.items)
    return postResult.items
  }

  useEffect(() => {
    void loadData()
      .then((items) => {
        const first = items[0]
        if (!didInit.current && first) {
          didInit.current = true
          selectPost(first)
        }
      })
      .catch(() => setMessage('Không thể tải danh sách bài viết.'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const patchForm = <Key extends keyof PostInput>(key: Key, value: PostInput[Key]) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function selectPost(post: PostResponse) {
    setSelectedId(post.id)
    setCreating(false)
    setForm(toInput(post))
    setMessage('')
    setShowCoverPicker(false)
  }

  const newPost = () => {
    setSelectedId(null)
    setCreating(true)
    setForm(emptyPost)
    setMessage('')
    setShowCoverPicker(false)
  }

  const savePost = async () => {
    setIsSaving(true)
    setMessage('')
    try {
      const result = selectedId ? await updatePost(selectedId, form) : await createPost(form)
      setSelectedId(result.item.id)
      setCreating(false)
      setForm(toInput(result.item))
      await loadData()
      setMessage('Đã lưu bản nháp.')
    } catch (error) {
      const code = error instanceof Error ? error.message : ''
      setMessage(code === 'SLUG_EXISTS' ? 'Đường dẫn đã tồn tại.' : 'Không thể lưu bài viết.')
    } finally {
      setIsSaving(false)
    }
  }

  const publish = async () => {
    setIsSaving(true)
    setMessage('')
    try {
      const saved = selectedId ? await updatePost(selectedId, form) : await createPost(form)
      setSelectedId(saved.item.id)
      const result = await publishPost(saved.item.id)
      setCreating(false)
      setForm(toInput(result.item))
      await loadData()
      setMessage('Đã xuất bản bài viết.')
    } catch (error) {
      const code = error instanceof Error ? error.message : ''
      setMessage(code === 'SLUG_EXISTS' ? 'Đường dẫn đã tồn tại.' : 'Không thể xuất bản.')
    } finally {
      setIsSaving(false)
    }
  }

  const archive = async (id: string) => {
    try {
      const result = await archivePost(id)
      if (id === selectedId) setForm(toInput(result.item))
      await loadData()
      setMessage('Bài viết đã được ẩn.')
    } catch {
      setMessage('Không thể ẩn bài viết.')
    }
  }

  const quickPublish = async (id: string) => {
    try {
      const result = await publishPost(id)
      if (id === selectedId) setForm(toInput(result.item))
      await loadData()
    } catch {
      setMessage('Không thể xuất bản bài viết.')
    }
  }

  const previewPost = (slug: string) => {
    if (slug) window.open(`/tin-tuc/${slug}`, '_blank', 'noopener')
  }

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return posts.filter((post) => {
      if (!showArchived && filter !== 'draft' && post.status === 'archived') return false
      if (filter === 'news' && post.type !== 'news') return false
      if (filter === 'promotion' && post.type !== 'promotion') return false
      if (filter === 'draft' && post.status !== 'draft') return false
      if (query && !post.title.toLowerCase().includes(query) && !post.slug.toLowerCase().includes(query)) return false
      return true
    })
  }, [posts, search, filter, showArchived])

  useEffect(() => { setPage(1) }, [search, filter, showArchived])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const rangeStart = filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, filtered.length)

  const editingStatus = posts.find((post) => post.id === selectedId)?.status
  const coverUrl = images.find((image) => image.id === form.coverMediaId)?.publicUrl ?? null
  const hasEditor = creating || selectedId !== null

  const FILTERS: Array<{ key: PostFilter; label: string }> = [
    { key: 'all', label: 'Tất cả' },
    { key: 'news', label: 'Tin tức' },
    { key: 'promotion', label: 'Khuyến mãi' },
    { key: 'draft', label: 'Nháp' },
  ]

  return (
    <section className="admin-card content-manager">
      <PageHeader
        title="Bài viết"
        description="Tạo tin tức hoặc bài khuyến mãi, lưu nháp rồi xuất bản."
        actions={<button className="btn-primary btn-icon" type="button" onClick={newPost}><Plus size={16} /> Bài viết mới</button>}
      />

      <div className="post-layout">
        <aside className="post-panel">
          <div className="post-search-row">
            <span className="post-search">
              <Search size={16} aria-hidden="true" />
              <input type="search" placeholder="Tìm bài viết…" value={search} onChange={(event) => setSearch(event.target.value)} />
            </span>
            <button type="button" className={`post-filter-toggle${showArchived ? ' is-active' : ''}`} title={showArchived ? 'Đang hiện cả bài đã ẩn' : 'Hiện cả bài đã ẩn'} onClick={() => setShowArchived((v) => !v)}>
              <SlidersHorizontal size={16} />
            </button>
          </div>

          <div className="post-pills">
            {FILTERS.map((item) => (
              <button key={item.key} type="button" className={`post-pill${filter === item.key ? ' is-active' : ''}`} onClick={() => setFilter(item.key)}>{item.label}</button>
            ))}
          </div>

          <div className="post-cards">
            {pageItems.length === 0 ? <p className="post-empty">Không có bài viết nào.</p> : null}
            {pageItems.map((post) => {
              const status = POST_STATUS[post.status] ?? { label: post.status, tone: 'muted' as const }
              const active = post.id === selectedId
              return (
                <div className={`post-card${active ? ' is-active' : ''}`} key={post.id}>
                  <button type="button" className="post-card-main" onClick={() => selectPost(post)}>
                    <span className="post-card-thumb">
                      {post.coverUrl ? <img src={post.coverUrl} alt="" /> : <ImageIcon size={20} aria-hidden="true" />}
                    </span>
                    <span className="post-card-body">
                      <strong>{post.title}</strong>
                      <span className="post-card-badges">
                        <span className={`kind-badge ${post.type === 'promotion' ? 'kind-customer' : 'kind-partner'}`}>{post.type === 'promotion' ? 'Khuyến mãi' : 'Tin tức'}</span>
                        <span className="post-card-status"><StatusDot tone={status.tone} />{status.label}</span>
                      </span>
                      <span className="post-card-meta"><Calendar size={13} aria-hidden="true" />{formatDate(post.publishedAt ?? post.updatedAt)}<span className="post-card-views"><Eye size={13} aria-hidden="true" />{formatViews(post.viewCount)} lượt xem</span></span>
                    </span>
                  </button>
                  {active ? (
                    <span className="post-card-arrow" aria-hidden="true"><ChevronRight size={18} /></span>
                  ) : (
                    <div className="post-card-menu-wrap">
                      <button type="button" className="post-card-kebab" aria-label="Thao tác" onClick={() => setMenuId(menuId === post.id ? null : post.id)}><MoreVertical size={16} /></button>
                      {menuId === post.id ? (
                        <>
                          <div className="menu-backdrop" onClick={() => setMenuId(null)} />
                          <div className="card-menu" role="menu">
                            <button type="button" role="menuitem" onClick={() => { setMenuId(null); selectPost(post) }}>Sửa</button>
                            <button type="button" role="menuitem" onClick={() => { setMenuId(null); previewPost(post.slug) }}>Xem trước</button>
                            {post.status === 'published'
                              ? <button type="button" role="menuitem" onClick={() => { setMenuId(null); void archive(post.id) }}>Ẩn bài</button>
                              : <button type="button" role="menuitem" onClick={() => { setMenuId(null); void quickPublish(post.id) }}>Xuất bản</button>}
                          </div>
                        </>
                      ) : null}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="post-pagination">
            <span>Hiển thị {rangeStart} – {rangeEnd} của {filtered.length} bài viết</span>
            <div className="post-pages">
              {Array.from({ length: pageCount }, (_, index) => index + 1).map((p) => (
                <button key={p} type="button" className={`post-page${p === currentPage ? ' is-active' : ''}`} onClick={() => setPage(p)}>{p}</button>
              ))}
              <button type="button" className="post-page" disabled={currentPage >= pageCount} onClick={() => setPage((p) => Math.min(pageCount, p + 1))} aria-label="Trang sau">›</button>
            </div>
          </div>
        </aside>

        <div className="post-editor-pane">
          {!hasEditor ? (
            <div className="editor-placeholder">Chọn một bài viết bên trái hoặc bấm "Bài viết mới" để bắt đầu.</div>
          ) : (
            <>
              <h2 className="section-label">Thông tin cơ bản</h2>
              <div className="form-row">
                <label>
                  Loại bài
                  <select value={form.type} onChange={(event) => patchForm('type', event.target.value as PostInput['type'])}>
                    <option value="news">Tin tức</option>
                    <option value="promotion">Khuyến mãi</option>
                  </select>
                </label>
                <div className="form-field">
                  <span className="field-label">Ảnh bìa</span>
                  <div className="cover-control">
                    <span className="cover-thumb">
                      {coverUrl ? <img src={coverUrl} alt="Ảnh bìa" /> : <ImageIcon size={20} aria-hidden="true" />}
                    </span>
                    <button type="button" className="secondary-button btn-icon" onClick={() => setShowCoverPicker((v) => !v)}><Upload size={15} /> Thay đổi ảnh</button>
                    {form.coverMediaId ? <button type="button" className="cover-remove" title="Bỏ ảnh bìa" onClick={() => patchForm('coverMediaId', null)}><Trash2 size={16} /></button> : null}
                  </div>
                </div>
              </div>

              {showCoverPicker ? (
                <ImagePicker
                  label="Chọn ảnh bìa"
                  ariaLabel="Chọn ảnh bìa"
                  images={images}
                  value={form.coverMediaId}
                  onChange={(id) => patchForm('coverMediaId', id)}
                  onUploaded={(asset) => setImages((prev) => [asset, ...prev])}
                />
              ) : null}

              <label className="full-field">
                Tiêu đề
                <input required maxLength={220} placeholder="Nhập tiêu đề bài viết" value={form.title} onChange={(event) => {
                  const title = event.target.value
                  setForm((currentForm) => ({ ...currentForm, title, ...(creating ? { slug: slugify(title) } : {}) }))
                }} />
              </label>

              <div className="form-row">
                <label>
                  Đường dẫn
                  <input required maxLength={180} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={form.slug} onChange={(event) => patchForm('slug', slugify(event.target.value))} />
                </label>
                <label>
                  Chủ đề
                  <input maxLength={120} placeholder="Ví dụ: Nhà hàng - Cafe" value={form.category ?? ''} onChange={(event) => patchForm('category', event.target.value || null)} />
                </label>
              </div>

              <label className="full-field">
                Tóm tắt
                <textarea maxLength={600} rows={3} value={form.excerpt ?? ''} onChange={(event) => patchForm('excerpt', event.target.value || null)} />
                <span className="char-counter">{(form.excerpt ?? '').length}/600</span>
              </label>

              <h2 className="section-label">Nội dung bài viết</h2>
              <RichTextEditor value={form.body} placeholder="Soạn nội dung bài viết..." onChange={(html) => patchForm('body', html)} />

              <details className="advanced-section">
                <summary>Tùy chọn nâng cao (Checklist, SEO)</summary>
                <div className="advanced-body">
                  <label className="full-field">
                    Checklist / điểm nổi bật (mỗi dòng một mục)
                    <textarea rows={4} value={form.checklist.join('\n')} onChange={(event) => patchForm('checklist', event.target.value.split('\n').map((item) => item.trim()).filter(Boolean))} />
                  </label>
                  <div className="form-row">
                    <label>
                      SEO title
                      <input maxLength={70} value={form.seoTitle ?? ''} onChange={(event) => patchForm('seoTitle', event.target.value || null)} />
                    </label>
                    <label>
                      SEO description
                      <input maxLength={180} value={form.seoDescription ?? ''} onChange={(event) => patchForm('seoDescription', event.target.value || null)} />
                    </label>
                  </div>
                </div>
              </details>
            </>
          )}
        </div>
      </div>

      {hasEditor ? (
        <EditorFooter>
          {message ? <span className="editor-status">{message}</span> : null}
          <button type="button" className="secondary-button btn-icon" disabled={isSaving} onClick={() => void savePost()}><FileText size={15} /> Lưu nháp</button>
          <button type="button" className="secondary-button btn-icon" onClick={() => previewPost(form.slug)}><Eye size={15} /> Xem trước</button>
          <div className="split-button">
            <button type="button" className="btn-primary btn-icon split-main" disabled={isSaving || !form.title || !form.slug || !form.body} onClick={() => void publish()}><Send size={15} /> {isSaving ? 'Đang xử lý…' : 'Xuất bản'}</button>
            <button type="button" className="btn-primary split-caret" aria-label="Thêm tùy chọn" onClick={() => setPublishMenu((v) => !v)}><ChevronDown size={15} /></button>
            {publishMenu ? (
              <>
                <div className="menu-backdrop" onClick={() => setPublishMenu(false)} />
                <div className="card-menu align-right align-up" role="menu">
                  {editingStatus === 'published' && selectedId ? <button type="button" role="menuitem" onClick={() => { setPublishMenu(false); void archive(selectedId) }}>Ẩn bài</button> : null}
                  <button type="button" role="menuitem" onClick={() => { setPublishMenu(false); previewPost(form.slug) }}>Mở trên web</button>
                </div>
              </>
            ) : null}
          </div>
        </EditorFooter>
      ) : null}
    </section>
  )
}
