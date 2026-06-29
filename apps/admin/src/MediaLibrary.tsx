import type { MediaAsset, MediaKind, MediaUsage } from '@iorder/contracts'
import { Copy, ExternalLink, MapPin, Pencil, Plus, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { deleteMedia, getMediaUsage, listMedia, updateMedia, uploadMedia } from './api'
import { toast } from './toast'
import { PageHeader } from './ui'

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

type KindFilter = 'all' | MediaKind

export function MediaLibrary() {
  const [items, setItems] = useState<MediaAsset[]>([])
  const [kind, setKind] = useState<KindFilter>('all')
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const [uploadOpen, setUploadOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [uploadAlt, setUploadAlt] = useState('')
  const [uploadCaption, setUploadCaption] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  const [editing, setEditing] = useState<MediaAsset | null>(null)
  const [editAlt, setEditAlt] = useState('')
  const [editCaption, setEditCaption] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [editMessage, setEditMessage] = useState('')
  const [usage, setUsage] = useState<MediaUsage[] | null>(null)
  const [copied, setCopied] = useState(false)

  const loadItems = async (selectedKind = kind, query = search) => {
    setIsLoading(true)
    setError('')
    try {
      const response = await listMedia(selectedKind === 'all' ? undefined : selectedKind, query)
      setItems(response.items)
    } catch {
      setError('Không thể tải thư viện.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { void loadItems(kind, search) }, [kind])
  useEffect(() => {
    const timer = window.setTimeout(() => void loadItems(kind, search), 300)
    return () => window.clearTimeout(timer)
  }, [search])

  const handleUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!file) { setUploadError('Vui lòng chọn một file.'); return }
    setIsUploading(true)
    setUploadError('')
    try {
      await uploadMedia(file, { altText: uploadAlt.trim() || null, caption: uploadCaption.trim() || null })
      setFile(null)
      setUploadAlt('')
      setUploadCaption('')
      setUploadOpen(false)
      await loadItems()
      toast.success('Đã tải file lên.')
    } catch (uploadErr) {
      const code = uploadErr instanceof Error ? uploadErr.message : ''
      setUploadError(code === 'FILE_TOO_LARGE' ? 'File vượt quá giới hạn dung lượng (20 MB).' : 'File không hợp lệ hoặc tải lên thất bại.')
    } finally {
      setIsUploading(false)
    }
  }

  const openEdit = (asset: MediaAsset) => {
    setEditing(asset)
    setEditAlt(asset.altText ?? '')
    setEditCaption(asset.caption ?? '')
    setEditMessage('')
    setUsage(null)
    setCopied(false)
  }

  const saveEdit = async () => {
    if (!editing) return
    setIsSaving(true)
    setEditMessage('')
    try {
      const response = await updateMedia(editing.id, { altText: editAlt.trim() || null, caption: editCaption.trim() || null })
      setItems((current) => current.map((item) => item.id === response.item.id ? response.item : item))
      setEditing(response.item)
      toast.success('Đã lưu mô tả.')
    } catch {
      toast.error('Không thể lưu mô tả.')
    } finally {
      setIsSaving(false)
    }
  }

  const loadUsage = async (id: string) => {
    if (usage) { setUsage(null); return }
    try { setUsage((await getMediaUsage(id)).items) }
    catch { setEditMessage('Không thể kiểm tra nơi đang sử dụng.') }
  }

  const handleDelete = async (asset: MediaAsset) => {
    if (!window.confirm(`Xóa "${asset.originalName}" khỏi thư viện? Hành động không thể hoàn tác.`)) return
    setError('')
    try {
      await deleteMedia(asset.id)
      if (editing?.id === asset.id) setEditing(null)
      await loadItems()
      toast.warning('Đã xóa file.')
    } catch (err) {
      const code = err instanceof Error ? err.message : ''
      const text = code === 'MEDIA_IN_USE'
        ? 'Không thể xóa: file đang được sử dụng. Hãy gỡ khỏi các nơi sử dụng trước (xem "Nơi sử dụng").'
        : 'Không thể xóa file.'
      setError(text)
      toast.error(text)
    }
  }

  const copyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch { /* clipboard không khả dụng */ }
  }

  const isImage = (asset: MediaAsset) => asset.mimeType.startsWith('image/')

  const counts = useMemo(() => ({
    image: items.filter(isImage).length,
    document: items.filter((item) => !isImage(item)).length,
  }), [items])

  return (
    <section className="admin-card content-manager">
      <PageHeader
        title="Tài liệu và hình ảnh"
        description="Ảnh JPG, PNG, GIF, WebP; tài liệu PDF, Word, Excel hoặc ZIP. Tối đa 20 MB."
        actions={<button className="btn-primary btn-icon" type="button" onClick={() => { setUploadOpen(true); setUploadError('') }}><Plus size={16} /> Tải lên</button>}
      />

      <div className="toolbar">
        <input className="toolbar-search" type="search" placeholder="Tìm theo tên file…" value={search} onChange={(event) => setSearch(event.target.value)} />
        <select value={kind} onChange={(event) => setKind(event.target.value as KindFilter)}>
          <option value="all">Tất cả ({items.length})</option>
          <option value="image">Hình ảnh ({counts.image})</option>
          <option value="document">Tài liệu ({counts.document})</option>
        </select>
      </div>

      {error ? <p className="form-error" role="alert">{error}</p> : null}

      <div className="data-table-wrap">
        <table className="data-table media-table">
          <thead>
            <tr>
              <th className="col-stt">STT</th>
              <th>Xem trước</th>
              <th>Tên file</th>
              <th>Loại</th>
              <th>Dung lượng</th>
              <th>Mô tả</th>
              <th>Tải lên</th>
              <th className="col-actions">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? <tr><td colSpan={8} className="table-empty">Đang tải thư viện…</td></tr> : null}
            {!isLoading && items.length === 0 ? <tr><td colSpan={8} className="table-empty">Chưa có file nào.</td></tr> : null}
            {items.map((asset, index) => (
              <tr key={asset.id}>
                <td className="col-stt">{index + 1}</td>
                <td>
                  <span className="cell-cover">
                    {isImage(asset) ? <img src={asset.publicUrl} alt={asset.altText ?? asset.originalName} /> : <span className="cell-doc">TÀI LIỆU</span>}
                  </span>
                </td>
                <td>
                  <a className="cell-filename" href={asset.publicUrl} target="_blank" rel="noreferrer">{asset.originalName}</a>
                  {asset.width && asset.height ? <span className="cell-slug">{asset.width}×{asset.height}px</span> : null}
                </td>
                <td><span className={`kind-badge ${isImage(asset) ? 'kind-partner' : 'kind-customer'}`}>{isImage(asset) ? 'Hình ảnh' : 'Tài liệu'}</span></td>
                <td className="cell-date">{formatFileSize(asset.fileSize)}</td>
                <td><span className="cell-desc">{asset.altText || asset.caption || <span className="muted">—</span>}</span></td>
                <td className="cell-date">{formatDate(asset.createdAt)}</td>
                <td className="col-actions">
                  <button type="button" className="row-action icon-only" title="Sửa mô tả" aria-label={`Sửa ${asset.originalName}`} onClick={() => openEdit(asset)}><Pencil size={16} /></button>
                  <button type="button" className="row-action icon-only" title="Copy link" aria-label={`Copy link ${asset.originalName}`} onClick={() => void copyLink(asset.publicUrl)}><Copy size={16} /></button>
                  <a className="row-action icon-only" title="Mở" aria-label={`Mở ${asset.originalName}`} href={asset.publicUrl} target="_blank" rel="noreferrer"><ExternalLink size={16} /></a>
                  <button type="button" className="row-action icon-only is-danger" title="Xóa" aria-label={`Xóa ${asset.originalName}`} onClick={() => void handleDelete(asset)}><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="table-hint">{items.length} file</p>

      {uploadOpen ? (
        <div className="modal-overlay" role="dialog" aria-modal="true" onClick={() => setUploadOpen(false)}>
          <form className="modal-card" onClick={(event) => event.stopPropagation()} onSubmit={handleUpload}>
            <div className="modal-head">
              <h2>Tải file lên</h2>
              <button type="button" className="modal-close" onClick={() => setUploadOpen(false)} aria-label="Đóng">✕</button>
            </div>
            <div className="modal-body">
              <label>
                Chọn file
                <input required accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx,.zip" type="file" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
              </label>
              <label>
                Alt text cho hình ảnh
                <input maxLength={500} value={uploadAlt} onChange={(event) => setUploadAlt(event.target.value)} />
              </label>
              <label>
                Mô tả
                <textarea maxLength={2000} rows={3} value={uploadCaption} onChange={(event) => setUploadCaption(event.target.value)} />
              </label>
              {uploadError ? <p className="form-error" role="alert">{uploadError}</p> : null}
            </div>
            <div className="modal-foot">
              <button type="button" className="secondary-button" onClick={() => setUploadOpen(false)}>Hủy</button>
              <button className="btn-primary" disabled={isUploading} type="submit">{isUploading ? 'Đang tải lên...' : 'Tải lên'}</button>
            </div>
          </form>
        </div>
      ) : null}

      {editing ? (
        <div className="modal-overlay" role="dialog" aria-modal="true" onClick={() => setEditing(null)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="modal-head">
              <h2>Chi tiết file</h2>
              <button type="button" className="modal-close" onClick={() => setEditing(null)} aria-label="Đóng">✕</button>
            </div>
            <div className="modal-body">
              <div className="media-detail-preview">
                {isImage(editing) ? <img src={editing.publicUrl} alt={editing.altText ?? editing.originalName} /> : <span className="cell-doc">TÀI LIỆU</span>}
              </div>
              <p className="media-detail-meta">
                <strong>{editing.originalName}</strong><br />
                {editing.mimeType} · {formatFileSize(editing.fileSize)}{editing.width && editing.height ? ` · ${editing.width}×${editing.height}px` : ''}
              </p>
              {isImage(editing) ? (
                <label>
                  Alt text
                  <input value={editAlt} onChange={(event) => setEditAlt(event.target.value)} />
                </label>
              ) : null}
              <label>
                Mô tả
                <textarea rows={3} value={editCaption} onChange={(event) => setEditCaption(event.target.value)} />
              </label>
              <div className="modal-inline-actions">
                <button type="button" className="secondary-button btn-icon" onClick={() => void copyLink(editing.publicUrl)}><Copy size={15} /> {copied ? 'Đã copy!' : 'Copy link'}</button>
                <button type="button" className="secondary-button btn-icon" onClick={() => void loadUsage(editing.id)}><MapPin size={15} /> {usage ? 'Ẩn nơi sử dụng' : 'Nơi sử dụng'}</button>
              </div>
              {usage ? (
                <div className="media-usage">
                  <strong>{usage.length === 0 ? 'File chưa được sử dụng.' : `Đang dùng tại ${usage.length} vị trí:`}</strong>
                  {usage.length > 0 ? <ul>{usage.map((item) => <li key={`${item.entityType}-${item.entityId}`}>{item.location}: {item.label}</li>)}</ul> : null}
                </div>
              ) : null}
              {editMessage ? <p className="editor-status" role="status">{editMessage}</p> : null}
            </div>
            <div className="modal-foot">
              <button type="button" className="btn-danger btn-icon modal-foot-start" onClick={() => void handleDelete(editing)}><Trash2 size={15} /> Xóa</button>
              <button type="button" className="secondary-button" onClick={() => setEditing(null)}>Đóng</button>
              <button className="btn-primary" disabled={isSaving} type="button" onClick={() => void saveEdit()}>{isSaving ? 'Đang lưu...' : 'Lưu mô tả'}</button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
