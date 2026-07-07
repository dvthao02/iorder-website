import type { HookManager } from '../../shared/hooks/index.js'

export const MEDIA_EVENTS = {
  UPLOADED: 'media:uploaded',
  UPDATED: 'media:updated',
  DELETED: 'media:deleted',
} as const

export function registerMediaHooks(_hooks: HookManager) {
  // Hook point for CDN invalidation, thumbnail generation, etc.
}
