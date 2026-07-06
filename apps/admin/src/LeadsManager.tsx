import type { ContactLead, LeadStatus } from '@iorder/contracts'
import { Eye } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { getLeads, updateLeadStatus } from './api'
import { toast } from './toast'
import { ModalShell, PageHeader, StatusDot } from './ui'

type StatusFilter = 'all' | LeadStatus

const STATUS_LABEL: Record<LeadStatus, string> = {
  new: 'Mới',
  contacted: 'Đã liên hệ',
  closed: 'Đã đóng',
}

const STATUS_TONE: Record<LeadStatus, 'on' | 'warn' | 'muted'> = {
  new: 'warn',
  contacted: 'on',
  closed: 'muted',
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function LeadsManager() {
  const [items, setItems] = useState<ContactLead[]>([])
  const [total, setTotal] = useState(0)
  const [totalNew, setTotalNew] = useState(0)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const limit = 20

  const [detailId, setDetailId] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  const loadData = async () => {
    const params: { page: number; limit: number; status?: LeadStatus } = { page, limit }
    if (statusFilter !== 'all') params.status = statusFilter
    const result = await getLeads(params)
    setItems(result.items)
    setTotal(result.total)
    setTotalNew(result.totalNew)
  }

  useEffect(() => {
    setLoading(true)
    void loadData()
      .catch(() => toast.error('Không thể tải danh sách khách liên hệ.'))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, page])

  const detail = useMemo(() => items.find((item) => item.id === detailId) ?? null, [items, detailId])

  const changeStatus = async (id: string, status: LeadStatus) => {
    setIsUpdating(true)
    try {
      await updateLeadStatus(id, status)
      await loadData()
      toast.success('Đã cập nhật trạng thái.')
    } catch {
      toast.error('Không thể cập nhật trạng thái.')
    } finally {
      setIsUpdating(false)
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / limit))

  return (
    <section className="admin-card content-manager">
      <PageHeader
        title="Khách liên hệ"
        description={
          <>
            Danh sách lead thu được từ form liên hệ trên website.{' '}
            {totalNew > 0 ? <strong>{totalNew} khách mới chưa xử lý.</strong> : null}
          </>
        }
      />

      <div className="toolbar">
        <select
          value={statusFilter}
          onChange={(event) => {
            setPage(1)
            setStatusFilter(event.target.value as StatusFilter)
          }}
        >
          <option value="all">Mọi trạng thái</option>
          <option value="new">Mới</option>
          <option value="contacted">Đã liên hệ</option>
          <option value="closed">Đã đóng</option>
        </select>
      </div>

      {loading && <p className="admin-info">Đang tải...</p>}

      {!loading && items.length === 0 && (
        <div className="admin-empty">
          <p>Chưa có khách liên hệ nào.</p>
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Thời gian</th>
                <th>Tên</th>
                <th>SĐT</th>
                <th>Email</th>
                <th>Nhu cầu</th>
                <th>Trạng thái</th>
                <th className="col-actions">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {items.map((lead) => (
                <tr key={lead.id}>
                  <td>{formatDateTime(lead.createdAt)}</td>
                  <td>
                    <strong>{lead.name}</strong>
                  </td>
                  <td>{lead.phone}</td>
                  <td>{lead.email ?? <span className="muted">—</span>}</td>
                  <td>{lead.need ?? <span className="muted">—</span>}</td>
                  <td>
                    <span className={`status-pill status-${lead.status}`}>
                      <StatusDot tone={STATUS_TONE[lead.status]} />
                      {STATUS_LABEL[lead.status]}
                    </span>
                  </td>
                  <td className="col-actions">
                    <button
                      type="button"
                      className="row-action icon-only"
                      title="Xem chi tiết"
                      aria-label={`Xem chi tiết ${lead.name}`}
                      onClick={() => setDetailId(lead.id)}
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

      {!loading && total > limit && (
        <div className="table-pagination">
          <button type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>
            Trước
          </button>
          <span>
            Trang {page}/{totalPages}
          </span>
          <button type="button" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)}>
            Sau
          </button>
        </div>
      )}

      {detail ? (
        <ModalShell
          onOverlayClick={() => setDetailId(null)}
          header={
            <>
              <button type="button" className="modal-back" onClick={() => setDetailId(null)}>
                ← Trở về
              </button>
              <h2>Chi tiết khách liên hệ</h2>
            </>
          }
        >
          <div className="form-row-2col">
            <label>
              Họ tên
              <input readOnly value={detail.name} />
            </label>
            <label>
              Số điện thoại
              <input readOnly value={detail.phone} />
            </label>
          </div>
          <div className="form-row-2col">
            <label>
              Email
              <input readOnly value={detail.email ?? ''} />
            </label>
            <label>
              Mô hình kinh doanh
              <input readOnly value={detail.businessModel ?? ''} />
            </label>
          </div>
          <div className="form-row-2col">
            <label>
              Số chi nhánh/quầy
              <input readOnly value={detail.branches ?? ''} />
            </label>
            <label>
              Nhu cầu chính
              <input readOnly value={detail.need ?? ''} />
            </label>
          </div>
          <label>
            Mô tả thêm
            <textarea readOnly rows={4} value={detail.message ?? ''} />
          </label>

          <div className="form-row-2col">
            <label>
              Trạng thái
              <select
                value={detail.status}
                disabled={isUpdating}
                onChange={(event) => void changeStatus(detail.id, event.target.value as LeadStatus)}
              >
                <option value="new">Mới</option>
                <option value="contacted">Đã liên hệ</option>
                <option value="closed">Đã đóng</option>
              </select>
            </label>
            <label>
              Thời gian tạo
              <input readOnly value={formatDateTime(detail.createdAt)} />
            </label>
          </div>
        </ModalShell>
      ) : null}
    </section>
  )
}
