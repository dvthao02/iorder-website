import type { CategoryResponse, MediaAsset, PostInput, PostResponse } from '@iorder/contracts'
import { Calendar, ChevronDown, ChevronRight, ExternalLink, Eye, FileText, Image as ImageIcon, MoreVertical, Plus, Search, Send, SlidersHorizontal, Trash2, Upload } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { archivePost, createCategory, createPost, deleteCategory, listCategories, listMedia, listPosts, publishPost, updatePost } from './api'
import { RichTextEditor } from './RichTextEditor'
import { toast } from './toast'
import { ImagePicker, PageHeader, StatusDot } from './ui'

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
  categoryIds: [],
  tags: [],
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
    categoryIds: post.categories.map((category) => category.id),
    tags: post.tags.map((tag) => tag.name),
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatViews(count: number) {
  if (count >= 1000) return `${(count / 1000).toFixed(count >= 10000 ? 0 : 1)}K`
  return String(count)
}

// Date <-> giá trị input datetime-local (giữ theo giờ địa phương).
function toLocalInput(value: Date | null) {
  if (!value) return ''
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}
function fromLocalInput(value: string): Date | null {
  return value ? new Date(value) : null
}

export function PostsManager() {
  const [posts, setPosts] = useState<PostResponse[]>([])
  const [images, setImages] = useState<MediaAsset[]>([])
  const [categories, setCategories] = useState<CategoryResponse[]>([])
  const [newCategory, setNewCategory] = useState('')
  const [tagInput, setTagInput] = useState('')

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<PostInput>(emptyPost)
  const [isSaving, setIsSaving] = useState(false)
  const initialFormRef = useRef<PostInput | null>(null)

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<PostFilter>('all')
  const [showArchived, setShowArchived] = useState(false)
  const [page, setPage] = useState(1)

  const [menuId, setMenuId] = useState<string | null>(null)
  const [publishMenu, setPublishMenu] = useState(false)
  const [showCoverPicker, setShowCoverPicker] = useState(false)

  const loadData = async () => {
    const [postResult, mediaResult, categoryResult] = await Promise.all([listPosts(), listMedia('image'), listCategories()])
    setPosts(postResult.items)
    setImages(mediaResult.items)
    setCategories(categoryResult.items)
    return postResult.items
  }

  const addCategory = async () => {
    const name = newCategory.trim()
    if (!name) return
    try {
      const result = await createCategory({ name, description: null, parentId: null, sortOrder: categories.length })
      setCategories((prev) => [...prev, result.item])
      setForm((current) => ({ ...current, categoryIds: [...current.categoryIds, result.item.id] }))
      setNewCategory('')
    } catch {
      toast.error('Không thể tạo chuyên mục.')
    }
  }

  const removeCategory = async (id: string) => {
    try {
      await deleteCategory(id)
      setCategories((prev) => prev.filter((category) => category.id !== id))
      setForm((current) => ({ ...current, categoryIds: current.categoryIds.filter((cid) => cid !== id) }))
      toast.warning('Đã xóa chuyên mục. Bài viết đã bị gỡ khỏi chuyên mục này.')
    } catch {
      toast.error('Không thể xóa chuyên mục.')
    }
  }

  const toggleCategory = (id: string) => {
    setForm((current) => ({
      ...current,
      categoryIds: current.categoryIds.includes(id) ? current.categoryIds.filter((cid) => cid !== id) : [...current.categoryIds, id],
    }))
  }

  const commitTag = () => {
    const value = tagInput.trim().replace(/,$/, '').trim()
    if (!value) return
    if (!form.tags.includes(value)) patchForm('tags', [...form.tags, value])
    setTagInput('')
  }

  const onTagKey = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') { event.preventDefault(); commitTag() }
    else if (event.key === 'Backspace' && tagInput === '' && form.tags.length > 0) {
      patchForm('tags', form.tags.slice(0, -1))
    }
  }

  useEffect(() => {
    void loadData().catch(() => toast.error('Không thể tải danh sách bài viết.'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const patchForm = <Key extends keyof PostInput>(key: Key, value: PostInput[Key]) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function selectPost(post: PostResponse) {
    const f = toInput(post)
    setSelectedId(post.id)
    setCreating(false)
    setForm(f)
    initialFormRef.current = f
    setShowCoverPicker(false)
  }

  const newPost = () => {
    setSelectedId(null)
    setCreating(true)
    setForm(emptyPost)
    initialFormRef.current = emptyPost
    setShowCoverPicker(false)
  }

  const closeEditor = () => {
    const isDirty = initialFormRef.current !== null && JSON.stringify(form) !== JSON.stringify(initialFormRef.current)
    if (isDirty && !confirm('Bài viết có thay đổi chưa lưu. Đóng mà không lưu?')) return
    setSelectedId(null)
    setCreating(false)
    setShowCoverPicker(false)
    setPublishMenu(false)
    initialFormRef.current = null
  }

  const savePost = async () => {
    setIsSaving(true)
    try {
      const result = selectedId ? await updatePost(selectedId, form) : await createPost(form)
      setSelectedId(result.item.id)
      setCreating(false)
      const savedForm = toInput(result.item)
      setForm(savedForm)
      initialFormRef.current = savedForm
      await loadData()
      toast.success('Đã lưu bản nháp.')
    } catch (error) {
      const code = error instanceof Error ? error.message : ''
      toast.error(code === 'SLUG_EXISTS' ? 'Đường dẫn đã tồn tại.' : 'Không thể lưu bài viết.')
    } finally {
      setIsSaving(false)
    }
  }

  const publish = async () => {
    setIsSaving(true)
    try {
      const saved = selectedId ? await updatePost(selectedId, form) : await createPost(form)
      setSelectedId(saved.item.id)
      const result = await publishPost(saved.item.id)
      setCreating(false)
      setForm(toInput(result.item))
      initialFormRef.current = null
      await loadData()
      closeEditor()
      toast.success('Đã xuất bản bài viết.')
    } catch (error) {
      const code = error instanceof Error ? error.message : ''
      toast.error(code === 'SLUG_EXISTS' ? 'Đường dẫn đã tồn tại.' : 'Không thể xuất bản.')
    } finally {
      setIsSaving(false)
    }
  }

  const archive = async (id: string) => {
    try {
      const result = await archivePost(id)
      if (id === selectedId) setForm(toInput(result.item))
      await loadData()
      toast.warning('Bài viết đã được ẩn.')
    } catch {
      toast.error('Không thể ẩn bài viết.')
    }
  }

  const quickPublish = async (id: string) => {
    try {
      const result = await publishPost(id)
      if (id === selectedId) setForm(toInput(result.item))
      await loadData()
      toast.success('Đã xuất bản bài viết.')
    } catch {
      toast.error('Không thể xuất bản bài viết.')
    }
  }

  const previewPost = (slug: string) => {
    if (slug) window.open(`/tin-tuc/${slug}`, '_blank', 'noopener')
  }

  const duplicatePost = async (post: PostResponse) => {
    try {
      const copy = toInput(post)
      copy.title = `Bản sao: ${post.title}`
      copy.slug = `${post.slug}-copy-${Date.now().toString(36)}`
      const result = await createPost(copy)
      await loadData()
      selectPost(result.item)
      toast.success('Đã tạo bản sao.')
    } catch {
      toast.error('Không thể nhân bản bài viết.')
    }
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
  const mediaMap = new Map(images.map((img) => [img.id, img.publicUrl]))

  const wordCount = useMemo(() => {
    if (!form.body) return 0
    const text = form.body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    return text ? text.split(' ').length : 0
  }, [form.body])
  const hasEditor = creating || selectedId !== null

  const savePostRef = useRef(savePost)
  const closeEditorRef = useRef(closeEditor)
  useEffect(() => { savePostRef.current = savePost; closeEditorRef.current = closeEditor })
  useEffect(() => {
    if (!hasEditor) return
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); void savePostRef.current() }
      if (e.key === 'Escape') closeEditorRef.current()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [hasEditor])

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

      <aside className="post-panel post-panel--full">
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
              const thumb = post.coverUrl ?? (post.coverMediaId ? mediaMap.get(post.coverMediaId) : null) ?? null
              return (
                <div className={`post-card${active ? ' is-active' : ''}`} key={post.id} onClick={() => selectPost(post)} style={{ cursor: 'pointer' }}>
                  <button type="button" className="post-card-main" tabIndex={-1}>
                    <span className="post-card-thumb">
                      {thumb ? <img src={thumb} alt="" loading="lazy" /> : <ImageIcon size={20} aria-hidden="true" />}
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
                    <div className="post-card-menu-wrap" onClick={(e) => e.stopPropagation()}>
                      <button type="button" className="post-card-kebab" aria-label="Thao tác" onClick={() => setMenuId(menuId === post.id ? null : post.id)}><MoreVertical size={16} /></button>
                      {menuId === post.id ? (
                        <>
                          <div className="menu-backdrop" onClick={() => setMenuId(null)} />
                          <div className="card-menu" role="menu">
                            <button type="button" role="menuitem" onClick={() => { setMenuId(null); selectPost(post) }}>Sửa</button>
                            <button type="button" role="menuitem" onClick={() => { setMenuId(null); previewPost(post.slug) }}>Xem trước</button>
                            <button type="button" role="menuitem" onClick={() => { setMenuId(null); void duplicatePost(post) }}>Nhân bản</button>
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

      {hasEditor ? (
        <div className="modal-overlay" role="dialog" aria-modal="true" onClick={() => { if (initialFormRef.current === null || JSON.stringify(form) === JSON.stringify(initialFormRef.current)) closeEditor() }}>
          <div className="modal-card modal-card-lg" onClick={(event) => event.stopPropagation()}>
            <div className="modal-head">
              <button type="button" className="modal-back" onClick={closeEditor}>← Trở về</button>
              <h2>{creating ? 'Bài viết mới' : 'Sửa bài viết'}</h2>
              {!creating && form.slug && (
                <a
                  className="btn-preview-page"
                  href={`/tin-tuc/${form.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink size={13} /> Xem trang
                </a>
              )}
            </div>
            <div className="modal-body">
              <h2 className="section-label">Thông tin cơ bản</h2>
              <div className="form-row-2col">
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

              <div className="form-row-2col">
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

              <div className="form-field">
                <span className="field-label">Chuyên mục</span>
                <div className="cat-list">
                  {categories.length === 0 ? <small className="field-hint">Chưa có chuyên mục — thêm bên dưới.</small> : null}
                  {categories.map((category) => (
                    <span key={category.id} className={`cat-chip${form.categoryIds.includes(category.id) ? ' is-on' : ''}`}>
                      <label>
                        <input type="checkbox" checked={form.categoryIds.includes(category.id)} onChange={() => toggleCategory(category.id)} />
                        {category.name}
                      </label>
                      <button type="button" className="cat-del" title="Xóa chuyên mục" onClick={() => void removeCategory(category.id)}>×</button>
                    </span>
                  ))}
                </div>
                <div className="cat-add">
                  <input placeholder="Thêm chuyên mục mới…" value={newCategory} onChange={(event) => setNewCategory(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); void addCategory() } }} />
                  <button type="button" className="secondary-button" onClick={() => void addCategory()}>Thêm</button>
                </div>
              </div>

              <div className="form-field">
                <span className="field-label">Thẻ (tags)</span>
                <div className="tag-input">
                  {form.tags.map((tag) => (
                    <span key={tag} className="tag-chip">{tag}<button type="button" onClick={() => patchForm('tags', form.tags.filter((value) => value !== tag))}>×</button></span>
                  ))}
                  <input placeholder="Nhập thẻ rồi Enter…" value={tagInput} onChange={(event) => setTagInput(event.target.value)} onKeyDown={onTagKey} onBlur={commitTag} />
                </div>
              </div>

              {form.type === 'promotion' ? (
                <>
                  <h2 className="section-label">Khuyến mãi</h2>
                  <div className="form-row-2col">
                    <label>
                      Nhãn nổi bật (badge)
                      <input maxLength={60} placeholder="VD: Giảm 20%" value={form.badgeText ?? ''} onChange={(event) => patchForm('badgeText', event.target.value || null)} />
                    </label>
                    <label>
                      Nhãn nút (CTA)
                      <input maxLength={80} placeholder="VD: Nhận ưu đãi" value={form.ctaLabel ?? ''} onChange={(event) => patchForm('ctaLabel', event.target.value || null)} />
                    </label>
                  </div>
                  <label className="full-field">
                    Link nút CTA
                    <input type="url" placeholder="https://..." value={form.ctaUrl ?? ''} onChange={(event) => patchForm('ctaUrl', event.target.value || null)} />
                  </label>
                  <div className="form-row-2col">
                    <label>
                      Bắt đầu khuyến mãi
                      <input type="datetime-local" value={toLocalInput(form.promotionStartAt)} onChange={(event) => patchForm('promotionStartAt', fromLocalInput(event.target.value))} />
                    </label>
                    <label>
                      Kết thúc khuyến mãi
                      <input type="datetime-local" value={toLocalInput(form.promotionEndAt)} onChange={(event) => patchForm('promotionEndAt', fromLocalInput(event.target.value))} />
                    </label>
                  </div>
                </>
              ) : null}

              <h2 className="section-label">Nội dung bài viết</h2>
              <RichTextEditor value={form.body} placeholder="Soạn nội dung bài viết..." onChange={(html) => patchForm('body', html)} />

              <details className="advanced-section">
                <summary>Tùy chọn nâng cao (Checklist, SEO)</summary>
                <div className="advanced-body">
                  <label className="full-field">
                    Checklist / điểm nổi bật (mỗi dòng một mục)
                    <textarea rows={4} value={form.checklist.join('\n')} onChange={(event) => patchForm('checklist', event.target.value.split('\n').map((item) => item.trim()).filter(Boolean))} />
                  </label>
                  <div className="form-row-2col">
                    <label>
                      SEO title <span className="field-counter">{(form.seoTitle ?? '').length}/70</span>
                      <input maxLength={70} value={form.seoTitle ?? ''} onChange={(event) => patchForm('seoTitle', event.target.value || null)} />
                    </label>
                    <label>
                      SEO description <span className="field-counter">{(form.seoDescription ?? '').length}/160</span>
                      <input maxLength={160} value={form.seoDescription ?? ''} onChange={(event) => patchForm('seoDescription', event.target.value || null)} />
                    </label>
                  </div>
                  <div className="seo-preview">
                    <p className="seo-preview-label">Xem trước trên Google</p>
                    <div className="seo-preview-card">
                      <p className="seo-preview-url">iorder.vn › tin-tuc › {form.slug || 'slug-bai-viet'}</p>
                      <p className="seo-preview-title">{form.seoTitle || form.title || 'Tiêu đề bài viết'}</p>
                      <p className="seo-preview-desc">{form.seoDescription || form.excerpt || 'Mô tả ngắn hiển thị trên kết quả tìm kiếm Google...'}</p>
                    </div>
                  </div>
                </div>
              </details>
            </div>

            <div className="modal-foot">
              {wordCount > 0 && <span className="modal-foot-start word-count">{wordCount} từ · ~{Math.ceil(wordCount / 200)} phút đọc</span>}
              <button type="button" className="secondary-button" onClick={closeEditor}>Đóng</button>
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
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
