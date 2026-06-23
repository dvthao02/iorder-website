import type { OfferingResponse, OfferingInput, OfferingContent } from '@iorder/contracts'
import { useEffect, useState } from 'react'
import {
  archiveOffering,
  createOffering,
  deleteOffering,
  listOfferings,
  publishOffering,
  updateOffering,
} from './api'

const TYPES = [
  { key: 'software', label: 'Phần mềm' },
  { key: 'solution', label: 'Giải pháp' },
  { key: 'service', label: 'Dịch vụ' },
  { key: 'industry', label: 'Ngành hàng' },
] as const

type OfferingType = typeof TYPES[number]['key']

const STATUS_LABELS: Record<string, string> = {
  draft: 'Nháp',
  published: 'Đã đăng',
  archived: 'Đã ẩn',
}

const emptyContent = (): OfferingContent => ({
  description: '',
  tags: [],
  bestFor: null,
  keyValue: null,
  metrics: [],
  features: [],
  benefits: [],
  faq: [],
  items: [],
  category: null,
})

const emptyInput = (type: OfferingType): OfferingInput => ({
  type,
  title: '',
  slug: '',
  summary: null,
  icon: null,
  coverMediaId: null,
  sortOrder: 0,
  isFeatured: false,
  seoTitle: null,
  seoDescription: null,
  canonicalUrl: null,
  contentJson: emptyContent(),
})

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function OfferingForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: OfferingInput
  onSave: (input: OfferingInput) => Promise<void>
  onCancel: () => void
}) {
  const [form, setForm] = useState<OfferingInput>(initial)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (patch: Partial<OfferingInput>) => setForm((f) => ({ ...f, ...patch }))
  const setContent = (patch: Partial<OfferingContent>) =>
    setForm((f) => ({ ...f, contentJson: { ...f.contentJson, ...patch } }))

  const handleTitle = (title: string) => {
    set({ title, slug: form.slug || slugify(title) })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await onSave(form)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi không xác định')
    } finally {
      setSaving(false)
    }
  }

  const tagsStr = form.contentJson.tags.join(', ')
  const metricsStr = form.contentJson.metrics.join('\n')
  const featuresStr = form.contentJson.features.join('\n')
  const benefitsStr = form.contentJson.benefits.join('\n')
  const faqStr = form.contentJson.faq.map(([q, a]) => `Q: ${q}\nA: ${a}`).join('\n\n')

  return (
    <form className="admin-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <label>Tiêu đề *</label>
        <input value={form.title} onChange={(e) => handleTitle(e.target.value)} required maxLength={220} />
      </div>
      <div className="form-row">
        <label>Slug *</label>
        <input value={form.slug} onChange={(e) => set({ slug: e.target.value })} required maxLength={180} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" />
      </div>
      <div className="form-row">
        <label>Mô tả ngắn (summary)</label>
        <textarea rows={2} value={form.summary ?? ''} onChange={(e) => set({ summary: e.target.value || null })} maxLength={600} />
      </div>
      <div className="form-row form-row-2col">
        <div>
          <label>Icon key</label>
          <input value={form.icon ?? ''} onChange={(e) => set({ icon: e.target.value || null })} placeholder="receipt, users, server..." />
        </div>
        <div>
          <label>Thứ tự</label>
          <input type="number" value={form.sortOrder} onChange={(e) => set({ sortOrder: Number(e.target.value) })} min={0} />
        </div>
      </div>
      <div className="form-row">
        <label>
          <input type="checkbox" checked={form.isFeatured} onChange={(e) => set({ isFeatured: e.target.checked })} />
          {' '}Nổi bật
        </label>
      </div>

      <hr className="form-divider" />
      <p className="form-section-label">Nội dung chi tiết</p>

      <div className="form-row">
        <label>Mô tả (description) *</label>
        <textarea rows={3} value={form.contentJson.description} onChange={(e) => setContent({ description: e.target.value })} required maxLength={1000} />
      </div>
      <div className="form-row form-row-2col">
        <div>
          <label>Phù hợp với (bestFor)</label>
          <input value={form.contentJson.bestFor ?? ''} onChange={(e) => setContent({ bestFor: e.target.value || null })} maxLength={300} />
        </div>
        <div>
          <label>Giá trị cốt lõi (keyValue)</label>
          <input value={form.contentJson.keyValue ?? ''} onChange={(e) => setContent({ keyValue: e.target.value || null })} maxLength={300} />
        </div>
      </div>
      <div className="form-row">
        <label>Tags (phân cách bằng dấu phẩy)</label>
        <input value={tagsStr} onChange={(e) => setContent({ tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean) })} placeholder="POS, Bán hàng, Báo cáo" />
      </div>
      <div className="form-row">
        <label>Số liệu nhanh (metrics) — mỗi dòng một mục</label>
        <textarea rows={3} value={metricsStr} onChange={(e) => setContent({ metrics: e.target.value.split('\n').map((t) => t.trim()).filter(Boolean) })} placeholder="Tạo đơn ít bước&#10;Thanh toán linh hoạt" />
      </div>
      <div className="form-row">
        <label>Tính năng (features) — mỗi dòng một tính năng</label>
        <textarea rows={6} value={featuresStr} onChange={(e) => setContent({ features: e.target.value.split('\n').map((t) => t.trim()).filter(Boolean) })} placeholder="Bán hàng tại quầy&#10;In hóa đơn..." />
      </div>
      <div className="form-row">
        <label>Lợi ích (benefits) — mỗi dòng một mục</label>
        <textarea rows={4} value={benefitsStr} onChange={(e) => setContent({ benefits: e.target.value.split('\n').map((t) => t.trim()).filter(Boolean) })} placeholder="Giảm thời gian đào tạo&#10;Hạn chế sai sót..." />
      </div>
      <div className="form-row">
        <label>FAQ — định dạng: Q: câu hỏi / A: trả lời (cách nhau dòng trống)</label>
        <textarea rows={8} value={faqStr} onChange={(e) => {
          const blocks = e.target.value.split(/\n\s*\n/).filter(Boolean)
          const pairs: [string, string][] = blocks.flatMap((block) => {
            const lines = block.split('\n')
            const q = lines.find((l) => l.startsWith('Q: '))?.replace('Q: ', '') ?? ''
            const a = lines.find((l) => l.startsWith('A: '))?.replace('A: ', '') ?? ''
            return q ? [[q, a] as [string, string]] : []
          })
          setContent({ faq: pairs })
        }} placeholder="Q: Câu hỏi 1&#10;A: Trả lời 1&#10;&#10;Q: Câu hỏi 2&#10;A: Trả lời 2" />
      </div>

      <hr className="form-divider" />
      <p className="form-section-label">SEO</p>
      <div className="form-row">
        <label>SEO title (tối đa 70 ký tự)</label>
        <input value={form.seoTitle ?? ''} onChange={(e) => set({ seoTitle: e.target.value || null })} maxLength={70} />
      </div>
      <div className="form-row">
        <label>SEO description (tối đa 180 ký tự)</label>
        <textarea rows={2} value={form.seoDescription ?? ''} onChange={(e) => set({ seoDescription: e.target.value || null })} maxLength={180} />
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="form-actions">
        <button type="button" onClick={onCancel} disabled={saving}>Hủy</button>
        <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu nháp'}</button>
      </div>
    </form>
  )
}

function OfferingRow({
  offering,
  onEdit,
  onPublish,
  onArchive,
  onDelete,
}: {
  offering: OfferingResponse
  onEdit: () => void
  onPublish: () => Promise<void>
  onArchive: () => Promise<void>
  onDelete: () => Promise<void>
}) {
  const [busy, setBusy] = useState(false)
  const act = async (fn: () => Promise<void>) => { setBusy(true); try { await fn() } finally { setBusy(false) } }

  return (
    <div className="offering-row">
      <div className="offering-row-info">
        <strong>{offering.title}</strong>
        <small>/{offering.slug} · <span className={`status-badge status-${offering.status}`}>{STATUS_LABELS[offering.status]}</span></small>
      </div>
      <div className="offering-row-actions">
        <button type="button" onClick={onEdit} disabled={busy}>Sửa</button>
        {offering.status !== 'published' && (
          <button type="button" className="btn-primary" onClick={() => void act(onPublish)} disabled={busy}>Đăng</button>
        )}
        {offering.status === 'published' && (
          <button type="button" onClick={() => void act(onArchive)} disabled={busy}>Ẩn</button>
        )}
        <button type="button" className="btn-danger" onClick={() => void act(onDelete)} disabled={busy}>Xóa</button>
      </div>
    </div>
  )
}

export function OfferingsManager({ onBack }: { onBack: () => void }) {
  const [activeType, setActiveType] = useState<OfferingType>('software')
  const [items, setItems] = useState<OfferingResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState<OfferingResponse | null | 'new'>(null)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await listOfferings(activeType)
      setItems(res.items)
    } catch {
      setError('Không tải được danh sách. Kiểm tra kết nối API.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [activeType])

  const handleSave = async (input: OfferingInput) => {
    if (editing === 'new') {
      await createOffering(input)
    } else if (editing) {
      await updateOffering(editing.id, input)
    }
    setEditing(null)
    await load()
  }

  const handlePublish = async (id: string) => {
    await publishOffering(id)
    await load()
  }

  const handleArchive = async (id: string) => {
    if (!confirm('Ẩn nội dung này khỏi website?')) return
    await archiveOffering(id)
    await load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa vĩnh viễn? Hành động này không thể hoàn tác.')) return
    await deleteOffering(id)
    await load()
  }

  if (editing !== null) {
    const initial = editing === 'new'
      ? emptyInput(activeType)
      : { ...editing, contentJson: editing.contentJson as OfferingContent }
    return (
      <div className="admin-module">
        <div className="module-header">
          <button type="button" onClick={() => setEditing(null)}>← Quay lại</button>
          <h2>{editing === 'new' ? 'Thêm mới' : 'Chỉnh sửa'} — {TYPES.find((t) => t.key === activeType)?.label}</h2>
        </div>
        <OfferingForm initial={initial} onSave={handleSave} onCancel={() => setEditing(null)} />
      </div>
    )
  }

  return (
    <div className="admin-module">
      <div className="module-header">
        <button type="button" onClick={onBack}>← Tổng quan</button>
        <h2>Phần mềm & Giải pháp</h2>
        <button type="button" className="btn-primary" onClick={() => setEditing('new')}>+ Thêm mới</button>
      </div>

      <div className="tab-nav">
        {TYPES.map((t) => (
          <button
            key={t.key}
            type="button"
            className={activeType === t.key ? 'is-active' : ''}
            onClick={() => setActiveType(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && <p className="admin-info">Đang tải...</p>}
      {error && <p className="form-error">{error}</p>}

      {!loading && items.length === 0 && (
        <p className="admin-info">Chưa có nội dung nào. Nhấn "+ Thêm mới" để bắt đầu.</p>
      )}

      {items.map((item) => (
        <OfferingRow
          key={item.id}
          offering={item}
          onEdit={() => setEditing(item)}
          onPublish={async () => handlePublish(item.id)}
          onArchive={async () => handleArchive(item.id)}
          onDelete={async () => handleDelete(item.id)}
        />
      ))}
    </div>
  )
}
