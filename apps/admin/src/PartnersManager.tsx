import type { MediaAsset, PartnerInput, PartnerResponse } from '@iorder/contracts'
import { useEffect, useState } from 'react'

import { createPartner, deletePartner, listMedia, listPartners, updatePartner } from './api'

interface PartnersManagerProps {
  onBack: () => void
}

const emptyPartner: PartnerInput = {
  name: '',
  description: null,
  websiteUrl: null,
  logoMediaId: null,
  sortOrder: 0,
  isEnabled: true,
}

function toInput(partner: PartnerResponse): PartnerInput {
  return {
    name: partner.name,
    description: partner.description,
    websiteUrl: partner.websiteUrl,
    logoMediaId: partner.logoMediaId,
    sortOrder: partner.sortOrder,
    isEnabled: partner.isEnabled,
  }
}

export function PartnersManager({ onBack }: PartnersManagerProps) {
  const [items, setItems] = useState<PartnerResponse[]>([])
  const [images, setImages] = useState<MediaAsset[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [form, setForm] = useState<PartnerInput>(emptyPartner)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')

  const loadData = async () => {
    const [partnerResult, mediaResult] = await Promise.all([listPartners(), listMedia('image')])
    setItems(partnerResult.items)
    setImages(mediaResult.items)
  }

  useEffect(() => {
    void loadData().catch(() => setMessage('Không thể tải danh sách đối tác.'))
  }, [])

  const patchForm = <Key extends keyof PartnerInput>(key: Key, value: PartnerInput[Key]) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const selectPartner = (partner: PartnerResponse) => {
    setSelectedId(partner.id)
    setForm(toInput(partner))
    setMessage('')
  }

  const newPartner = () => {
    setSelectedId(null)
    setForm({ ...emptyPartner, sortOrder: items.length })
    setMessage('')
  }

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSaving(true)
    setMessage('')
    try {
      const result = selectedId ? await updatePartner(selectedId, form) : await createPartner(form)
      setSelectedId(result.item.id)
      setForm(toInput(result.item))
      await loadData()
      setMessage('Đã lưu đối tác.')
    } catch (error) {
      const code = error instanceof Error ? error.message : ''
      setMessage(code === 'NAME_EXISTS' ? 'Tên đối tác đã tồn tại.' : 'Không thể lưu đối tác.')
    } finally {
      setIsSaving(false)
    }
  }

  const remove = async () => {
    if (!selectedId) return
    if (!window.confirm('Xóa đối tác này khỏi danh sách?')) return
    setIsSaving(true)
    try {
      await deletePartner(selectedId)
      setSelectedId(null)
      setForm(emptyPartner)
      await loadData()
      setMessage('Đã xóa đối tác.')
    } catch {
      setMessage('Không thể xóa đối tác.')
    } finally {
      setIsSaving(false)
    }
  }

  const logoUrl = (id: string | null) => images.find((image) => image.id === id)?.publicUrl ?? null
  const currentLogo = logoUrl(form.logoMediaId)

  return (
    <section className="admin-card content-manager">
      <button className="text-button" type="button" onClick={onBack}>← Tổng quan</button>
      <p className="admin-kicker">Nội dung website</p>
      <div className="manager-heading">
        <div>
          <h1>Đối tác &amp; Khách hàng</h1>
          <p>Quản lý logo đối tác hiển thị trên website. Tải logo trong "Ảnh &amp; tài liệu" trước khi chọn.</p>
        </div>
        <button className="secondary-button" type="button" onClick={newPartner}>+ Đối tác mới</button>
      </div>

      <div className="content-manager-grid">
        <aside className="post-list" aria-label="Danh sách đối tác">
          {items.length === 0 ? <p>Chưa có đối tác nào.</p> : null}
          {items.map((partner) => (
            <button className={partner.id === selectedId ? 'is-active' : ''} key={partner.id} type="button" onClick={() => selectPartner(partner)}>
              <strong>{partner.name}</strong>
              <span>{partner.isEnabled ? 'Đang hiển thị' : 'Đã ẩn'} · #{partner.sortOrder}</span>
            </button>
          ))}
        </aside>

        <form className="post-form" onSubmit={save}>
          <label>
            Tên đối tác
            <input required maxLength={180} value={form.name} onChange={(event) => patchForm('name', event.target.value)} />
          </label>
          <div className="form-row">
            <label>
              Logo
              <select value={form.logoMediaId ?? ''} onChange={(event) => patchForm('logoMediaId', event.target.value || null)}>
                <option value="">Không chọn</option>
                {images.map((image) => <option key={image.id} value={image.id}>{image.originalName}</option>)}
              </select>
            </label>
            <label>
              Thứ tự hiển thị
              <input type="number" min={0} max={9999} value={form.sortOrder} onChange={(event) => patchForm('sortOrder', Number(event.target.value))} />
            </label>
          </div>
          {currentLogo ? (
            <div className="partner-logo-preview">
              <img src={currentLogo} alt={form.name || 'Logo đối tác'} />
            </div>
          ) : null}
          <label>
            Website
            <input type="url" placeholder="https://..." value={form.websiteUrl ?? ''} onChange={(event) => patchForm('websiteUrl', event.target.value || null)} />
          </label>
          <label>
            Mô tả ngắn
            <textarea maxLength={2000} rows={3} value={form.description ?? ''} onChange={(event) => patchForm('description', event.target.value || null)} />
          </label>
          <label className="inline-check">
            <input type="checkbox" checked={form.isEnabled} onChange={(event) => patchForm('isEnabled', event.target.checked)} /> Hiển thị trên website
          </label>
          {message ? <p role="status">{message}</p> : null}
          <div className="post-actions">
            <button disabled={isSaving || !form.name} type="submit">{isSaving ? 'Đang lưu...' : 'Lưu đối tác'}</button>
            {selectedId ? <button className="secondary-button" disabled={isSaving} type="button" onClick={() => void remove()}>Xóa</button> : null}
          </div>
        </form>
      </div>
    </section>
  )
}
