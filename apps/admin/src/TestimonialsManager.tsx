import type { MediaAsset, TestimonialInput, TestimonialResponse } from '@iorder/contracts'
import { MessageSquareQuote, Pencil, Plus, Star, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'

import { createTestimonial, deleteTestimonial, listMedia, listTestimonials, updateTestimonial } from './api'
import { toast } from './toast'
import { ImagePicker, PageHeader, ToggleSwitch } from './ui'

const emptyTestimonial: TestimonialInput = {
  authorName: '',
  authorRole: null,
  company: null,
  quote: '',
  rating: null,
  avatarMediaId: null,
  sortOrder: 0,
  isEnabled: true,
}

function toInput(item: TestimonialResponse): TestimonialInput {
  return {
    authorName: item.authorName,
    authorRole: item.authorRole,
    company: item.company,
    quote: item.quote,
    rating: item.rating,
    avatarMediaId: item.avatarMediaId,
    sortOrder: item.sortOrder,
    isEnabled: item.isEnabled,
  }
}

// ── Star rating picker ─────────────────────────────────────────────────────────
function StarPicker({ value, onChange }: { value: number | null; onChange: (v: number | null) => void }) {
  const [hover, setHover] = useState<number | null>(null)
  return (
    <div className="star-picker">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          className={`star-btn${(hover ?? value ?? 0) >= n ? ' is-filled' : ''}`}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(null)}
          onClick={() => onChange(value === n ? null : n)}
          aria-label={`${n} sao`}
        >
          <Star size={22} fill={(hover ?? value ?? 0) >= n ? 'currentColor' : 'none'} />
        </button>
      ))}
      {value !== null && (
        <button type="button" className="star-clear" onClick={() => onChange(null)}>Bỏ chọn</button>
      )}
    </div>
  )
}

// ── Stars display (read-only) ──────────────────────────────────────────────────
function StarDisplay({ value }: { value: number | null }) {
  if (!value) return null
  return (
    <span className="star-display">
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} size={12} fill={i < value ? 'currentColor' : 'none'} />
      ))}
    </span>
  )
}

// ── Testimonial card ───────────────────────────────────────────────────────────
function TestimonialCard({
  item, avatarUrl, onEdit, onDelete, onToggle,
}: {
  item: TestimonialResponse
  avatarUrl: string | null
  onEdit: () => void
  onDelete: () => Promise<void>
  onToggle: () => Promise<void>
}) {
  const [busy, setBusy] = useState(false)
  const act = async (fn: () => Promise<void>) => { setBusy(true); try { await fn() } finally { setBusy(false) } }
  const initials = item.authorName.split(' ').slice(-2).map((w) => w[0]).join('').toUpperCase()

  return (
    <div className={`testimonial-card${item.isEnabled ? '' : ' is-disabled'}`}>
      <div className="testimonial-card-quote">
        <MessageSquareQuote size={16} className="testimonial-quote-icon" />
        <p>{item.quote}</p>
      </div>

      <div className="testimonial-card-author">
        <div className="testimonial-avatar">
          {avatarUrl
            ? <img src={avatarUrl} alt={item.authorName} />
            : <span>{initials}</span>}
        </div>
        <div className="testimonial-author-info">
          <strong>{item.authorName}</strong>
          {(item.authorRole || item.company) && (
            <span>{[item.authorRole, item.company].filter(Boolean).join(' · ')}</span>
          )}
          <StarDisplay value={item.rating} />
        </div>
      </div>

      <div className="testimonial-card-foot">
        <button
          type="button"
          className={`status-pill${item.isEnabled ? ' is-on' : ''}`}
          onClick={() => void act(onToggle)}
          disabled={busy}
          title={item.isEnabled ? 'Đang hiển thị — nhấn để ẩn' : 'Đang ẩn — nhấn để hiện'}
        >
          <span className="status-dot" />
          {item.isEnabled ? 'Hiển thị' : 'Đã ẩn'}
        </button>
        <div className="testimonial-actions">
          <button type="button" title="Chỉnh sửa" onClick={onEdit} disabled={busy}><Pencil size={15} /></button>
          <button type="button" title="Xóa" className="act-danger" onClick={() => void act(onDelete)} disabled={busy}><Trash2 size={15} /></button>
        </div>
      </div>
    </div>
  )
}

// ── Main manager ───────────────────────────────────────────────────────────────
export function TestimonialsManager() {
  const [items, setItems] = useState<TestimonialResponse[]>([])
  const [images, setImages] = useState<MediaAsset[]>([])
  const [editing, setEditing] = useState<TestimonialResponse | null | 'new'>(null)
  const [form, setForm] = useState<TestimonialInput>(emptyTestimonial)
  const [isSaving, setIsSaving] = useState(false)
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)

  const loadData = async () => {
    const [result, mediaResult] = await Promise.all([listTestimonials(), listMedia('image')])
    setItems(result.items)
    setImages(mediaResult.items)
  }

  useEffect(() => {
    void loadData().catch(() => toast.error('Không thể tải danh sách đánh giá.'))
  }, [])

  const avatarMap = new Map(images.map((img) => [img.id, img.publicUrl]))

  const openNew = () => {
    setForm({ ...emptyTestimonial, sortOrder: items.length })
    setEditing('new')
    setShowAvatarPicker(false)
  }

  const openEdit = (item: TestimonialResponse) => {
    setForm(toInput(item))
    setEditing(item)
    setShowAvatarPicker(false)
  }

  const close = () => {
    setEditing(null)
    setShowAvatarPicker(false)
  }

  const patchForm = <K extends keyof TestimonialInput>(key: K, value: TestimonialInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      if (editing === 'new') await createTestimonial(form)
      else if (editing) await updateTestimonial(editing.id, form)
      close()
      await loadData()
      toast.success('Đã lưu đánh giá.')
    } catch {
      toast.error('Không thể lưu đánh giá.')
    } finally {
      setIsSaving(false)
    }
  }

  const remove = async (id: string) => {
    if (!window.confirm('Xóa đánh giá này?')) return
    try {
      await deleteTestimonial(id)
      await loadData()
      toast.warning('Đã xóa đánh giá.')
    } catch {
      toast.error('Không thể xóa.')
    }
  }

  const toggleEnabled = async (item: TestimonialResponse) => {
    try {
      await updateTestimonial(item.id, { ...toInput(item), isEnabled: !item.isEnabled })
      await loadData()
      toast[item.isEnabled ? 'warning' : 'success'](item.isEnabled ? 'Đã ẩn đánh giá.' : 'Đã hiện đánh giá.')
    } catch {
      toast.error('Không thể đổi trạng thái.')
    }
  }

  const avatarUrl = form.avatarMediaId ? avatarMap.get(form.avatarMediaId) ?? null : null
  const initials = form.authorName.split(' ').slice(-2).map((w) => w[0]).join('').toUpperCase() || '?'

  return (
    <div className="admin-module">
      <PageHeader
        title="Đánh giá khách hàng"
        description={'Lời chứng thực hiển thị ở mục "Khách hàng nói gì" trên trang chủ.'}
        actions={
          <button className="btn-primary btn-icon" type="button" onClick={openNew}>
            <Plus size={16} /> Thêm đánh giá
          </button>
        }
      />

      {items.length === 0 && (
        <div className="admin-empty">
          <MessageSquareQuote size={36} />
          <p>Chưa có đánh giá nào. Nhấn "+ Thêm đánh giá" để bắt đầu.</p>
        </div>
      )}

      {items.length > 0 && (
        <div className="testimonial-grid">
          {items.map((item) => (
            <TestimonialCard
              key={item.id}
              item={item}
              avatarUrl={item.avatarMediaId ? avatarMap.get(item.avatarMediaId) ?? null : null}
              onEdit={() => openEdit(item)}
              onDelete={async () => remove(item.id)}
              onToggle={async () => toggleEnabled(item)}
            />
          ))}
        </div>
      )}

      {editing !== null && (
        <div className="modal-overlay" role="dialog" aria-modal="true" onClick={close}>
          <form className="modal-card" onClick={(e) => e.stopPropagation()} onSubmit={save}>
            <div className="modal-head">
              <button type="button" className="modal-back" onClick={close}>← Trở về</button>
              <h2>{editing === 'new' ? 'Thêm đánh giá' : 'Sửa đánh giá'}</h2>
            </div>

            <div className="modal-body">
              {/* Avatar picker */}
              <div className="testimonial-avatar-row">
                <div className="testimonial-avatar testimonial-avatar--lg">
                  {avatarUrl
                    ? <img src={avatarUrl} alt={form.authorName} />
                    : <span>{initials}</span>}
                </div>
                <div className="testimonial-avatar-actions">
                  <button type="button" className="btn-secondary btn-sm" onClick={() => setShowAvatarPicker((v) => !v)}>
                    {showAvatarPicker ? 'Ẩn chọn ảnh' : 'Chọn ảnh đại diện'}
                  </button>
                  {form.avatarMediaId && (
                    <button type="button" className="btn-ghost-danger btn-sm" onClick={() => { patchForm('avatarMediaId', null); setShowAvatarPicker(false) }}>
                      Xóa ảnh
                    </button>
                  )}
                </div>
              </div>

              {showAvatarPicker && (
                <ImagePicker
                  label="Ảnh đại diện"
                  ariaLabel="Chọn ảnh đại diện"
                  images={images}
                  value={form.avatarMediaId}
                  onChange={(id) => { patchForm('avatarMediaId', id); setShowAvatarPicker(false) }}
                  onUploaded={(asset) => { setImages((prev) => [asset, ...prev]); patchForm('avatarMediaId', asset.id); setShowAvatarPicker(false) }}
                />
              )}

              <div className="form-row">
                <label>Nội dung đánh giá *
                  <textarea required maxLength={2000} rows={4} value={form.quote} onChange={(e) => patchForm('quote', e.target.value)} placeholder="Viết lời nhận xét của khách hàng..." />
                </label>
              </div>

              <div className="form-row-2col">
                <div className="form-row">
                  <label>Tên khách hàng *
                    <input required maxLength={180} value={form.authorName} onChange={(e) => patchForm('authorName', e.target.value)} />
                  </label>
                </div>
                <div className="form-row">
                  <label>Chức vụ
                    <input maxLength={180} placeholder="Chủ chuỗi cafe..." value={form.authorRole ?? ''} onChange={(e) => patchForm('authorRole', e.target.value || null)} />
                  </label>
                </div>
              </div>

              <div className="form-row-2col">
                <div className="form-row">
                  <label>Công ty
                    <input maxLength={180} value={form.company ?? ''} onChange={(e) => patchForm('company', e.target.value || null)} />
                  </label>
                </div>
                <div className="form-row">
                  <label>Thứ tự
                    <input type="number" min={0} value={form.sortOrder} onChange={(e) => patchForm('sortOrder', Number(e.target.value))} />
                  </label>
                </div>
              </div>

              <div className="form-row">
                <label className="form-label">Đánh giá sao</label>
                <StarPicker value={form.rating} onChange={(v) => patchForm('rating', v)} />
              </div>

              <ToggleSwitch
                checked={form.isEnabled}
                onChange={(next) => patchForm('isEnabled', next)}
                label="Hiển thị trên website"
                hint="Tắt để ẩn khỏi trang chủ"
              />
            </div>

            <div className="modal-foot">
              <button type="button" className="btn-secondary" onClick={close} disabled={isSaving}>Hủy</button>
              <button type="submit" className="btn-primary" disabled={isSaving || !form.authorName || !form.quote}>
                {isSaving ? 'Đang lưu...' : 'Lưu đánh giá'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
