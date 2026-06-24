import type { MediaAsset, MediaKind, MediaUsage } from '@iorder/contracts'
import { useEffect, useState } from 'react'

import { getMediaUsage, listMedia, updateMedia, uploadMedia } from './api'

interface MediaLibraryProps {
  onBack: () => void
}

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function MediaCard({ asset, onUpdated }: {
  asset: MediaAsset
  onUpdated: (asset: MediaAsset) => void
}) {
  const [altText, setAltText] = useState(asset.altText ?? '')
  const [caption, setCaption] = useState(asset.caption ?? '')
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [usage, setUsage] = useState<MediaUsage[] | null>(null)
  const isImage = asset.mimeType.startsWith('image/')

  const handleSave = async () => {
    setIsSaving(true)
    setMessage('')

    try {
      const response = await updateMedia(asset.id, {
        altText: altText.trim() || null,
        caption: caption.trim() || null,
      })
      onUpdated(response.item)
      setMessage('Đã lưu mô tả.')
    } catch {
      setMessage('Không thể lưu mô tả.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleUsage = async () => {
    if (usage) { setUsage(null); return }
    try { setUsage((await getMediaUsage(asset.id)).items) }
    catch { setMessage('Không thể kiểm tra nơi đang sử dụng.') }
  }

  return (
    <article className="media-item">
      <div className="media-preview">
        {isImage
          ? <img alt={asset.altText ?? asset.originalName} src={asset.publicUrl} />
          : <span aria-hidden="true">TÀI LIỆU</span>}
      </div>
      <div className="media-item-body">
        <a href={asset.publicUrl} rel="noreferrer" target="_blank">{asset.originalName}</a>
        <small>{asset.mimeType} · {formatFileSize(asset.fileSize)}</small>
        {isImage ? (
          <label>
            Alt text
            <input value={altText} onChange={(event) => setAltText(event.target.value)} />
          </label>
        ) : null}
        <label>
          Mô tả
          <textarea rows={2} value={caption} onChange={(event) => setCaption(event.target.value)} />
        </label>
        <div className="media-item-actions">
          <button className="secondary-button" disabled={isSaving} type="button" onClick={handleSave}>
            {isSaving ? 'Đang lưu...' : 'Lưu mô tả'}
          </button>
          <button className="secondary-button" type="button" onClick={() => void handleUsage()}>{usage ? 'Ẩn nơi sử dụng' : 'Nơi sử dụng'}</button>
          {message ? <small role="status">{message}</small> : null}
        </div>
        {usage ? <div className="media-usage"><strong>{usage.length === 0 ? 'File chưa được sử dụng.' : `Đang dùng tại ${usage.length} vị trí:`}</strong>{usage.length > 0 ? <ul>{usage.map((item) => <li key={`${item.entityType}-${item.entityId}`}>{item.location}: {item.label}</li>)}</ul> : null}</div> : null}
      </div>
    </article>
  )
}

export function MediaLibrary({ onBack }: MediaLibraryProps) {
  const [items, setItems] = useState<MediaAsset[]>([])
  const [kind, setKind] = useState<MediaKind | undefined>()
  const [search, setSearch] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [altText, setAltText] = useState('')
  const [caption, setCaption] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')

  const loadItems = async (selectedKind = kind, query = search) => {
    setIsLoading(true)
    setError('')

    try {
      const response = await listMedia(selectedKind, query)
      setItems(response.items)
    } catch {
      setError('Không thể tải thư viện.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadItems()
  }, [kind])

  useEffect(() => {
    const timer = window.setTimeout(() => void loadItems(kind, search), 300)
    return () => window.clearTimeout(timer)
  }, [search])

  const handleUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!file) {
      setError('Vui lòng chọn một file.')
      return
    }

    setIsUploading(true)
    setError('')

    try {
      await uploadMedia(file, {
        altText: altText.trim() || null,
        caption: caption.trim() || null,
      })
      setFile(null)
      setAltText('')
      setCaption('')
      event.currentTarget.reset()
      await loadItems()
    } catch (uploadError) {
      const code = uploadError instanceof Error ? uploadError.message : ''
      setError(code === 'FILE_TOO_LARGE'
        ? 'File vượt quá giới hạn dung lượng.'
        : 'File không hợp lệ hoặc tải lên thất bại.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleKindChange = (nextKind?: MediaKind) => {
    setKind(nextKind)
  }

  const handleUpdated = (updated: MediaAsset) => {
    setItems((current) => current.map((item) => item.id === updated.id ? updated : item))
  }

  return (
    <section className="admin-card media-library">
      <div className="admin-header">
        <div>
          <button className="text-button" type="button" onClick={onBack}>← Tổng quan</button>
          <p className="admin-kicker">Nội dung website</p>
          <h1>Tài liệu và hình ảnh</h1>
          <p>Ảnh JPG, PNG, GIF, WebP; tài liệu PDF, Word, Excel hoặc ZIP. Tối đa 20 MB.</p>
        </div>
      </div>

      <form className="upload-form" onSubmit={handleUpload}>
        <label>
          Chọn file
          <input
            required
            accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx,.zip"
            type="file"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
        </label>
        <label>
          Alt text cho hình ảnh
          <input maxLength={500} value={altText} onChange={(event) => setAltText(event.target.value)} />
        </label>
        <label>
          Mô tả
          <textarea maxLength={2000} rows={3} value={caption} onChange={(event) => setCaption(event.target.value)} />
        </label>
        <button disabled={isUploading} type="submit">
          {isUploading ? 'Đang tải lên...' : 'Tải lên'}
        </button>
      </form>

      {error ? <p className="form-error" role="alert">{error}</p> : null}

      <div className="media-toolbar" aria-label="Lọc thư viện">
        <button className={!kind ? 'is-active' : ''} type="button" onClick={() => handleKindChange()}>Tất cả</button>
        <button className={kind === 'image' ? 'is-active' : ''} type="button" onClick={() => handleKindChange('image')}>Hình ảnh</button>
        <button className={kind === 'document' ? 'is-active' : ''} type="button" onClick={() => handleKindChange('document')}>Tài liệu</button>
        <input aria-label="Tìm trong thư viện" placeholder="Tìm theo tên file…" value={search} onChange={(event) => setSearch(event.target.value)} />
      </div>

      {isLoading ? <p>Đang tải thư viện...</p> : null}
      {!isLoading && items.length === 0 ? <p>Chưa có file nào.</p> : null}
      <div className="media-grid">
        {items.map((asset) => <MediaCard key={asset.id} asset={asset} onUpdated={handleUpdated} />)}
      </div>
    </section>
  )
}
