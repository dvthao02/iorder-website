import type { HookManager } from '../../shared/hooks/index.js'

export const SALES_EQUIPMENT_EVENTS = {
  CREATED: 'sales-equipment:created',
  UPDATED: 'sales-equipment:updated',
  PUBLISHED: 'sales-equipment:published',
  UNPUBLISHED: 'sales-equipment:unpublished',
  ARCHIVED: 'sales-equipment:archived',
  DELETED: 'sales-equipment:deleted',
  RESTORED: 'sales-equipment:restored',
} as const

export function registerSalesEquipmentHooks(_hooks: HookManager) {
  // Reserved for public-cache invalidation and future product-feed integrations.
}
