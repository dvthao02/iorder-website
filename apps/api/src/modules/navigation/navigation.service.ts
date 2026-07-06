import type { MenuItemInput } from '@iorder/contracts'

import {
  ContentLinkNotFoundError,
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
      { label: 'Hỗ trợ cài đặt', url: '/ho-tro/cai-dat', sortOrder: 0 },
      { label: 'FAQ', url: '/ho-tro/faq', sortOrder: 1 },
      { label: 'Video hướng dẫn', url: '/ho-tro/video', sortOrder: 2 },
      { label: 'Liên hệ hỗ trợ', url: '/lien-he', sortOrder: 3 },
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

  async createMenu(name: string, location: string) {
    const existing = await this.repository.findMenuByLocation(location)
    if (existing) throw new MenuLocationTakenError()
    const created = await this.repository.createMenu(name, location)
    return { statusCode: 201, item: { ...created, items: [] } }
  }

  async seedDefaults() {
    const created: string[] = []
    for (const menuDef of DEFAULT_MENUS) {
      const items = menuDef.location === 'main-nav' ? MAIN_NAV_ITEMS : []
      const existing = await this.repository.findMenuByLocation(menuDef.location)
      if (!existing) {
        const newMenu = await this.repository.seedDefaultMenu(menuDef, items)
        if (newMenu) created.push(menuDef.location)
        continue
      }

      // Menu đã có → chỉ bổ sung các mục chuẩn còn thiếu, giữ nguyên chỉnh sửa của user.
      const added = await this.repository.addMissingMenuItems(existing.id, items)
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

  async upsertMenuItem(location: string, itemId: string, input: MenuItemInput) {
    const menu = await this.repository.findMenuByLocation(location)
    if (!menu) throw new MenuNotFoundError()

    if (itemId === 'new') {
      const created = await this.repository.createMenuItem(menu.id, input)
      return { statusCode: 201, item: { ...created, children: [] } }
    }

    const existing = await this.repository.findMenuItem(menu.id, itemId)
    if (!existing) throw new MenuItemNotFoundError()

    const updated = await this.repository.updateMenuItem(itemId, input)
    return { statusCode: 200, item: { ...updated, children: [] } }
  }

  async deleteMenuItem(location: string, itemId: string) {
    const menu = await this.repository.findMenuByLocation(location)
    if (!menu) throw new MenuNotFoundError()
    await this.repository.deleteMenuItem(menu.id, itemId)
  }

  async listLinkGroups() {
    return { items: await this.repository.listLinkGroups() }
  }

  async upsertContentLink(code: string, linkId: string, body: Record<string, unknown>) {
    const group = await this.repository.findLinkGroupByCode(code)
    if (!group) throw new LinkGroupNotFoundError()

    const input = { ...body, groupId: group.id } as Record<string, unknown> & { groupId: string }

    if (linkId === 'new') {
      const created = await this.repository.createContentLink({
        groupId: group.id,
        label: input.label as string,
        url: input.url as string,
        type: (input.type as ContentLinkRecord['type']) ?? 'external',
        target: (input.target as ContentLinkRecord['target']) ?? '_self',
        icon: (input.icon as string | null) ?? null,
        sortOrder: (input.sortOrder as number) ?? 0,
        isEnabled: (input.isEnabled as boolean) ?? true,
      })
      return { statusCode: 201, item: created }
    }

    const existing = await this.repository.findContentLink(group.id, linkId)
    if (!existing) throw new ContentLinkNotFoundError()

    const updated = await this.repository.updateContentLink(linkId, {
      label: input.label as string,
      url: input.url as string,
      type: (input.type as ContentLinkRecord['type']) ?? existing.type,
      target: (input.target as ContentLinkRecord['target']) ?? existing.target,
      icon: (input.icon as string | null) ?? null,
      sortOrder: (input.sortOrder as number) ?? existing.sortOrder,
      isEnabled: (input.isEnabled as boolean) ?? existing.isEnabled,
    })
    return { statusCode: 200, item: updated }
  }

  async deleteContentLink(code: string, linkId: string) {
    const group = await this.repository.findLinkGroupByCode(code)
    if (!group) throw new LinkGroupNotFoundError()
    await this.repository.deleteContentLink(group.id, linkId)
  }
}
