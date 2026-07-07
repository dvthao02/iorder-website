import type { DownloadIcon, DownloadInput, DownloadResponse, MediaAsset } from '@iorder/contracts'
import {
  Download,
  FileSpreadsheet,
  FileText,
  MonitorDown,
  Package,
  Pencil,
  Plus,
  Printer,
  ShieldCheck,
  Smartphone,
  Trash2,
  Upload,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { createDownload, deleteDownload, listDownloads, listMedia, updateDownload, uploadMedia } from './api'
import { toast } from './toast'
import { ModalShell, PageHeader, StatusDot, ToggleSwitch, useEscapeAndSave } from './ui'

const emptyDownload: DownloadInput = {
  title: '',
  description: null,
  meta: null,
  icon: 'download',
  fileMediaId: null,
  sortOrder: 0,
  isEnabled: true,
}

const ICON_OPTIONS: { value: DownloadIcon; label: string; Icon: typeof Download }[] = [
  { value: 'download', label: 'Tải xuống', Icon: Download },
  { value: 'monitor-down', label: 'Hỗ trợ từ xa', Icon: MonitorDown },
  { value: 'printer', label: 'Máy in', Icon: Printer },
  { value: 'file-spreadsheet', label: 'Bảng tính', Icon: FileSpreadsheet },
  { value: 'file-text', label: 'Tài liệu', Icon: FileText },
  { value: 'shield-check', label: 'Checklist', Icon: ShieldCheck },
  { value: 'package', label: 'Gói cài đặt', Icon: Package },
  { value: 'smartphone', label: 'APK / Di động', Icon: Smartphone },
]

const ICON_MAP = Object.fromEntries(ICON_OPTIONS.map((option) => [option.value, option.Icon])) as Record<
  DownloadIcon,
  typeof Download
>

type StatusFilter = 'all' | 'enabled' | 'disabled'

function validateDownload(form: DownloadInput): string | null {
  if (form.title.trim().length < 2) return 'Tiêu đề phải có ít nhất 2 ký tự.'
  if (!form.fileMediaId) return 'Vui lòng chọn hoặc tải lên một file.'
  return null
}

function toInput(download: DownloadResponse): DownloadInput {
  return {
    title: download.title,
    description: download.description,
    meta: download.meta,
    icon: download.icon,
    fileMediaId: download.fileMediaId,
    sortOrder: download.sortOrder,
    isEnabled: download.isEnabled,
  }
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function FilePicker({
  files,
  value,
  fileName,
  onChange,
  onUploaded,
}: {
  files: MediaAsset[]
  value: string | null
  fileName: string | null
  onChange: (id: string | null, name: string | null) => void
  onUploaded: (asset: MediaAsset) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const handleFile = async (file: File) => {
    setUploading(true)
    setError('')
    try {
      const { item } = await uploadMedia(file, { altText: null, caption: null })
      onUploaded(item)
      onChange(item.id, item.originalName)
    } catch {
      setError('Tải file thất bại. Định dạng hỗ trợ: pdf, doc(x), xls(x), zip, apk.')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="form-field">
      <span className="field-label">File tải xuống</span>
      <div className="file-picker">
        <button
          type="button"
          className="secondary-button btn-icon"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          <Upload size={15} /> {uploading ? 'Đang tải…' : 'Tải file mới'}
        </button>
        {value ? (
          <span className="file-picker-current">
            {fileName ?? 'File đã chọn'}
            <button type="button" className="file-picker-clear" onClick={() => onChange(null, null)}>
              Bỏ chọn
            </button>
          </span>
        ) : (
          <span className="muted">Chưa chọn file</span>
        )}
      </div>
      {files.length > 0 ? (
        <select
          value={value ?? ''}
          onChange={(event) => {
            const id = event.target.value || null
            const asset = files.find((file) => file.id === id)
            onChange(id, asset?.originalName ?? null)
          }}
        >
          <option value="">— Chọn từ thư viện —</option>
          {files.map((file) => (
            <option key={file.id} value={file.id}>
              {file.originalName} ({formatFileSize(file.fileSize)})
            </option>
          ))}
        </select>
      ) : null}
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.apk"
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

export function DownloadsManager() {
  const [items, setItems] = useState<DownloadResponse[]>([])
  const [files, setFiles] = useState<MediaAsset[]>([])

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  const [editorOpen, setEditorOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingFileName, setEditingFileName] = useState<string | null>(null)
  const [form, setForm] = useState<DownloadInput>(emptyDownload)
  const [isSaving, setIsSaving] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  const [dragId, setDragId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    const [downloadResult, mediaResult] = await Promise.all([listDownloads(), listMedia('document')])
    setItems(downloadResult.items)
    setFiles(mediaResult.items)
  }

  useEffect(() => {
    void loadData()
      .catch(() => toast.error('Không thể tải danh sách hỗ trợ cài đặt.'))
      .finally(() => setLoading(false))
  }, [])

  useEscapeAndSave({
    active: editorOpen,
    onSave: () => formRef.current?.requestSubmit(),
    onEscape: () => closeEditor(),
  })

  const patchForm = <Key extends keyof DownloadInput>(key: Key, value: DownloadInput[Key]) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const openCreate = () => {
    setEditingId(null)
    setEditingFileName(null)
    setForm({ ...emptyDownload, sortOrder: items.length })
    setEditorOpen(true)
  }

  const openEdit = (download: DownloadResponse) => {
    setEditingId(download.id)
    setEditingFileName(download.fileName)
    setForm(toInput(download))
    setEditorOpen(true)
  }

  const closeEditor = () => {
    setEditorOpen(false)
  }

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const validationError = validateDownload(form)
    if (validationError) {
      toast.error(validationError)
      return
    }
    setIsSaving(true)
    try {
      if (editingId) await updateDownload(editingId, form)
      else await createDownload(form)
      await loadData()
      setEditorOpen(false)
      toast.success(editingId ? 'Đã cập nhật mục hỗ trợ cài đặt.' : 'Đã thêm mục hỗ trợ cài đặt.')
    } catch {
      toast.error('Không thể lưu.')
    } finally {
      setIsSaving(false)
    }
  }

  const toggleEnabled = async (download: DownloadResponse) => {
    try {
      await updateDownload(download.id, { ...toInput(download), isEnabled: !download.isEnabled })
      await loadData()
      toast[download.isEnabled ? 'warning' : 'success'](
        download.isEnabled ? 'Đã ẩn khỏi website.' : 'Đã hiển thị trên website.',
      )
    } catch {
      toast.error('Không thể đổi trạng thái.')
    }
  }

  const remove = async (download: DownloadResponse) => {
    try {
      await deleteDownload(download.id)
      await loadData()
      toast.warning('Đã xóa mục hỗ trợ cài đặt.')
    } catch {
      toast.error('Không thể xóa.')
    }
  }

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return items.filter((download) => {
      if (statusFilter === 'enabled' && !download.isEnabled) return false
      if (statusFilter === 'disabled' && download.isEnabled) return false
      if (query && !download.title.toLowerCase().includes(query)) return false
      return true
    })
  }, [items, search, statusFilter])

  // Chỉ cho kéo-thả khi đang xem toàn bộ (không lọc/tìm) để thứ tự không bị nhập nhằng.
  const isReorderable = !search.trim() && statusFilter === 'all'

  const persistOrder = async (ordered: DownloadResponse[]) => {
    const changed = ordered
      .map((download, index) => ({ download, index }))
      .filter(({ download, index }) => download.sortOrder !== index)
    setItems(ordered.map((download, index) => ({ ...download, sortOrder: index })))
    try {
      await Promise.all(
        changed.map(({ download, index }) => updateDownload(download.id, { ...toInput(download), sortOrder: index })),
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
    const from = ordered.findIndex((d) => d.id === dragId)
    const to = ordered.findIndex((d) => d.id === targetId)
    if (from === -1 || to === -1) return
    const [moved] = ordered.splice(from, 1)
    if (!moved) return
    ordered.splice(to, 0, moved)
    setDragId(null)
    void persistOrder(ordered)
  }

  return (
    <section className="admin-card content-manager">
      <PageHeader
        title={<>Hỗ trợ cài đặt</>}
        description={
          <>Quản lý các file tải xuống (công cụ hỗ trợ, hướng dẫn, mẫu dữ liệu...) hiển thị ở trang "Hỗ trợ cài đặt".</>
        }
        actions={
          <button className="btn-primary btn-icon" type="button" onClick={openCreate}>
            <Plus size={16} /> Thêm mục
          </button>
        }
      />

      <div className="toolbar">
        <input
          className="toolbar-search"
          type="search"
          placeholder="Tìm theo tiêu đề…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}>
          <option value="all">Mọi trạng thái</option>
          <option value="enabled">Đang hiển thị</option>
          <option value="disabled">Đã ẩn</option>
        </select>
      </div>

      {loading && <p className="admin-info">Đang tải...</p>}

      {!loading && items.length === 0 && (
        <div className="admin-empty">
          <Plus size={36} />
          <p>Chưa có mục hỗ trợ cài đặt nào.</p>
          <button type="button" className="btn-primary btn-icon" onClick={openCreate}>
            <Plus size={15} /> Thêm mục đầu tiên
          </button>
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th className="col-grip" aria-label="Kéo thả" />
                <th className="col-stt">STT</th>
                <th>Tiêu đề</th>
                <th>File</th>
                <th>Trạng thái</th>
                <th className="col-order">Thứ tự</th>
                <th className="col-actions">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="table-empty">
                    Không có mục nào khớp.
                  </td>
                </tr>
              ) : null}
              {filtered.map((download, index) => {
                const Icon = ICON_MAP[download.icon] ?? Download
                return (
                  <tr
                    key={download.id}
                    className={dragId === download.id ? 'is-dragging' : ''}
                    draggable={isReorderable}
                    onDragStart={() => isReorderable && setDragId(download.id)}
                    onDragOver={(event) => {
                      if (isReorderable) event.preventDefault()
                    }}
                    onDrop={() => isReorderable && onDrop(download.id)}
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
                      <span className="cell-with-icon">
                        <Icon size={18} />
                        <span>
                          <strong>{download.title}</strong>
                          {download.meta ? <span className="cell-sub">{download.meta}</span> : null}
                        </span>
                      </span>
                    </td>
                    <td>
                      {download.fileUrl ? (
                        <a href={download.fileUrl} target="_blank" rel="noreferrer">
                          {download.fileName ?? 'Xem file'}
                        </a>
                      ) : (
                        <span className="muted">Chưa có file</span>
                      )}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="status-pill"
                        onClick={() => void toggleEnabled(download)}
                        title="Bấm để bật/tắt"
                      >
                        <StatusDot tone={download.isEnabled ? 'on' : 'muted'} />
                        {download.isEnabled ? 'Đang hiển thị' : 'Đã ẩn'}
                      </button>
                    </td>
                    <td className="col-order">#{download.sortOrder}</td>
                    <td className="col-actions">
                      <button
                        type="button"
                        className="row-action icon-only"
                        title="Sửa"
                        aria-label={`Sửa ${download.title}`}
                        onClick={() => openEdit(download)}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        className="row-action icon-only is-danger"
                        title="Xóa"
                        aria-label={`Xóa ${download.title}`}
                        onClick={() => void remove(download)}
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
              <h2>{editingId ? 'Sửa mục hỗ trợ cài đặt' : 'Thêm mục hỗ trợ cài đặt'}</h2>
            </>
          }
          footer={
            <>
              <button type="button" className="secondary-button" onClick={closeEditor}>
                Hủy
              </button>
              <button
                className="btn-primary"
                disabled={isSaving || Boolean(validateDownload(form))}
                title={validateDownload(form) ?? undefined}
                type="submit"
              >
                {isSaving ? 'Đang lưu...' : 'Lưu'}
              </button>
            </>
          }
        >
          <div className="form-row-2col">
            <label>
              Tiêu đề
              <input
                required
                maxLength={220}
                value={form.title}
                onChange={(event) => patchForm('title', event.target.value)}
              />
            </label>
            <label>
              Icon
              <select value={form.icon} onChange={(event) => patchForm('icon', event.target.value as DownloadIcon)}>
                {ICON_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="form-row-2col">
            <label>
              Nhãn phụ (meta)
              <input
                maxLength={160}
                placeholder="VD: Windows / Hỗ trợ từ xa"
                value={form.meta ?? ''}
                onChange={(event) => patchForm('meta', event.target.value || null)}
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
            Mô tả
            <textarea
              maxLength={2000}
              rows={3}
              value={form.description ?? ''}
              onChange={(event) => patchForm('description', event.target.value || null)}
            />
          </label>

          <FilePicker
            files={files}
            value={form.fileMediaId}
            fileName={editingFileName}
            onChange={(id, name) => {
              patchForm('fileMediaId', id)
              setEditingFileName(name)
            }}
            onUploaded={(asset) => setFiles((prev) => [asset, ...prev])}
          />

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
