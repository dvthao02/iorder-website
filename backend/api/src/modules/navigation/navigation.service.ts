import type { ContentLinkUpsertInput, MenuItemInput } from '@iorder/contracts'

import {
  ContentLinkNotFoundError,
  InvalidMenuItemParentError,
  LinkGroupNotFoundError,
  MenuItemNotFoundError,
  MenuLocationTakenError,
  MenuNotFoundError,
  MenuNotFoundPublicError,
} from './navigation.errors.js'
import {
  serializeItem,
  type ContentLinkRecord,
  type NavigationRepository,
  type SeedMenuItem,
} from './navigation.repository.js'

const DEFAULT_MENUS = [
  { name: 'Menu chính', location: 'main-nav' },
  { name: 'Footer', location: 'footer-nav' },
]

// Cấu trúc chuẩn khớp header trang người dùng: Trang chủ → Phần mềm → Giải pháp → Dịch vụ → Tin tức → Hỗ trợ.
// Dropdown của Phần mềm/Giải pháp/Dịch vụ lấy nội dung từ Offerings nên không có mục con ở đây.
const MAIN_NAV_ITEMS: SeedMenuItem[] = [
  { label: 'Trang chủ', url: '/', sortOrder: 0 },
  { label: 'Phần mềm', url: '/phan-mem', sortOrder: 1 },
  { label: 'Giải pháp', url: '/giai-phap', sortOrder: 2 },
  { label: 'Dịch vụ', url: '/dich-vu', sortOrder: 3 },
  { label: 'Tin tức', url: '/tin-tuc', sortOrder: 4 },
  {
    label: 'Hỗ trợ',
    url: '/ho-tro',
    sortOrder: 5,
    children: [
      { label: 'Hướng dẫn sử dụng', url: '/huong-dan', sortOrder: 0 },
      { label: 'Hỗ trợ cài đặt', url: '/ho-tro/cai-dat', sortOrder: 1 },
      { label: 'FAQ', url: '/ho-tro/faq', sortOrder: 2 },
      { label: 'Video hướng dẫn', url: '/ho-tro/video', sortOrder: 3 },
      { label: 'Liên hệ hỗ trợ', url: '/lien-he', sortOrder: 4 },
    ],
  },
]

export class NavigationService {
  constructor(private repository: NavigationRepository) {}

  async getPublicMenu(location: string) {
    const menu = await this.repository.getMenuWithItems(location, true)
    if (!menu) throw new MenuNotFoundPublicError()
    return { id: menu.id, name: menu.name, location: menu.location, items: menu.items.map(serializeItem) }
  }

  async getPublicLinkGroup(code: string) {
    const group = await this.repository.findLinkGroupByCode(code)
    if (!group) throw new MenuNotFoundPublicError()
    const links = await this.repository.listEnabledLinks(group.id)
    return { id: group.id, code: group.code, name: group.name, links }
  }

  async createMenu(name: string, location: string, editorId: string) {
    const existing = await this.repository.findMenuByLocation(location)
    if (existing) throw new MenuLocationTakenError()
    const created = await this.repository.createMenu(name, location)
    if (!created) throw new Error('Menu was not created')
    await this.repository.insertAuditLog({
      userId: editorId,
      action: 'navigation.menu.create',
      entityType: 'menu',
      entityId: created.id,
      afterData: { id: created.id, name: created.name, location: created.location },
    })
    return { statusCode: 201, item: { ...created, items: [] } }
  }

  async seedDefaults(editorId: string) {
    const created: string[] = []
    for (const menuDef of DEFAULT_MENUS) {
      const items = menuDef.location === 'main-nav' ? MAIN_NAV_ITEMS : []
      const existing = await this.repository.findMenuByLocation(menuDef.location)
      if (!existing) {
        const newMenu = await this.repository.seedDefaultMenu(menuDef, items)
        if (newMenu) {
          created.push(menuDef.location)
          await this.repository.insertAuditLog({
            userId: editorId,
            action: 'navigation.menu.seed',
            entityType: 'menu',
            entityId: newMenu.id,
            afterData: { id: newMenu.id, name: newMenu.name, location: newMenu.location, seeded: true },
          })
        }
        continue
      }

      // Menu đã có → chỉ bổ sung các mục chuẩn còn thiếu, giữ nguyên chỉnh sửa của user.
      const added = await this.repository.addMissingMenuItems(existing.id, items)
      if (added > 0) {
        await this.repository.insertAuditLog({
          userId: editorId,
          action: 'navigation.menu.seed',
          entityType: 'menu',
          entityId: existing.id,
          afterData: { id: existing.id, location: existing.location, addedItems: added, seeded: true },
        })
      }
      created.push(added > 0 ? `${menuDef.location} (+${added} mục)` : `${menuDef.location} (đủ mục)`)
    }
    return { statusCode: 201, created }
  }

  async listMenus() {
    const menus = await this.repository.listMenus()
    return { items: menus.map((m) => ({ ...m, items: m.items.map(serializeItem) })) }
  }

  async getMenu(location: string) {
    const menu = await this.repository.getMenuWithItems(location)
    if (!menu) throw new MenuNotFoundError()
    return { id: menu.id, name: menu.name, location: menu.location, items: menu.items.map(serializeItem) }
  }

  async upsertMenuItem(location: string, itemId: string, input: MenuItemInput, editorId: string) {
    const menu = await this.repository.findMenuByLocation(location)
    if (!menu) throw new MenuNotFoundError()

    if (input.parentId) {
      const parent = await this.repository.findMenuItem(menu.id, input.parentId)
      if (!parent || (itemId !== 'new' && (input.parentId === itemId || await this.repository.wouldCreateMenuItemCycle(menu.id, itemId, input.parentId)))) {
        throw new InvalidMenuItemParentError()
      }
    }

    if (itemId === 'new') {
      const created = await this.repository.createMenuItem(menu.id, input)
      if (!created) throw new Error('Menu item was not created')
      await this.repository.insertAuditLog({
        userId: editorId,
        action: 'navigation.item.create',
        entityType: 'menu_item',
        entityId: created.id,
        afterData: serializeItem(created),
      })
      return { statusCode: 201, item: { ...created, children: [] } }
    }

    const existing = await this.repository.findMenuItem(menu.id, itemId)
    if (!existing) throw new MenuItemNotFoundError()

    const updated = await this.repository.updateMenuItem(itemId, input)
    if (!updated) throw new MenuItemNotFoundError()
    await this.repository.insertAuditLog({
      userId: editorId,
      action: 'navigation.item.update',
      entityType: 'menu_item',
      entityId: updated.id,
      beforeData: serializeItem(existing),
      afterData: serializeItem(updated),
    })
    return { statusCode: 200, item: { ...updated, children: [] } }
  }

  async deleteMenuItem(location: string, itemId: string, editorId: string) {
    const menu = await this.repository.findMenuByLocation(location)
    if (!menu) throw new MenuNotFoundError()
    const existing = await this.repository.findMenuItem(menu.id, itemId)
    if (!existing) throw new MenuItemNotFoundError()
    await this.repository.deleteMenuItem(menu.id, itemId)
    await this.repository.insertAuditLog({
      userId: editorId,
      action: 'navigation.item.delete',
      entityType: 'menu_item',
      entityId: itemId,
      beforeData: serializeItem(existing),
    })
  }

  async listLinkGroups() {
    return { items: await this.repository.listLinkGroups() }
  }

  async upsertContentLink(code: string, linkId: string, input: ContentLinkUpsertInput, editorId: string) {
    const group = await this.repository.findLinkGroupByCode(code)
    if (!group) throw new LinkGroupNotFoundError()

    if (linkId === 'new') {
      const created = await this.repository.createContentLink({
        groupId: group.id,
        label: input.label,
        url: input.url,
        type: input.type as ContentLinkRecord['type'],
        target: input.target as ContentLinkRecord['target'],
        icon: input.icon,
        sortOrder: input.sortOrder,
        isEnabled: input.isEnabled,
      })
      if (!created) throw new Error('Content link was not created')
      await this.repository.insertAuditLog({
        userId: editorId,
        action: 'navigation.link.create',
        entityType: 'content_link',
        entityId: created.id,
        afterData: created,
      })
      return { statusCode: 201, item: created }
    }

    const existing = await this.repository.findContentLink(group.id, linkId)
    if (!existing) throw new ContentLinkNotFoundError()

    const updated = await this.repository.updateContentLink(linkId, {
      label: input.label,
      url: input.url,
      type: input.type as ContentLinkRecord['type'],
      target: input.target as ContentLinkRecord['target'],
      icon: input.icon,
      sortOrder: input.sortOrder,
      isEnabled: input.isEnabled,
    })
    if (!updated) throw new ContentLinkNotFoundError()
    await this.repository.insertAuditLog({
      userId: editorId,
      action: 'navigation.link.update',
      entityType: 'content_link',
      entityId: updated.id,
      beforeData: existing,
      afterData: updated,
    })
    return { statusCode: 200, item: updated }
  }

  async deleteContentLink(code: string, linkId: string, editorId: string) {
    const group = await this.repository.findLinkGroupByCode(code)
    if (!group) throw new LinkGroupNotFoundError()
    const existing = await this.repository.findContentLink(group.id, linkId)
    if (!existing) throw new ContentLinkNotFoundError()
    await this.repository.deleteContentLink(group.id, linkId)
    await this.repository.insertAuditLog({
      userId: editorId,
      action: 'navigation.link.delete',
      entityType: 'content_link',
      entityId: linkId,
      beforeData: existing,
    })
  }
}
