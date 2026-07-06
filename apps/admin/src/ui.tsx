import type { MediaAsset } from '@iorder/contracts'
import { MoreHorizontal, type LucideIcon } from 'lucide-react'
import { useEffect, useRef, useState, type DragEvent, type FormEvent, type ReactNode, type RefObject } from 'react'

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
export function PageHeader({ actions }: { title: ReactNode; description?: ReactNode; actions?: ReactNode }) {
  if (!actions) return null
  return <div className="manager-heading manager-heading-actions-only">{actions}</div>
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
        <button
          type="button"
          className="logo-option logo-option-upload"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? 'Đang tải…' : '+ Tải ảnh'}
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={!value}
          className={`logo-option logo-option-none${!value ? ' is-active' : ''}`}
          onClick={() => onChange(null)}
        >
          Không chọn
        </button>
        {images.map((image) => (
          <button
            type="button"
            role="radio"
            aria-checked={value === image.id}
            key={image.id}
            title={image.originalName}
            className={`logo-option${value === image.id ? ' is-active' : ''}`}
            onClick={() => onChange(image.id)}
          >
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

/**
 * Hook kéo-thả sắp xếp lại danh sách. Trả về props cho từng row và handler thả.
 * onReorder(fromIdx, toIdx) nhận 2 chỉ số để tự xử lý cập nhật API.
 */
export function useDragReorder(onReorder: (from: number, to: number) => Promise<void>) {
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [overIdx, setOverIdx] = useState<number | null>(null)

  const handleDrop = async (toIdx: number) => {
    if (dragIdx === null || dragIdx === toIdx) {
      setDragIdx(null)
      setOverIdx(null)
      return
    }
    const from = dragIdx
    setDragIdx(null)
    setOverIdx(null)
    await onReorder(from, toIdx)
  }

  const rowProps = (idx: number) => ({
    draggable: true as const,
    className: dragIdx === idx ? 'is-dragging' : overIdx === idx ? 'is-drag-over' : '',
    onDragStart: (e: DragEvent) => {
      setDragIdx(idx)
      e.dataTransfer.effectAllowed = 'move'
    },
    onDragOver: (e: DragEvent) => {
      e.preventDefault()
      if (overIdx !== idx) setOverIdx(idx)
    },
    onDragLeave: () => setOverIdx(null),
    onDrop: (e: DragEvent) => {
      e.preventDefault()
      void handleDrop(idx)
    },
    onDragEnd: () => {
      setDragIdx(null)
      setOverIdx(null)
    },
  })

  return { dragIdx, rowProps }
}

/**
 * Phím tắt chuẩn cho modal/form chỉnh sửa: Ctrl/Cmd+S để lưu, Escape để đóng.
 * Dùng ref nội bộ để luôn gọi callback mới nhất mà không cần khai báo deps.
 * Bỏ qua onSave/onEscape nếu không truyền (vd. form không có Escape riêng).
 */
export function useEscapeAndSave({
  active,
  onSave,
  onEscape,
}: {
  active: boolean
  onSave?: () => void
  onEscape?: () => void
}) {
  const onSaveRef = useRef(onSave)
  const onEscapeRef = useRef(onEscape)
  useEffect(() => {
    onSaveRef.current = onSave
    onEscapeRef.current = onEscape
  })

  useEffect(() => {
    if (!active) return
    const handler = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault()
        onSaveRef.current?.()
      } else if (event.key === 'Escape') {
        onEscapeRef.current?.()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [active])
}

/**
 * Khung modal chỉnh sửa dùng chung: overlay + card (form hoặc div) + head/body/foot.
 * Header/body/foot nhận ReactNode tuỳ ý — mỗi manager tự quyết nội dung bên trong,
 * layout chỉ gộp phần khung lặp lại (class name, backdrop click, stopPropagation).
 */
export function ModalShell({
  as = 'div',
  size,
  onSubmit,
  onOverlayClick,
  header,
  children,
  footer,
  formRef,
}: {
  as?: 'form' | 'div'
  size?: 'lg'
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void
  onOverlayClick: () => void
  header: ReactNode
  children: ReactNode
  footer?: ReactNode
  formRef?: RefObject<HTMLFormElement | null>
}) {
  const cardClassName = `modal-card${size === 'lg' ? ' modal-card-lg' : ''}`
  const inner = (
    <>
      <div className="modal-head">{header}</div>
      <div className="modal-body">{children}</div>
      {footer !== undefined ? <div className="modal-foot">{footer}</div> : null}
    </>
  )

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" onClick={onOverlayClick}>
      {as === 'form' ? (
        <form ref={formRef} className={cardClassName} onClick={(event) => event.stopPropagation()} onSubmit={onSubmit}>
          {inner}
        </form>
      ) : (
        <div className={cardClassName} onClick={(event) => event.stopPropagation()}>
          {inner}
        </div>
      )}
    </div>
  )
}

/** Một mục thao tác trong ActionMenu, hoặc dấu phân cách (divider). */
export interface ActionMenuItem {
  label: string
  icon?: LucideIcon
  onClick: () => void
  tone?: 'default' | 'danger'
  disabled?: boolean
}

export interface ActionMenuProps {
  items: (ActionMenuItem | { divider: true })[]
}

/**
 * Menu thao tác gộp (nút "…") dùng để giấu bớt các nút phụ ít dùng trong header
 * của trình soạn thảo nội dung (bài viết, dịch vụ…), tránh dàn hàng ngang quá nhiều nút.
 */
export function ActionMenu({ items }: ActionMenuProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('click', handleClickOutside)
    document.addEventListener('keydown', handleKeydown)
    return () => {
      document.removeEventListener('click', handleClickOutside)
      document.removeEventListener('keydown', handleKeydown)
    }
  }, [open])

  return (
    <div className="action-menu" ref={containerRef}>
      <button
        type="button"
        className="secondary-button btn-icon action-menu-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <MoreHorizontal size={15} />
      </button>
      {open ? (
        <div className="action-menu-dropdown" role="menu">
          {items.map((item, index) => {
            if ('divider' in item) {
              return <div key={`divider-${index}`} className="action-menu-divider" />
            }
            const Icon = item.icon
            return (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                className={`action-menu-item${item.tone === 'danger' ? ' danger' : ''}`}
                disabled={item.disabled}
                onClick={() => {
                  if (item.disabled) return
                  item.onClick()
                  setOpen(false)
                }}
              >
                {Icon ? <Icon size={15} /> : null}
                {item.label}
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

/** Chuyển Date → chuỗi yyyy-MM-dd cho input[type=date] (theo giờ địa phương). */
function toDateInputValue(value: Date) {
  const y = value.getFullYear()
  const m = String(value.getMonth() + 1).padStart(2, '0')
  const d = String(value.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Chuyển Date → chuỗi HH:mm 24h. */
function toTimeInputValue(value: Date) {
  return `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`
}

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/

/**
 * Bộ chọn ngày + giờ 24h tiếng Việt. Thay cho input[type=datetime-local] gốc
 * vì định dạng 12h/24h của input gốc ăn theo cài đặt Windows (hiện SA/CH khó dùng).
 * Ngày dùng input[type=date] native; giờ là ô text HH:mm validate bằng regex — luôn 24h.
 */
export function DateTimePicker({
  value,
  onChange,
  min,
  label,
  placeholder = 'HH:mm',
}: {
  value: Date | null
  onChange: (next: Date | null) => void
  min?: Date
  label?: string
  placeholder?: string
}) {
  // Giữ text giờ đang gõ dở để không chặn người dùng khi chuỗi chưa hợp lệ.
  const [timeText, setTimeText] = useState(value ? toTimeInputValue(value) : '')
  const [timeError, setTimeError] = useState(false)
  const lastValueRef = useRef<Date | null>(value)

  // Đồng bộ khi value đổi từ bên ngoài (chọn bài khác, khôi phục revision...).
  if (value?.getTime() !== lastValueRef.current?.getTime()) {
    lastValueRef.current = value
    setTimeText(value ? toTimeInputValue(value) : '')
    setTimeError(false)
  }

  const applyDate = (dateString: string) => {
    if (!dateString) {
      onChange(null)
      return
    }
    const [y = 0, m = 1, d = 1] = dateString.split('-').map(Number)
    if (!y) return
    const base = value ?? new Date()
    const next = new Date(y, m - 1, d, base.getHours(), base.getMinutes(), 0, 0)
    lastValueRef.current = next
    onChange(next)
  }

  const applyTime = (text: string) => {
    setTimeText(text)
    const match = TIME_PATTERN.exec(text.trim())
    if (!match) {
      setTimeError(text.trim().length > 0)
      return
    }
    setTimeError(false)
    const base = value ?? new Date()
    const next = new Date(base.getFullYear(), base.getMonth(), base.getDate(), Number(match[1]), Number(match[2]), 0, 0)
    lastValueRef.current = next
    onChange(next)
  }

  const clear = () => {
    lastValueRef.current = null
    setTimeText('')
    setTimeError(false)
    onChange(null)
  }

  return (
    <div className="datetime-picker">
      {label ? <label className="field-label">{label}</label> : null}
      <div className="datetime-picker-row">
        <input
          type="date"
          className="datetime-picker-date"
          value={value ? toDateInputValue(value) : ''}
          min={min ? toDateInputValue(min) : undefined}
          onChange={(event) => applyDate(event.target.value)}
        />
        <input
          type="text"
          inputMode="numeric"
          className={`datetime-picker-time${timeError ? ' is-error' : ''}`}
          placeholder={placeholder}
          maxLength={5}
          value={timeText}
          onChange={(event) => applyTime(event.target.value)}
        />
        {value ? (
          <button type="button" className="datetime-picker-clear" onClick={clear}>
            Xóa
          </button>
        ) : null}
      </div>
      {value && !timeError ? (
        <p className="field-hint">
          Sẽ đăng lúc {toTimeInputValue(value)} {toDateInputValue(value).split('-').reverse().join('/')}
        </p>
      ) : null}
      {timeError ? <p className="field-hint is-error">Giờ phải theo dạng 24h HH:mm, ví dụ 08:30 hoặc 21:05.</p> : null}
    </div>
  )
}
