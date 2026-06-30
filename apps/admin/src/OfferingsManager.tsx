import type { MediaAsset, OfferingContent, OfferingInput, OfferingResponse } from '@iorder/contracts'
import { Archive, ChevronDown, ChevronUp, ExternalLink, Eye, EyeOff, GripVertical, Minus, Pencil, Plus, Search, Star, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  archiveOffering,
  createOffering,
  deleteOffering,
  listMedia,
  listOfferings,
  publishOffering,
  updateOffering,
} from './api'
import { toast } from './toast'
import { ImagePicker, PageHeader, StatusDot, ToggleSwitch } from './ui'

const STATUS_TONE: Record<string, 'on' | 'muted' | 'danger'> = {
  published: 'on', draft: 'muted', archived: 'danger',
}
const STATUS_LABELS: Record<string, string> = {
  draft: 'Nháp', published: 'Đã đăng', archived: 'Đã ẩn',
}
const TYPES = [
  { key: 'software', label: 'Phần mềm' },
  { key: 'solution', label: 'Giải pháp' },
  { key: 'service', label: 'Dịch vụ' },
  { key: 'industry', label: 'Ngành hàng' },
] as const
type OfferingType = typeof TYPES[number]['key']

const TYPE_COLORS: Record<string, string> = {
  software: '#2563eb', solution: '#7c3aed', service: '#0891b2', industry: '#16a34a',
}
const TYPE_PREFIX: Record<OfferingType, string> = {
  software: '/phan-mem', solution: '/giai-phap', service: '/dich-vu', industry: '/nganh-hang',
}

const emptyContent = (): OfferingContent => ({
  description: '', tags: [], bestFor: null, keyValue: null,
  metrics: [], features: [], benefits: [], faq: [], items: [], category: null,
})

const emptyInput = (type: OfferingType): OfferingInput => ({
  type, title: '', slug: '', summary: null, icon: null, coverMediaId: null,
  sortOrder: 0, isFeatured: false, seoTitle: null, seoDescription: null,
  canonicalUrl: null, contentJson: emptyContent(),
})

function slugify(text: string) {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd').replace(/[^a-z0-9\s-]/g, '').trim()
    .replace(/\s+/g, '-').replace(/-+/g, '-')
}

// ── Dynamic list editor ────────────────────────────────────────────────────────
function ListEditor({
  label, items, onChange, placeholder,
}: { label: string; items: string[]; onChange: (next: string[]) => void; placeholder?: string }) {
  return (
    <div className="list-editor">
      <div className="list-editor-head">
        <span className="list-editor-label">{label}</span>
        <button type="button" className="list-editor-add" onClick={() => onChange([...items, ''])}>
          <Plus size={13} /> Thêm
        </button>
      </div>
      {items.map((item, i) => (
        <div key={i} className="list-editor-row">
          <GripVertical size={14} className="list-editor-grip" />
          <input
            value={item}
            placeholder={placeholder}
            onChange={(e) => onChange(items.map((v, j) => j === i ? e.target.value : v))}
          />
          <button type="button" className="list-editor-remove" onClick={() => onChange(items.filter((_, j) => j !== i))}>
            <Minus size={14} />
          </button>
        </div>
      ))}
      {items.length === 0 && (
        <p className="list-editor-empty">Chưa có mục nào. Nhấn "+ Thêm" để bắt đầu.</p>
      )}
    </div>
  )
}

// ── FAQ editor ─────────────────────────────────────────────────────────────────
function FaqEditor({ items, onChange }: { items: [string, string][]; onChange: (next: [string, string][]) => void }) {
  return (
    <div className="list-editor">
      <div className="list-editor-head">
        <span className="list-editor-label">Câu hỏi thường gặp (FAQ)</span>
        <button type="button" className="list-editor-add" onClick={() => onChange([...items, ['', '']])}>
          <Plus size={13} /> Thêm câu hỏi
        </button>
      </div>
      {items.map(([q, a], i) => (
        <div key={i} className="faq-editor-row">
          <div className="faq-editor-num">#{i + 1}</div>
          <div className="faq-editor-fields">
            <input
              value={q}
              placeholder="Câu hỏi?"
              onChange={(e) => onChange(items.map((pair, j) => j === i ? [e.target.value, pair[1]] as [string, string] : pair))}
            />
            <textarea
              rows={2}
              value={a}
              placeholder="Câu trả lời..."
              onChange={(e) => onChange(items.map((pair, j) => j === i ? [pair[0], e.target.value] as [string, string] : pair))}
            />
          </div>
          <button type="button" className="list-editor-remove" onClick={() => onChange(items.filter((_, j) => j !== i))}>
            <Minus size={14} />
          </button>
        </div>
      ))}
      {items.length === 0 && (
        <p className="list-editor-empty">Chưa có câu hỏi nào.</p>
      )}
    </div>
  )
}

// ── Tag chip input ─────────────────────────────────────────────────────────────
function TagInput({ tags, onChange }: { tags: string[]; onChange: (next: string[]) => void }) {
  const [input, setInput] = useState('')
  const add = () => {
    const val = input.trim()
    if (val && !tags.includes(val)) onChange([...tags, val])
    setInput('')
  }
  return (
    <div className="tag-input-wrap">
      {tags.map((tag) => (
        <span key={tag} className="tag-chip">
          {tag}
          <button type="button" onClick={() => onChange(tags.filter((t) => t !== tag))}>&times;</button>
        </span>
      ))}
      <input
        className="tag-input-field"
        value={input}
        placeholder="Thêm tag, nhấn Enter..."
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
        onBlur={add}
      />
    </div>
  )
}

// ── Offering form (4 tabs) ─────────────────────────────────────────────────────
type Tab = 'basic' | 'content' | 'seo' | 'preview'

function OfferingForm({
  initial, images, onSave, onCancel,
}: {
  initial: OfferingInput
  images: MediaAsset[]
  onSave: (input: OfferingInput) => Promise<void>
  onCancel: () => void
}) {
  const [form, setForm] = useState<OfferingInput>(initial)
  const [tab, setTab] = useState<Tab>('basic')
  const [saving, setSaving] = useState(false)
  const [showCover, setShowCover] = useState(false)
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop')
  const formRef = useRef<HTMLFormElement>(null)

  const set = (patch: Partial<OfferingInput>) => setForm((f) => ({ ...f, ...patch }))
  const setContent = (patch: Partial<OfferingContent>) =>
    setForm((f) => ({ ...f, contentJson: { ...f.contentJson, ...patch } }))

  const handleTitle = (title: string) => set({ title, slug: form.slug || slugify(title) })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try { await onSave(form) }
    catch (err) { toast.error(err instanceof Error ? err.message : 'Lỗi không xác định') }
    finally { setSaving(false) }
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); formRef.current?.requestSubmit() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const coverImg = images.find((img) => img.id === form.coverMediaId)

  const contentCount = form.contentJson.features.length + form.contentJson.benefits.length + form.contentJson.metrics.length
  const publicUrl = form.slug ? `${TYPE_PREFIX[form.type]}/${form.slug}` : ''
  const TABS: { id: Tab; label: string; badge: number | null }[] = [
    { id: 'basic', label: 'Cơ bản', badge: null },
    { id: 'content', label: 'Nội dung', badge: contentCount || null },
    { id: 'seo', label: 'SEO', badge: null },
    { id: 'preview', label: 'Xem trước', badge: null },
  ]

  return (
    <form ref={formRef} className="offering-form" onSubmit={handleSubmit}>
      {/* Sticky tab bar */}
      <div className="form-tabs-wrap">
        <div className="form-tabs">
          {TABS.map((t) => (
            <button key={t.id} type="button" className={`form-tab${tab === t.id ? ' is-active' : ''}`} onClick={() => setTab(t.id)}>
              {t.label}
              {t.badge !== null ? <span className="form-tab-badge">{t.badge}</span> : null}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab: Xem trước ── */}
      {tab === 'preview' && (
        <div className="form-preview-area">
          <div className="form-preview-toolbar">
            <div className="preview-mode-btns">
              <button type="button" className={previewMode === 'desktop' ? 'is-active' : ''} onClick={() => setPreviewMode('desktop')}>Desktop</button>
              <button type="button" className={previewMode === 'mobile' ? 'is-active' : ''} onClick={() => setPreviewMode('mobile')}>Mobile</button>
            </div>
            {publicUrl && (
              <a className="btn-preview-page" href={publicUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink size={12} /> Mở tab mới
              </a>
            )}
          </div>
          {publicUrl
            ? (
              <div className={`form-preview-frame is-${previewMode}`}>
                <iframe key={`${publicUrl}-${previewMode}`} src={publicUrl} title="Xem trước trang" />
              </div>
            )
            : (
              <div className="form-preview-empty">
                <p>Nhập Slug ở tab Cơ bản để xem trước trang.</p>
              </div>
            )}
        </div>
      )}

      {/* Scrollable content area */}
      {tab !== 'preview' && (
      <div className="form-content-wrap">
        <div className="form-content-inner">

      {/* ── Tab: Cơ bản ── */}
      {tab === 'basic' && (
        <div className="form-tab-panel">
          <div className="offering-cover-row">
            <div className="offering-cover-thumb" style={{ background: coverImg ? '#000' : TYPE_COLORS[form.type] ?? '#64748b' }}>
              {coverImg
                ? <img src={coverImg.publicUrl} alt="" />
                : <span>{form.title?.[0]?.toUpperCase() ?? '?'}</span>}
            </div>
            <div className="offering-cover-actions">
              <button type="button" className="btn-secondary btn-sm" onClick={() => setShowCover((v) => !v)}>
                {showCover ? 'Ẩn chọn ảnh' : 'Chọn ảnh bìa'}
              </button>
              {form.coverMediaId && (
                <button type="button" className="btn-sm btn-ghost-danger" onClick={() => { set({ coverMediaId: null }); setShowCover(false) }}>
                  Xóa ảnh
                </button>
              )}
            </div>
          </div>

          {showCover && (
            <ImagePicker
              label="Ảnh bìa"
              ariaLabel="Chọn ảnh bìa"
              images={images}
              value={form.coverMediaId ?? ''}
              onChange={(id) => { set({ coverMediaId: id || null }); setShowCover(false) }}
              onUploaded={(asset: MediaAsset) => { set({ coverMediaId: asset.id }); setShowCover(false) }}
            />
          )}

          <div className="form-row">
            <label>Tiêu đề *</label>
            <input value={form.title} onChange={(e) => handleTitle(e.target.value)} required maxLength={220} />
          </div>
          <div className="form-row">
            <label>Slug *</label>
            <input value={form.slug} onChange={(e) => set({ slug: e.target.value })} required maxLength={180} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" />
            <small className="form-hint">Địa chỉ URL: /{form.slug || '...'}</small>
          </div>
          <div className="form-row">
            <label>Mô tả ngắn</label>
            <textarea rows={3} value={form.summary ?? ''} onChange={(e) => set({ summary: e.target.value || null })} maxLength={600} placeholder="Hiển thị dưới tiêu đề trên trang listing..." />
          </div>
          <div className="form-row-2col">
            <div className="form-row">
              <label>Icon key</label>
              <input value={form.icon ?? ''} onChange={(e) => set({ icon: e.target.value || null })} placeholder="receipt, users, server..." />
            </div>
            <div className="form-row">
              <label>Thứ tự hiển thị</label>
              <input type="number" value={form.sortOrder} onChange={(e) => set({ sortOrder: Number(e.target.value) })} min={0} />
            </div>
          </div>
          <div className="form-row">
            <ToggleSwitch checked={form.isFeatured} onChange={(next) => set({ isFeatured: next })} label="Nổi bật" hint="Ưu tiên hiển thị ở vị trí nổi bật" />
          </div>
        </div>
      )}

      {/* ── Tab: Nội dung ── */}
      {tab === 'content' && (
        <div className="form-tab-panel">
          <div className="form-row">
            <label>Mô tả chi tiết *</label>
            <textarea rows={4} value={form.contentJson.description} onChange={(e) => setContent({ description: e.target.value })} required maxLength={1000} />
          </div>
          <div className="form-row-2col">
            <div className="form-row">
              <label>Phù hợp với</label>
              <input value={form.contentJson.bestFor ?? ''} onChange={(e) => setContent({ bestFor: e.target.value || null })} placeholder="Cửa hàng bán lẻ, nhà hàng..." />
            </div>
            <div className="form-row">
              <label>Giá trị cốt lõi</label>
              <input value={form.contentJson.keyValue ?? ''} onChange={(e) => setContent({ keyValue: e.target.value || null })} placeholder="Vận hành bán hàng tập trung" />
            </div>
          </div>

          <div className="form-row">
            <label>Tags</label>
            <TagInput tags={form.contentJson.tags} onChange={(next) => setContent({ tags: next })} />
          </div>

          <ListEditor
            label="Số liệu nhanh (metrics)"
            items={form.contentJson.metrics}
            onChange={(next) => setContent({ metrics: next })}
            placeholder="Tạo đơn ít bước"
          />

          <ListEditor
            label="Tính năng chính"
            items={form.contentJson.features}
            onChange={(next) => setContent({ features: next })}
            placeholder="Bán hàng tại quầy, gọi món và tạo đơn nhanh..."
          />

          <ListEditor
            label="Lợi ích vận hành"
            items={form.contentJson.benefits}
            onChange={(next) => setContent({ benefits: next })}
            placeholder="Giảm thời gian đào tạo nhân viên mới..."
          />

          <FaqEditor items={form.contentJson.faq} onChange={(next) => setContent({ faq: next })} />
        </div>
      )}

      {/* ── Tab: SEO ── */}
      {tab === 'seo' && (
        <div className="form-tab-panel">
          <div className="form-row">
            <label>SEO Title <span className="form-hint-inline">(tối đa 70 ký tự)</span></label>
            <input value={form.seoTitle ?? ''} onChange={(e) => set({ seoTitle: e.target.value || null })} maxLength={70} placeholder={form.title} />
            <small className="form-hint">{(form.seoTitle ?? '').length}/70 ký tự</small>
          </div>
          <div className="form-row">
            <label>SEO Description <span className="form-hint-inline">(tối đa 180 ký tự)</span></label>
            <textarea rows={3} value={form.seoDescription ?? ''} onChange={(e) => set({ seoDescription: e.target.value || null })} maxLength={180} placeholder={form.summary ?? ''} />
            <small className="form-hint">{(form.seoDescription ?? '').length}/180 ký tự</small>
          </div>
          <div className="form-row">
            <label>Canonical URL <span className="form-hint-inline">(để trống nếu không cần)</span></label>
            <input value={form.canonicalUrl ?? ''} onChange={(e) => set({ canonicalUrl: e.target.value || null })} placeholder="https://..." />
          </div>

          <div className="seo-preview">
            <p className="seo-preview-label">Xem trước Google</p>
            <div className="seo-preview-box">
              <p className="seo-preview-title">{form.seoTitle || form.title || 'Tiêu đề trang'}</p>
              <p className="seo-preview-url">iorder.vn › {form.slug || '...'}</p>
              <p className="seo-preview-desc">{form.seoDescription || form.summary || 'Mô tả trang sẽ hiển thị ở đây...'}</p>
            </div>
          </div>
        </div>
      )}

        </div>{/* /form-content-inner */}
      </div>
      )}{/* /form-content-wrap */}

      <div className="modal-foot">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={saving}>Hủy</button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Đang lưu...' : 'Lưu nháp'}
        </button>
      </div>
    </form>
  )
}

// ── Offering card ──────────────────────────────────────────────────────────────
function OfferingCard({
  offering, coverUrl, typePrefix, onEdit, onPublish, onArchive, onDelete, onMoveUp, onMoveDown, onToggleFeatured,
}: {
  offering: OfferingResponse
  coverUrl: string | undefined
  typePrefix: string
  onEdit: () => void
  onPublish: () => Promise<void>
  onArchive: () => Promise<void>
  onDelete: () => Promise<void>
  onMoveUp: (() => Promise<void>) | null
  onMoveDown: (() => Promise<void>) | null
  onToggleFeatured: () => Promise<void>
}) {
  const [busy, setBusy] = useState(false)
  const act = async (fn: () => Promise<void>) => { setBusy(true); try { await fn() } finally { setBusy(false) } }
  const color = TYPE_COLORS[offering.type] ?? '#64748b'

  return (
    <div className="offering-card">
      <div className="offering-card-thumb" style={{ background: coverUrl ? undefined : color }}>
        {coverUrl
          ? <img src={coverUrl} alt={offering.title} />
          : <span>{offering.title[0]?.toUpperCase()}</span>}
        {offering.isFeatured && <span className="offering-card-star" title="Nổi bật"><Star size={12} fill="currentColor" /></span>}
      </div>

      <div className="offering-card-body">
        <p className="offering-card-title">{offering.title}</p>
        <p className="offering-card-meta">/{offering.slug}</p>
        {offering.summary && <p className="offering-card-summary">{offering.summary}</p>}
      </div>

      <div className="offering-card-foot">
        <span className={`status-badge status-${offering.status}`}>
          <StatusDot tone={STATUS_TONE[offering.status] ?? 'muted'} />
          {STATUS_LABELS[offering.status]}
        </span>
        <div className="offering-card-actions">
          {(onMoveUp || onMoveDown) && (
            <>
              <button type="button" title="Lên" onClick={() => onMoveUp && void act(onMoveUp)} disabled={busy || !onMoveUp}><ChevronUp size={14} /></button>
              <button type="button" title="Xuống" onClick={() => onMoveDown && void act(onMoveDown)} disabled={busy || !onMoveDown}><ChevronDown size={14} /></button>
            </>
          )}
          <button
            type="button"
            title={offering.isFeatured ? 'Đang nổi bật — bấm để bỏ' : 'Đánh dấu nổi bật'}
            className={offering.isFeatured ? 'act-featured' : ''}
            onClick={() => void act(onToggleFeatured)}
            disabled={busy}
          >
            <Star size={14} fill={offering.isFeatured ? 'currentColor' : 'none'} />
          </button>
          <button type="button" title="Chỉnh sửa" onClick={onEdit} disabled={busy}>
            <Pencil size={15} />
          </button>
          <a
            href={`${typePrefix}/${offering.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            title="Xem trên website"
            className="offering-card-preview-link"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink size={15} />
          </a>
          {offering.status !== 'published' && (
            <button type="button" title="Xuất bản" className="act-publish" onClick={() => void act(onPublish)} disabled={busy}>
              <Eye size={15} />
            </button>
          )}
          {offering.status === 'published' && (
            <button type="button" title="Ẩn" onClick={() => void act(onArchive)} disabled={busy}>
              <EyeOff size={15} />
            </button>
          )}
          <button type="button" title="Xóa" className="act-danger" onClick={() => void act(onDelete)} disabled={busy}>
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}

function toOfferingInput(item: OfferingResponse): OfferingInput {
  return {
    type: item.type, title: item.title, slug: item.slug,
    summary: item.summary, icon: item.icon, coverMediaId: item.coverMediaId,
    sortOrder: item.sortOrder, isFeatured: item.isFeatured,
    seoTitle: item.seoTitle, seoDescription: item.seoDescription,
    canonicalUrl: item.canonicalUrl, contentJson: item.contentJson,
  }
}

// ── Main manager ───────────────────────────────────────────────────────────────
export function OfferingsManager() {
  const [activeType, setActiveType] = useState<OfferingType>('software')
  const [items, setItems] = useState<OfferingResponse[]>([])
  const [images, setImages] = useState<MediaAsset[]>([])
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState<OfferingResponse | null | 'new'>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published' | 'archived'>('all')
  const [search, setSearch] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const [res, mediaRes] = await Promise.all([listOfferings(activeType), listMedia('image')])
      setItems(res.items)
      setImages(mediaRes.items)
    } catch { toast.error('Không tải được danh sách. Kiểm tra kết nối API.') }
    finally { setLoading(false) }
  }

  useEffect(() => { void load() }, [activeType])
  useEffect(() => { setStatusFilter('all'); setSearch('') }, [activeType])

  const handleSave = async (input: OfferingInput) => {
    if (editing === 'new') await createOffering(input)
    else if (editing) await updateOffering(editing.id, input)
    setEditing(null)
    await load()
    toast.success('Đã lưu nội dung.')
  }

  const handleToggleFeatured = async (id: string) => {
    const item = items.find((i) => i.id === id)
    if (!item) return
    try {
      await updateOffering(id, { ...toOfferingInput(item), isFeatured: !item.isFeatured })
      await load()
      toast.success(item.isFeatured ? 'Đã bỏ đánh dấu nổi bật.' : 'Đã đánh dấu nổi bật.')
    } catch {
      toast.error('Không thể cập nhật.')
    }
  }

  const handlePublish = async (id: string) => {
    await publishOffering(id); await load(); toast.success('Đã xuất bản.')
  }

  const handleArchive = async (id: string) => {
    await archiveOffering(id); await load(); toast.warning('Đã ẩn nội dung.')
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa vĩnh viễn? Hành động này không thể hoàn tác.')) return
    await deleteOffering(id); await load(); toast.warning('Đã xóa nội dung.')
  }

  const moveItem = async (id: string, direction: 'up' | 'down') => {
    const s = [...items].sort((a, b) => a.sortOrder - b.sortOrder)
    const idx = s.findIndex((i) => i.id === id)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    const a = s[idx]
    const b = s[swapIdx]
    if (!a || !b) return
    try {
      await Promise.all([
        updateOffering(a.id, { ...toOfferingInput(a), sortOrder: b.sortOrder }),
        updateOffering(b.id, { ...toOfferingInput(b), sortOrder: a.sortOrder }),
      ])
      await load()
    } catch {
      toast.error('Không thể đổi thứ tự.')
    }
  }

  const coverMap = new Map(images.map((img) => [img.id, img.publicUrl]))

  const statusCounts = useMemo(() => ({
    all: items.length,
    draft: items.filter((i) => i.status === 'draft').length,
    published: items.filter((i) => i.status === 'published').length,
    archived: items.filter((i) => i.status === 'archived').length,
  }), [items])

  const isReorderable = !search.trim() && statusFilter === 'all'

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return items
      .filter((i) => statusFilter === 'all' || i.status === statusFilter)
      .filter((i) => !query || i.title.toLowerCase().includes(query) || i.slug.toLowerCase().includes(query))
      .sort((a, b) => a.sortOrder - b.sortOrder)
  }, [items, statusFilter, search])

  return (
    <div className="admin-module">
      <PageHeader
        title="Phần mềm & Giải pháp"
        description="Quản lý phần mềm, giải pháp, dịch vụ và ngành hàng hiển thị trên website."
        actions={
          <button type="button" className="btn-primary btn-icon" onClick={() => setEditing('new')}>
            <Plus size={16} /> Thêm mới
          </button>
        }
      />

      <div className="tab-nav">
        {TYPES.map((t) => (
          <button key={t.key} type="button" className={activeType === t.key ? 'is-active' : ''} onClick={() => setActiveType(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {loading && <p className="admin-info">Đang tải...</p>}

      {!loading && items.length === 0 && (
        <div className="admin-empty">
          <Archive size={36} />
          <p>Chưa có nội dung nào. Nhấn "+ Thêm mới" để bắt đầu.</p>
        </div>
      )}

      {!loading && items.length > 0 && (
        <>
          <div className="toolbar">
            <span className="toolbar-search-wrap">
              <Search size={15} className="toolbar-search-icon" aria-hidden="true" />
              <input className="toolbar-search" type="search" placeholder="Tìm theo tên, slug…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </span>
          </div>

          <div className="status-pills">
            {(['all', 'draft', 'published', 'archived'] as const).map((key) => {
              const LABELS = { all: 'Tất cả', draft: 'Nháp', published: 'Đã đăng', archived: 'Đã ẩn' }
              const count = statusCounts[key]
              return (
                <button
                  key={key}
                  type="button"
                  className={`status-pill${statusFilter === key ? ' is-active' : ''}${count === 0 && key !== 'all' ? ' is-empty' : ''}`}
                  onClick={() => setStatusFilter(key)}
                >
                  {LABELS[key]}{count > 0 ? ` (${count})` : ''}
                </button>
              )
            })}
          </div>

          {filtered.length === 0 ? (
            <div className="admin-empty admin-empty--inline">
              <p>Không có mục nào khớp với bộ lọc.</p>
              {(search || statusFilter !== 'all') && (
                <button type="button" className="btn-secondary" onClick={() => { setSearch(''); setStatusFilter('all') }}>Xóa bộ lọc</button>
              )}
            </div>
          ) : (
            <div className="offering-grid">
              {filtered.map((item, idx) => (
                <OfferingCard
                  key={item.id}
                  offering={item}
                  coverUrl={item.coverMediaId ? coverMap.get(item.coverMediaId) : undefined}
                  typePrefix={TYPE_PREFIX[activeType]}
                  onEdit={() => setEditing(item)}
                  onPublish={async () => handlePublish(item.id)}
                  onArchive={async () => handleArchive(item.id)}
                  onDelete={async () => handleDelete(item.id)}
                  onMoveUp={isReorderable && idx > 0 ? async () => moveItem(item.id, 'up') : null}
                  onMoveDown={isReorderable && idx < filtered.length - 1 ? async () => moveItem(item.id, 'down') : null}
                  onToggleFeatured={async () => handleToggleFeatured(item.id)}
                />
              ))}
            </div>
          )}
          {isReorderable && filtered.length > 1 && (
            <p className="table-hint">Dùng ↑↓ trên mỗi thẻ để sắp xếp thứ tự hiển thị.</p>
          )}
        </>
      )}

      {editing !== null ? (
        <div className="modal-overlay" role="dialog" aria-modal="true" onClick={() => setEditing(null)}>
          <div className="modal-card modal-card-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <button type="button" className="modal-back" onClick={() => setEditing(null)}>← Trở về</button>
              <h2>{editing === 'new' ? 'Thêm mới' : 'Chỉnh sửa'} — {TYPES.find((t) => t.key === activeType)?.label}</h2>
              {editing !== 'new' && editing?.slug && (
                <a
                  className="btn-preview-page"
                  href={`${TYPE_PREFIX[activeType]}/${editing.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink size={13} /> Xem trang
                </a>
              )}
            </div>
            <div className="modal-body">
              <OfferingForm
                images={images}
                initial={editing === 'new' ? emptyInput(activeType) : { ...editing, contentJson: editing.contentJson as OfferingContent }}
                onSave={handleSave}
                onCancel={() => setEditing(null)}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
