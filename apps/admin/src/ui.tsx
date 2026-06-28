import type { MediaAsset } from '@iorder/contracts'
import { useRef, useState, type ReactNode } from 'react'

import { uploadMedia } from './api'

/**
 * Thanh thao tác cố định dưới đáy, kéo dài full chiều rộng vùng nội dung (trừ sidebar).
 * Dùng chung cho mọi trang có cụm nút lưu/xuất bản. Spacer giữ chỗ để không che nội dung cuối.
 */
export function EditorFooter({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="editor-footer-spacer" aria-hidden="true" />
      <div className="editor-footer">{children}</div>
    </>
  )
}

/**
 * Header chuẩn của trang quản trị: tiêu đề + mô tả + khu nút thao tác.
 * Dùng chung cho mọi trang bên navbar để bố cục đồng nhất.
 */
export function PageHeader({ title, description, actions }: {
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
}) {
  return (
    <div className="manager-heading">
      <div>
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      {actions ?? null}
    </div>
  )
}

/**
 * Công tắc bật/tắt (toggle switch) dùng chung cho toàn bộ CMS.
 * Thay thế cho `<input type="checkbox">` trần — có nhãn, mô tả phụ và truy cập bàn phím.
 */
export function ToggleSwitch({
  checked,
  onChange,
  label,
  hint,
  disabled = false,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  label?: ReactNode
  hint?: ReactNode
  disabled?: boolean
}) {
  return (
    <label className={`switch-field${disabled ? ' is-disabled' : ''}`}>
      <input
        type="checkbox"
        role="switch"
        className="switch-input"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="switch-track" aria-hidden="true">
        <span className="switch-thumb" />
      </span>
      {label || hint ? (
        <span className="switch-copy">
          {label ? <span className="switch-label">{label}</span> : null}
          {hint ? <small>{hint}</small> : null}
        </span>
      ) : null}
    </label>
  )
}

/** Chấm trạng thái nhỏ cho các danh sách (xanh = bật/đăng, xám = ẩn/nháp, đỏ = lỗi). */
export function StatusDot({ tone = 'muted' }: { tone?: 'on' | 'muted' | 'warn' | 'danger' }) {
  return <span className={`status-dot tone-${tone}`} aria-hidden="true" />
}

/**
 * Bộ chọn ảnh trực quan dùng chung (logo đối tác, ảnh bìa bài viết…).
 * Hiển thị lưới ảnh trong thư viện + nút tải ảnh mới từ máy (lưu thẳng lên hệ thống).
 */
export function ImagePicker({
  images,
  value,
  onChange,
  onUploaded,
  label,
  ariaLabel,
}: {
  images: MediaAsset[]
  value: string | null
  onChange: (id: string | null) => void
  onUploaded: (asset: MediaAsset) => void
  label: string
  ariaLabel?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const handleFile = async (file: File) => {
    setUploading(true)
    setError('')
    try {
      const { item } = await uploadMedia(file, { altText: file.name, caption: null })
      onUploaded(item)
      onChange(item.id)
    } catch {
      setError('Tải ảnh thất bại. Thử lại với ảnh khác.')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="form-field">
      <span className="field-label">{label}</span>
      <div className="logo-picker" role="radiogroup" aria-label={ariaLabel ?? label}>
        <button type="button" className="logo-option logo-option-upload" disabled={uploading} onClick={() => inputRef.current?.click()}>
          {uploading ? 'Đang tải…' : '+ Tải ảnh'}
        </button>
        <button type="button" role="radio" aria-checked={!value} className={`logo-option logo-option-none${!value ? ' is-active' : ''}`} onClick={() => onChange(null)}>
          Không chọn
        </button>
        {images.map((image) => (
          <button type="button" role="radio" aria-checked={value === image.id} key={image.id} title={image.originalName} className={`logo-option${value === image.id ? ' is-active' : ''}`} onClick={() => onChange(image.id)}>
            <img src={image.publicUrl} alt={image.originalName} />
          </button>
        ))}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.gif,.webp,.svg"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) void handleFile(file)
        }}
      />
      {error ? <small className="field-hint is-error">{error}</small> : null}
    </div>
  )
}
