import type { ActivityListQuery } from '@iorder/contracts'

import { serializeAuditLogEntry, type ActivityRepository } from './activity.repository.js'

export class ActivityService {
  constructor(private repository: ActivityRepository) {}

  async list(query: ActivityListQuery) {
    const { items, total } = await this.repository.list(query)
    return {
      items: items.map(serializeAuditLogEntry),
      total,
      page: query.page,
      limit: query.limit,
    }
  }
}
