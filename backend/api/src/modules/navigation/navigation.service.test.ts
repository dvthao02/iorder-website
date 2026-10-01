import { describe, expect, it, vi } from 'vitest'

import { ContentLinkNotFoundError, InvalidMenuItemParentError } from './navigation.errors.js'
import type { NavigationRepository } from './navigation.repository.js'
import { NavigationService } from './navigation.service.js'

const menu = { id: '00000000-0000-4000-8000-000000000001', name: 'Menu chính', location: 'main-nav' }
const menuItem = {
  id: '00000000-0000-4000-8000-000000000002',
  menuId: menu.id,
  parentId: null,
  label: 'Trang chủ',
  url: '/',
  target: '_self' as const,
  icon: null,
  sortOrder: 0,
  isEnabled: true,
}
const linkGroup = { id: '00000000-0000-4000-8000-000000000003', code: 'footer', name: 'Footer' }
const contentLink = {
  id: '00000000-0000-4000-8000-000000000004',
  groupId: linkGroup.id,
  label: 'Liên hệ',
  url: '/lien-he',
  type: 'internal' as const,
  target: '_self' as const,
  icon: null,
  sortOrder: 0,
  isEnabled: true,
}

function makeRepository(overrides: Record<string, unknown> = {}) {
  return {
    findMenuByLocation: vi.fn(),
    createMenu: vi.fn(),
    seedDefaultMenu: vi.fn(),
    addMissingMenuItems: vi.fn(),
    findMenuItem: vi.fn(),
    wouldCreateMenuItemCycle: vi.fn().mockResolvedValue(false),
    createMenuItem: vi.fn(),
    updateMenuItem: vi.fn(),
    deleteMenuItem: vi.fn(),
    findLinkGroupByCode: vi.fn(),
    createContentLink: vi.fn(),
    findContentLink: vi.fn(),
    updateContentLink: vi.fn(),
    deleteContentLink: vi.fn(),
    insertAuditLog: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}

describe('NavigationService mutations', () => {
  it('writes an audit log when creating a menu item', async () => {
    const repository = makeRepository({
      findMenuByLocation: vi.fn().mockResolvedValue(menu),
      createMenuItem: vi.fn().mockResolvedValue(menuItem),
    })
    const service = new NavigationService(repository as unknown as NavigationRepository)

    const result = await service.upsertMenuItem('main-nav', 'new', { ...menuItem, parentId: null }, 'editor-1')

    expect(result.statusCode).toBe(201)
    expect(repository.insertAuditLog).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'editor-1', action: 'navigation.item.create', entityId: menuItem.id,
    }))
  })

  it('rejects a parent that would create a menu cycle', async () => {
    const repository = makeRepository({
      findMenuByLocation: vi.fn().mockResolvedValue(menu),
      findMenuItem: vi.fn().mockResolvedValue({ ...menuItem, id: '00000000-0000-4000-8000-000000000005' }),
      wouldCreateMenuItemCycle: vi.fn().mockResolvedValue(true),
    })
    const service = new NavigationService(repository as unknown as NavigationRepository)

    await expect(service.upsertMenuItem('main-nav', menuItem.id, { ...menuItem, parentId: '00000000-0000-4000-8000-000000000005' }, 'editor-1'))
      .rejects.toBeInstanceOf(InvalidMenuItemParentError)
    expect(repository.updateMenuItem).not.toHaveBeenCalled()
  })

  it('validates a link exists before deletion and writes a deletion audit record', async () => {
    const repository = makeRepository({
      findLinkGroupByCode: vi.fn().mockResolvedValue(linkGroup),
      findContentLink: vi.fn().mockResolvedValue(contentLink),
    })
    const service = new NavigationService(repository as unknown as NavigationRepository)

    await service.deleteContentLink('footer', contentLink.id, 'editor-1')

    expect(repository.deleteContentLink).toHaveBeenCalledWith(linkGroup.id, contentLink.id)
    expect(repository.insertAuditLog).toHaveBeenCalledWith(expect.objectContaining({
      action: 'navigation.link.delete', entityId: contentLink.id, beforeData: contentLink,
    }))
  })

  it('does not delete a content link outside the requested group', async () => {
    const repository = makeRepository({
      findLinkGroupByCode: vi.fn().mockResolvedValue(linkGroup),
      findContentLink: vi.fn().mockResolvedValue(null),
    })
    const service = new NavigationService(repository as unknown as NavigationRepository)

    await expect(service.deleteContentLink('footer', contentLink.id, 'editor-1')).rejects.toBeInstanceOf(ContentLinkNotFoundError)
    expect(repository.deleteContentLink).not.toHaveBeenCalled()
  })
})
