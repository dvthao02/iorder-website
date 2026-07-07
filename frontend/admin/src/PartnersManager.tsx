import type { MediaAsset, PartnerInput, PartnerKind, PartnerResponse } from '@iorder/contracts'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { createPartner, deletePartner, listMedia, listPartners, updatePartner } from './api'
import { toast } from './toast'
import { ImagePicker, ModalShell, PageHeader, StatusDot, ToggleSwitch, useEscapeAndSave } from './ui'

const emptyPartner: PartnerInput = {
  name: '',
  kind: 'partner',
  description: null,
  websiteUrl: null,
  logoMediaId: null,
  sortOrder: 0,
  isEnabled: true,
}

const KIND_LABEL: Record<PartnerKind, string> = { partner: 'Đối tác', customer: 'Khách hàng' }

type StatusFilter = 'all' | 'enabled' | 'disabled'
type KindFilter = 'all' | PartnerKind

function validatePartner(form: PartnerInput): string | null {
  if (form.name.trim().length < 2) return 'Tên đối tác phải có ít nhất 2 ký tự.'
  const website = (form.websiteUrl ?? '').trim()
  if (website && !/^https?:\/\/.+/.test(website))
    return 'Website phải là URL hợp lệ, bắt đầu bằng http:// hoặc https://.'
  return null
}

function toInput(partner: PartnerResponse): PartnerInput {
  return {
    name: partner.name,
    kind: partner.kind,
    description: partner.description,
    websiteUrl: partner.websiteUrl,
    logoMediaId: partner.logoMediaId,
    sortOrder: partner.sortOrder,
    isEnabled: partner.isEnabled,
  }
}

export function PartnersManager() {
  const [items, setItems] = useState<PartnerResponse[]>([])
  const [images, setImages] = useState<MediaAsset[]>([])

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [kindFilter, setKindFilter] = useState<KindFilter>('all')

  const [editorOpen, setEditorOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<PartnerInput>(emptyPartner)
  const [isSaving, setIsSaving] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  const [dragId, setDragId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    const [partnerResult, mediaResult] = await Promise.all([listPartners(), listMedia('image')])
    setItems(partnerResult.items)
    setImages(mediaResult.items)
  }

  useEffect(() => {
    void loadData()
      .catch(() => toast.error('Không thể tải danh sách đối tác.'))
      .finally(() => setLoading(false))
  }, [])

  useEscapeAndSave({
    active: editorOpen,
    onSave: () => formRef.current?.requestSubmit(),
    onEscape: () => closeEditor(),
  })

  const logoUrl = (id: string | null) => images.find((image) => image.id === id)?.publicUrl ?? null

  const patchForm = <Key extends keyof PartnerInput>(key: Key, value: PartnerInput[Key]) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const openCreate = () => {
    setEditingId(null)
    setForm({ ...emptyPartner, sortOrder: items.length })
    setEditorOpen(true)
  }

  const openEdit = (partner: PartnerResponse) => {
    setEditingId(partner.id)
    setForm(toInput(partner))
    setEditorOpen(true)
  }

  const closeEditor = () => {
    setEditorOpen(false)
  }

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const validationError = validatePartner(form)
    if (validationError) {
      toast.error(validationError)
      return
    }
    setIsSaving(true)
    try {
      if (editingId) await updatePartner(editingId, form)
      else await createPartner(form)
      await loadData()
      setEditorOpen(false)
      toast.success(editingId ? 'Đã cập nhật đối tác.' : 'Đã thêm đối tác.')
    } catch (error) {
      const code = error instanceof Error ? error.message : ''
      toast.error(code === 'NAME_EXISTS' ? 'Tên đã tồn tại.' : 'Không thể lưu.')
    } finally {
      setIsSaving(false)
    }
  }

  const toggleEnabled = async (partner: PartnerResponse) => {
    try {
      await updatePartner(partner.id, { ...toInput(partner), isEnabled: !partner.isEnabled })
      await loadData()
      toast[partner.isEnabled ? 'warning' : 'success'](partner.isEnabled ? 'Đã ẩn đối tác.' : 'Đã hiển thị đối tác.')
    } catch {
      toast.error('Không thể đổi trạng thái.')
    }
  }

  const remove = async (partner: PartnerResponse) => {
    try {
      await deletePartner(partner.id)
      await loadData()
      toast.warning('Đã xóa đối tác.')
    } catch {
      toast.error('Không thể xóa.')
    }
  }

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return items.filter((partner) => {
      if (statusFilter === 'enabled' && !partner.isEnabled) return false
      if (statusFilter === 'disabled' && partner.isEnabled) return false
      if (kindFilter !== 'all' && partner.kind !== kindFilter) return false
      if (
        query &&
        !partner.name.toLowerCase().includes(query) &&
        !(partner.websiteUrl ?? '').toLowerCase().includes(query)
      )
        return false
      return true
    })
  }, [items, search, statusFilter, kindFilter])

  // Chỉ cho kéo-thả khi đang xem toàn bộ (không lọc/tìm) để thứ tự không bị nhập nhằng.
  const isReorderable = !search.trim() && statusFilter === 'all' && kindFilter === 'all'

  const persistOrder = async (ordered: PartnerResponse[]) => {
    const changed = ordered
      .map((partner, index) => ({ partner, index }))
      .filter(({ partner, index }) => partner.sortOrder !== index)
    setItems(ordered.map((partner, index) => ({ ...partner, sortOrder: index })))
    try {
      await Promise.all(
        changed.map(({ partner, index }) => updatePartner(partner.id, { ...toInput(partner), sortOrder: index })),
      )
      await loadData()
    } catch {
      toast.error('Không thể lưu thứ tự.')
      await loadData()
    }
  }

  const onDrop = (targetId: string) => {
    if (!dragId || dragId === targetId) return
    const ordered = [...items].sort((a, b) => a.sortOrder - b.sortOrder)
    const from = ordered.findIndex((p) => p.id === dragId)
    const to = ordered.findIndex((p) => p.id === targetId)
    if (from === -1 || to === -1) return
    const [moved] = ordered.splice(from, 1)
    if (!moved) return
    ordered.splice(to, 0, moved)
    setDragId(null)
    void persistOrder(ordered)
  }

  const enabledPreview = useMemo(
    () => items.filter((p) => p.isEnabled).sort((a, b) => a.sortOrder - b.sortOrder),
    [items],
  )

  return (
    <section className="admin-card content-manager">
      <PageHeader
        title={<>Đối tác &amp; Khách hàng</>}
        description={
          <>
            Quản lý logo đối tác/khách hàng hiển thị trên website. Tải logo trong "Ảnh &amp; tài liệu" trước khi chọn.
          </>
        }
        actions={
          <button className="btn-primary btn-icon" type="button" onClick={openCreate}>
            <Plus size={16} /> Thêm đối tác
          </button>
        }
      />

      <div className="toolbar">
        <input
          className="toolbar-search"
          type="search"
          placeholder="Tìm theo tên hoặc website…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}>
          <option value="all">Mọi trạng thái</option>
          <option value="enabled">Đang hiển thị</option>
          <option value="disabled">Đã ẩn</option>
        </select>
        <select value={kindFilter} onChange={(event) => setKindFilter(event.target.value as KindFilter)}>
          <option value="all">Mọi loại</option>
          <option value="partner">Đối tác</option>
          <option value="customer">Khách hàng</option>
        </select>
      </div>

      {loading && <p className="admin-info">Đang tải...</p>}

      {!loading && items.length === 0 && (
        <div className="admin-empty">
          <Plus size={36} />
          <p>Chưa có đối tác nào.</p>
          <button type="button" className="btn-primary btn-icon" onClick={openCreate}>
            <Plus size={15} /> Thêm đối tác đầu tiên
          </button>
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="data-table-wrap">
          <table className="data-table partner-table">
            <thead>
              <tr>
                <th className="col-grip" aria-label="Kéo thả" />
                <th className="col-stt">STT</th>
                <th>Logo</th>
                <th>Tên</th>
                <th>Loại</th>
                <th>Website</th>
                <th>Trạng thái</th>
                <th className="col-order">Thứ tự</th>
                <th className="col-actions">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="table-empty">
                    Không có đối tác nào khớp.
                  </td>
                </tr>
              ) : null}
              {filtered.map((partner, index) => {
                const thumb = logoUrl(partner.logoMediaId)
                return (
                  <tr
                    key={partner.id}
                    className={dragId === partner.id ? 'is-dragging' : ''}
                    draggable={isReorderable}
                    onDragStart={() => isReorderable && setDragId(partner.id)}
                    onDragOver={(event) => {
                      if (isReorderable) event.preventDefault()
                    }}
                    onDrop={() => isReorderable && onDrop(partner.id)}
                    onDragEnd={() => setDragId(null)}
                  >
                    <td className="col-grip">
                      {isReorderable ? (
                        <span className="drag-grip" title="Kéo để sắp xếp" aria-hidden="true">
                          ⠿
                        </span>
                      ) : null}
                    </td>
                    <td className="col-stt">{index + 1}</td>
                    <td>
                      <span className="cell-logo">
                        {thumb ? (
                          <img src={thumb} alt="" />
                        ) : (
                          <span className="cell-logo-fallback">{partner.name.charAt(0).toUpperCase() || '?'}</span>
                        )}
                      </span>
                    </td>
                    <td>
                      <strong>{partner.name}</strong>
                    </td>
                    <td>
                      <span className={`kind-badge kind-${partner.kind}`}>{KIND_LABEL[partner.kind]}</span>
                    </td>
                    <td className="cell-website">
                      {partner.websiteUrl ? (
                        <a href={partner.websiteUrl} target="_blank" rel="noreferrer">
                          {partner.websiteUrl.replace(/^https?:\/\//, '')}
                        </a>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="status-pill"
                        onClick={() => void toggleEnabled(partner)}
                        title="Bấm để bật/tắt"
                      >
                        <StatusDot tone={partner.isEnabled ? 'on' : 'muted'} />
                        {partner.isEnabled ? 'Đang hiển thị' : 'Đã ẩn'}
                      </button>
                    </td>
                    <td className="col-order">#{partner.sortOrder}</td>
                    <td className="col-actions">
                      <button
                        type="button"
                        className="row-action icon-only"
                        title="Sửa"
                        aria-label={`Sửa ${partner.name}`}
                        onClick={() => openEdit(partner)}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        className="row-action icon-only is-danger"
                        title="Xóa"
                        aria-label={`Xóa ${partner.name}`}
                        onClick={() => void remove(partner)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      {!loading && items.length > 0 && (
        <p className="table-hint">
          {isReorderable
            ? 'Kéo thả các hàng để sắp xếp thứ tự hiển thị.'
            : 'Bỏ tìm kiếm/bộ lọc để bật kéo-thả sắp xếp.'}
        </p>
      )}

      <div className="preview-panel">
        <div className="preview-head">
          <h2>Xem trước hiển thị trên website</h2>
          <span className="muted">{enabledPreview.length} mục đang hiển thị</span>
        </div>
        {enabledPreview.length === 0 ? (
          <p className="muted">Chưa có mục nào đang hiển thị.</p>
        ) : (
          <div className="preview-strip">
            {enabledPreview.map((partner) => {
              const thumb = logoUrl(partner.logoMediaId)
              return (
                <span className="preview-logo" key={partner.id} title={`${partner.name} · ${KIND_LABEL[partner.kind]}`}>
                  {thumb ? (
                    <img src={thumb} alt={partner.name} />
                  ) : (
                    <span className="preview-logo-text">{partner.name}</span>
                  )}
                </span>
              )
            })}
          </div>
        )}
      </div>

      {editorOpen ? (
        <ModalShell
          as="form"
          formRef={formRef}
          onSubmit={save}
          onOverlayClick={closeEditor}
          header={
            <>
              <button type="button" className="modal-back" onClick={closeEditor}>
                ← Trở về
              </button>
              <h2>{editingId ? 'Sửa đối tác' : 'Thêm đối tác'}</h2>
            </>
          }
          footer={
            <>
              <button type="button" className="secondary-button" onClick={closeEditor}>
                Hủy
              </button>
              <button
                className="btn-primary"
                disabled={isSaving || Boolean(validatePartner(form))}
                title={validatePartner(form) ?? undefined}
                type="submit"
              >
                {isSaving ? 'Đang lưu...' : 'Lưu'}
              </button>
            </>
          }
        >
          <div className="form-row-2col">
            <label>
              Tên đối tác
              <input
                required
                maxLength={180}
                value={form.name}
                onChange={(event) => patchForm('name', event.target.value)}
              />
            </label>
            <label>
              Loại
              <select value={form.kind} onChange={(event) => patchForm('kind', event.target.value as PartnerKind)}>
                <option value="partner">Đối tác</option>
                <option value="customer">Khách hàng</option>
              </select>
            </label>
          </div>

          <ImagePicker
            label="Logo"
            ariaLabel="Chọn logo"
            images={images}
            value={form.logoMediaId}
            onChange={(id) => patchForm('logoMediaId', id)}
            onUploaded={(asset) => setImages((prev) => [asset, ...prev])}
          />

          <div className="form-row-2col">
            <label>
              Website
              <input
                type="url"
                placeholder="https://..."
                value={form.websiteUrl ?? ''}
                onChange={(event) => patchForm('websiteUrl', event.target.value || null)}
              />
            </label>
            <label>
              Thứ tự hiển thị
              <input
                type="number"
                min={0}
                max={9999}
                value={form.sortOrder}
                onChange={(event) => patchForm('sortOrder', Number(event.target.value))}
              />
            </label>
          </div>

          <label>
            Mô tả ngắn
            <textarea
              maxLength={2000}
              rows={3}
              value={form.description ?? ''}
              onChange={(event) => patchForm('description', event.target.value || null)}
            />
          </label>

          <ToggleSwitch
            checked={form.isEnabled}
            onChange={(next) => patchForm('isEnabled', next)}
            label="Hiển thị trên website"
            hint="Tắt để ẩn khỏi trang công khai"
          />
        </ModalShell>
      ) : null}
    </section>
  )
}
