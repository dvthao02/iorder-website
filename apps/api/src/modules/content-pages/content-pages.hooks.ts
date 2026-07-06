import type { HookManager } from '../../shared/hooks/index.js'

export const CONTENT_PAGE_EVENTS = {
  CREATED: 'content-pages:created',
  UPDATED: 'content-pages:updated',
  PUBLISHED: 'content-pages:published',
  UNPUBLISHED: 'content-pages:unpublished',
  DELETED: 'content-pages:deleted',
} as const

export function registerContentPageHooks(_hooks: HookManager) {
  // Hook point for cache invalidation, notifications, search indexing, etc.
}
