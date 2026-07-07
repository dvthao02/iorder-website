import type { HookManager } from '../../shared/hooks/index.js'

export interface HomepagePublishedEvent {
  pageId: string
  version: number
  editorId: string
}

export interface HomepageAutosavedEvent {
  pageId: string
  version: number
}

export const HOMEPAGE_EVENTS = {
  PUBLISHED: 'homepage:published',
  AUTOSAVED: 'homepage:autosaved',
  RESTORED: 'homepage:restored',
} as const

export function registerHomepageHooks(hooks: HookManager) {
  hooks.register(HOMEPAGE_EVENTS.PUBLISHED, async (data) => {
    const event = data as HomepagePublishedEvent
    // Hook point for cache invalidation, notifications, etc.
    void event
  })
}
