import type { HookManager } from '../../shared/hooks/index.js'

export const OFFERING_EVENTS = {
  CREATED: 'offerings:created',
  UPDATED: 'offerings:updated',
  PUBLISHED: 'offerings:published',
  UNPUBLISHED: 'offerings:unpublished',
  ARCHIVED: 'offerings:archived',
  DELETED: 'offerings:deleted',
} as const

export function registerOfferingHooks(_hooks: HookManager) {
  // Hook point for cache invalidation, notifications, search indexing, etc.
}
