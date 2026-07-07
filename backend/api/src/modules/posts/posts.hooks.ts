import type { HookManager } from '../../shared/hooks/index.js'

export const POST_EVENTS = {
  CREATED: 'posts:created',
  UPDATED: 'posts:updated',
  PUBLISHED: 'posts:published',
  UNPUBLISHED: 'posts:unpublished',
  ARCHIVED: 'posts:archived',
  DELETED: 'posts:deleted',
  RESTORED: 'posts:restored',
} as const

export function registerPostHooks(_hooks: HookManager) {
  // Hook point for cache invalidation, notifications, search indexing, etc.
}
