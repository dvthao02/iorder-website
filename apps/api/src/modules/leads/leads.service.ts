import type { ContactLeadInput, LeadListQuery, LeadStatus } from '@iorder/contracts'

import { LeadNotFoundError, LeadRateLimitedError } from './leads.errors.js'
import { serializeLead, type LeadsRepository } from './leads.repository.js'

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000
const RATE_LIMIT_MAX_REQUESTS = 5

export class LeadsService {
  // In-memory: map IP -> danh sách timestamp request gần đây (trong cửa sổ 10 phút).
  // Giới hạn: mất khi restart server, không dùng chung giữa nhiều instance API.
  private requestLog = new Map<string, number[]>()

  constructor(private repository: LeadsRepository) {}

  private checkRateLimit(ip: string, now: number = Date.now()) {
    const timestamps = (this.requestLog.get(ip) ?? []).filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS)

    if (timestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
      this.requestLog.set(ip, timestamps)
      throw new LeadRateLimitedError()
    }

    timestamps.push(now)
    this.requestLog.set(ip, timestamps)
  }

  async createFromPublicForm(input: ContactLeadInput, context: { ip: string; ipHash: string | null }) {
    this.checkRateLimit(context.ip)

    // Honeypot: bot điền vào field ẩn `website` -> trả về "thành công" giả, không lưu gì, không audit log thật.
    if (input.website && input.website.trim().length > 0) {
      return { skipped: true as const }
    }

    const created = await this.repository.create({
      name: input.name,
      phone: input.phone,
      email: input.email ? input.email : null,
      businessModel: input.businessModel ?? null,
      branches: input.branches ?? null,
      need: input.need ?? null,
      message: input.message ?? null,
      ipHash: context.ipHash,
    })

    // Public action: không có user CMS thực hiện -> userId null (auditLogs.userId cho phép null).
    await this.repository.insertAuditLog({
      userId: null,
      action: 'lead.create',
      entityType: 'contact_lead',
      entityId: created.id,
      afterData: serializeLead(created),
    })

    return { skipped: false as const, item: serializeLead(created) }
  }

  async list(query: LeadListQuery) {
    const { rows, total, totalNew } = await this.repository.list({
      page: query.page,
      limit: query.limit,
      ...(query.status ? { status: query.status } : {}),
    })
    return { items: rows.map(serializeLead), total, totalNew }
  }

  async updateStatus(id: string, status: LeadStatus, editorId: string) {
    const existing = await this.repository.findById(id)
    if (!existing) throw new LeadNotFoundError()

    const shouldMarkHandled = existing.status === 'new' && status !== 'new'
    const updated = await this.repository.updateStatus(
      id,
      status,
      shouldMarkHandled ? { handledAt: new Date(), handledBy: editorId } : null,
    )
    if (!updated) throw new LeadNotFoundError()

    await this.repository.insertAuditLog({
      userId: editorId,
      action: 'lead.status_update',
      entityType: 'contact_lead',
      entityId: updated.id,
      beforeData: { status: existing.status },
      afterData: { status: updated.status },
    })

    return { item: serializeLead(updated) }
  }
}
