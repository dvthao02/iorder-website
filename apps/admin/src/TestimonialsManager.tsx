import type { MediaAsset, TestimonialInput, TestimonialResponse } from '@iorder/contracts'
import { useEffect, useState } from 'react'

import { createTestimonial, deleteTestimonial, listMedia, listTestimonials, updateTestimonial } from './api'
import { toast } from './toast'
import { PageHeader, StatusDot, ToggleSwitch } from './ui'

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

export function TestimonialsManager() {
  const [items, setItems] = useState<TestimonialResponse[]>([])
  const [images, setImages] = useState<MediaAsset[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [form, setForm] = useState<TestimonialInput>(emptyTestimonial)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')

  const loadData = async () => {
    const [result, mediaResult] = await Promise.all([listTestimonials(), listMedia('image')])
    setItems(result.items)
    setImages(mediaResult.items)
  }

  useEffect(() => {
    void loadData().catch(() => setMessage('Không thể tải danh sách đánh giá.'))
  }, [])

  const patchForm = <Key extends keyof TestimonialInput>(key: Key, value: TestimonialInput[Key]) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const selectItem = (item: TestimonialResponse) => {
    setSelectedId(item.id)
    setForm(toInput(item))
    setMessage('')
  }

  const newItem = () => {
    setSelectedId(null)
    setForm({ ...emptyTestimonial, sortOrder: items.length })
    setMessage('')
  }

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSaving(true)
    setMessage('')
    try {
      const result = selectedId ? await updateTestimonial(selectedId, form) : await createTestimonial(form)
      setSelectedId(result.item.id)
      setForm(toInput(result.item))
      await loadData()
      toast.success('Đã lưu đánh giá.')
    } catch {
      toast.error('Không thể lưu đánh giá.')
    } finally {
      setIsSaving(false)
    }
  }

  const remove = async () => {
    if (!selectedId) return
    if (!window.confirm('Xóa đánh giá này?')) return
    setIsSaving(true)
    try {
      await deleteTestimonial(selectedId)
      setSelectedId(null)
      setForm(emptyTestimonial)
      await loadData()
      toast.success('Đã xóa đánh giá.')
    } catch {
      toast.error('Không thể xóa đánh giá.')
    } finally {
      setIsSaving(false)
    }
  }

  const avatarUrl = images.find((image) => image.id === form.avatarMediaId)?.publicUrl ?? null

  return (
    <section className="admin-card content-manager">
      <PageHeader
        title="Đánh giá khách hàng"
        description={'Lời chứng thực hiển thị ở mục "Khách hàng nói gì" trên trang chủ.'}
        actions={<button className="secondary-button" type="button" onClick={newItem}>+ Đánh giá mới</button>}
      />

      <div className="content-manager-grid">
        <aside className="post-list" aria-label="Danh sách đánh giá">
          {items.length === 0 ? <p>Chưa có đánh giá nào.</p> : null}
          {items.map((item) => (
            <button className={item.id === selectedId ? 'is-active' : ''} key={item.id} type="button" onClick={() => selectItem(item)}>
              <strong>{item.authorName}</strong>
              <span><StatusDot tone={item.isEnabled ? 'on' : 'muted'} />{item.company ?? item.authorRole ?? '—'} · {item.isEnabled ? 'Hiển thị' : 'Ẩn'}</span>
            </button>
          ))}
        </aside>

        <form className="post-form" onSubmit={save}>
          <label>
            Nội dung đánh giá
            <textarea required maxLength={2000} rows={4} value={form.quote} onChange={(event) => patchForm('quote', event.target.value)} />
          </label>
          <div className="form-row">
            <label>
              Tên khách hàng
              <input required maxLength={180} value={form.authorName} onChange={(event) => patchForm('authorName', event.target.value)} />
            </label>
            <label>
              Chức vụ
              <input maxLength={180} placeholder="Ví dụ: Chủ chuỗi cafe" value={form.authorRole ?? ''} onChange={(event) => patchForm('authorRole', event.target.value || null)} />
            </label>
          </div>
          <div className="form-row">
            <label>
              Công ty
              <input maxLength={180} value={form.company ?? ''} onChange={(event) => patchForm('company', event.target.value || null)} />
            </label>
            <label>
              Đánh giá sao (1-5)
              <select value={form.rating ?? ''} onChange={(event) => patchForm('rating', event.target.value ? Number(event.target.value) : null)}>
                <option value="">Không chọn</option>
                {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} sao</option>)}
              </select>
            </label>
          </div>
          <div className="form-row">
            <label>
              Ảnh đại diện
              <select value={form.avatarMediaId ?? ''} onChange={(event) => patchForm('avatarMediaId', event.target.value || null)}>
                <option value="">Không chọn</option>
                {images.map((image) => <option key={image.id} value={image.id}>{image.originalName}</option>)}
              </select>
            </label>
            <label>
              Thứ tự hiển thị
              <input type="number" min={0} max={9999} value={form.sortOrder} onChange={(event) => patchForm('sortOrder', Number(event.target.value))} />
            </label>
          </div>
          {avatarUrl ? <div className="partner-logo-preview"><img src={avatarUrl} alt={form.authorName || 'Ảnh đại diện'} /></div> : null}
          <ToggleSwitch
            checked={form.isEnabled}
            onChange={(next) => patchForm('isEnabled', next)}
            label="Hiển thị trên website"
            hint="Tắt để ẩn đánh giá khỏi trang chủ"
          />
          {message ? <p role="status">{message}</p> : null}
          <div className="post-actions">
            <button disabled={isSaving || !form.authorName || !form.quote} type="submit">{isSaving ? 'Đang lưu...' : 'Lưu đánh giá'}</button>
            {selectedId ? <button className="secondary-button" disabled={isSaving} type="button" onClick={() => void remove()}>Xóa</button> : null}
          </div>
        </form>
      </div>
    </section>
  )
}
