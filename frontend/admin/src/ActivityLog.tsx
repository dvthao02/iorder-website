import type { AuditLogEntry } from '@iorder/contracts'
import { Eye } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { listActivity } from './api'
import { toast } from './toast'
import { ModalShell, PageHeader } from './ui'

// Nhãn tiếng Việt cho từng action code thực tế đang được ghi log qua insertAuditLog
// trong backend/api/src/modules/**. Action lạ (chưa có trong map) hiển thị nguyên chuỗi gốc.
const ACTION_LABELS: Record<string, string> = {
  'category.create': 'Tạo chuyên mục',
  'category.update': 'Cập nhật chuyên mục',
  'category.delete': 'Xóa chuyên mục',
  'download.create': 'Tạo tài liệu hỗ trợ cài đặt',
  'download.update': 'Cập nhật tài liệu hỗ trợ cài đặt',
  'download.delete': 'Xóa tài liệu hỗ trợ cài đặt',
  'homepage.save': 'Lưu trang chủ',
  'homepage.checkpoint': 'Tạo điểm khôi phục trang chủ',
  'homepage.publish': 'Xuất bản trang chủ',
  'homepage.restore': 'Khôi phục phiên bản trang chủ',
  'media.upload': 'Tải lên tệp media',
  'media.update': 'Cập nhật metadata media',
  'media.delete': 'Xóa tệp media',
  'offering.create': 'Tạo phần mềm/giải pháp/dịch vụ',
  'offering.update': 'Cập nhật phần mềm/giải pháp/dịch vụ',
  'offering.publish': 'Xuất bản phần mềm/giải pháp/dịch vụ',
  'offering.archive': 'Lưu trữ phần mềm/giải pháp/dịch vụ',
  'offering.unpublish': 'Gỡ xuất bản phần mềm/giải pháp/dịch vụ',
  'offering.delete': 'Xóa phần mềm/giải pháp/dịch vụ',
  'partner.create': 'Thêm đối tác/khách hàng',
  'partner.update': 'Cập nhật đối tác/khách hàng',
  'partner.delete': 'Xóa đối tác/khách hàng',
  'post.create': 'Tạo bài viết',
  'post.update': 'Cập nhật bài viết',
  'post.publish': 'Xuất bản bài viết',
  'post.archive': 'Lưu trữ bài viết',
  'post.unpublish': 'Gỡ xuất bản bài viết',
  'post.restore': 'Khôi phục phiên bản bài viết',
  'post.publish.scheduled': 'Tự động xuất bản bài viết theo lịch',
  'post.delete': 'Xóa bài viết',
  'settings.profile.update': 'Cập nhật hồ sơ công ty',
  'settings.external_links.update': 'Cập nhật liên kết ngoài',
  'settings.appearance.update': 'Cập nhật giao diện website',
  'testimonial.create': 'Thêm đánh giá khách hàng',
  'testimonial.update': 'Cập nhật đánh giá khách hàng',
  'testimonial.delete': 'Xóa đánh giá khách hàng',
}

const ENTITY_TYPE_OPTIONS = [
  'category',
  'support_download',
  'page',
  'media_asset',
  'offering',
  'partner',
  'post',
  'site_profile',
  'site_settings',
  'testimonial',
]

function actionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${pad(date.getHours())}:${pad(date.getMinutes())} ${pad(date.getDate())}/${pad(date.getMonth() + 1)}`
}

const PAGE_SIZE = 20

export function ActivityLog() {
  const [items, setItems] = useState<AuditLogEntry[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [entityTypeFilter, setEntityTypeFilter] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [detailEntry, setDetailEntry] = useState<AuditLogEntry | null>(null)

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const load = async () => {
    setLoading(true)
    try {
      // exactOptionalPropertyTypes: chỉ đưa key filter vào object khi có giá trị.
      const result = await listActivity({
        page,
        limit: PAGE_SIZE,
        ...(entityTypeFilter ? { entityType: entityTypeFilter } : {}),
        ...(actionFilter ? { action: actionFilter } : {}),
      })
      setItems(result.items)
      setTotal(result.total)
    } catch {
      toast.error('Không thể tải nhật ký hoạt động.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, entityTypeFilter, actionFilter])

  useEffect(() => {
    setPage(1)
  }, [entityTypeFilter, actionFilter])

  const actionOptions = useMemo(() => Object.keys(ACTION_LABELS).sort((a, b) => a.localeCompare(b)), [])

  return (
    <section className="admin-card content-manager activity-log">
      <PageHeader
        title={<>Hoạt động</>}
        description={<>Nhật ký các thay đổi nội dung (audit log) do quản trị viên thực hiện.</>}
      />

      <div className="toolbar">
        <select value={entityTypeFilter} onChange={(event) => setEntityTypeFilter(event.target.value)}>
          <option value="">Mọi đối tượng</option>
          {ENTITY_TYPE_OPTIONS.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        <select value={actionFilter} onChange={(event) => setActionFilter(event.target.value)}>
          <option value="">Mọi hành động</option>
          {actionOptions.map((action) => (
            <option key={action} value={action}>
              {actionLabel(action)}
            </option>
          ))}
        </select>
      </div>

      {loading && <p className="admin-info">Đang tải...</p>}

      {!loading && items.length === 0 && (
        <div className="admin-empty">
          <p>Chưa có hoạt động nào khớp bộ lọc.</p>
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="data-table-wrap">
          <table className="data-table activity-table">
            <thead>
              <tr>
                <th className="activity-col-time">Thời gian</th>
                <th>Người thực hiện</th>
                <th>Hành động</th>
                <th>Đối tượng</th>
                <th className="col-actions">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {items.map((entry) => (
                <tr key={entry.id}>
                  <td className="activity-col-time">{formatTimestamp(entry.createdAt)}</td>
                  <td>{entry.userName ?? 'Hệ thống'}</td>
                  <td>{actionLabel(entry.action)}</td>
                  <td>
                    <span className="activity-entity-badge">{entry.entityType}</span>
                  </td>
                  <td className="col-actions">
                    <button
                      type="button"
                      className="row-action icon-only"
                      title="Chi tiết"
                      aria-label="Xem chi tiết"
                      onClick={() => setDetailEntry(entry)}
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && total > 0 && (
        <div className="activity-pagination">
          <span className="muted">
            Trang {page}/{totalPages} · {total} hoạt động
          </span>
          <div className="activity-pagination-actions">
            <button
              type="button"
              className="secondary-button"
              disabled={page <= 1}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
            >
              Trước
            </button>
            <button
              type="button"
              className="secondary-button"
              disabled={page >= totalPages}
              onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
            >
              Sau
            </button>
          </div>
        </div>
      )}

      {detailEntry ? (
        <ModalShell
          onOverlayClick={() => setDetailEntry(null)}
          header={
            <>
              <button type="button" className="modal-back" onClick={() => setDetailEntry(null)}>
                ← Trở về
              </button>
              <h2>Chi tiết hoạt động</h2>
            </>
          }
        >
          <p>
            <strong>{actionLabel(detailEntry.action)}</strong> · {detailEntry.entityType} ·{' '}
            {formatTimestamp(detailEntry.createdAt)} · {detailEntry.userName ?? 'Hệ thống'}
          </p>
          <div className="activity-detail-grid">
            <div>
              <h3>Trước khi thay đổi</h3>
              <pre className="activity-json">{JSON.stringify(detailEntry.beforeData, null, 2)}</pre>
            </div>
            <div>
              <h3>Sau khi thay đổi</h3>
              <pre className="activity-json">{JSON.stringify(detailEntry.afterData, null, 2)}</pre>
            </div>
          </div>
        </ModalShell>
      ) : null}
    </section>
  )
}
