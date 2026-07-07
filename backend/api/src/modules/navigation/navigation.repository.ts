import type { MenuItemInput } from '@iorder/contracts'
import type { CmsDatabase } from '@iorder/database'
import { contentLinks, linkGroups, menuItems, menus } from '@iorder/database'
import { and, asc, eq } from 'drizzle-orm'

export type MenuItemRecord = typeof menuItems.$inferSelect & { children?: MenuItemRecord[] }
export type SeedMenuItem = { label: string; url: string; sortOrder: number; children?: SeedMenuItem[] }
export type MenuRecord = typeof menus.$inferSelect
export type LinkGroupRecord = typeof linkGroups.$inferSelect
export type ContentLinkRecord = typeof contentLinks.$inferSelect

export function buildTree(items: (typeof menuItems.$inferSelect)[]): MenuItemRecord[] {
  const map = new Map<string, MenuItemRecord>()
  const roots: MenuItemRecord[] = []

  for (const item of items) {
    map.set(item.id, { ...item, children: [] })
  }
  for (const item of items) {
    const node = map.get(item.id)!
    if (item.parentId && map.has(item.parentId)) {
      map.get(item.parentId)!.children!.push(node)
    } else {
      roots.push(node)
    }
  }
  return roots
}

export function serializeItem(item: MenuItemRecord): Record<string, unknown> {
  return {
    id: item.id,
    menuId: item.menuId,
    parentId: item.parentId,
    label: item.label,
    url: item.url,
    target: item.target,
    icon: item.icon,
    sortOrder: item.sortOrder,
    isEnabled: item.isEnabled,
    children: (item.children ?? []).map(serializeItem),
  }
}

export class NavigationRepository {
  constructor(private db: CmsDatabase) {}

  async findMenuByLocation(location: string) {
    const [menu] = await this.db.select().from(menus).where(eq(menus.location, location)).limit(1)
    return menu ?? null
  }

  async getMenuWithItems(location: string, enabledOnly = false) {
    const menu = await this.findMenuByLocation(location)
    if (!menu) return null

    const filters = [eq(menuItems.menuId, menu.id)]
    if (enabledOnly) filters.push(eq(menuItems.isEnabled, true))

    const items = await this.db
      .select()
      .from(menuItems)
      .where(and(...filters))
      .orderBy(asc(menuItems.sortOrder))
    return { ...menu, items: buildTree(items) }
  }

  async listMenus() {
    const allMenus = await this.db.select().from(menus).orderBy(asc(menus.location))
    return Promise.all(
      allMenus.map(async (m) => {
        const items = await this.db
          .select()
          .from(menuItems)
          .where(eq(menuItems.menuId, m.id))
          .orderBy(asc(menuItems.sortOrder))
        return { ...m, items: buildTree(items) }
      }),
    )
  }

  async createMenu(name: string, location: string) {
    const [created] = await this.db.insert(menus).values({ name, location }).returning()
    return created ?? null
  }

  async seedDefaultMenu(menuDef: { name: string; location: string }, items: SeedMenuItem[]) {
    const [newMenu] = await this.db.insert(menus).values(menuDef).returning()
    if (!newMenu) return null
    await this.insertSeedItems(newMenu.id, items, null)
    return newMenu
  }

  private async insertSeedItems(menuId: string, items: SeedMenuItem[], parentId: string | null) {
    for (const item of items) {
      const [created] = await this.db
        .insert(menuItems)
        .values({ menuId, parentId, label: item.label, url: item.url, sortOrder: item.sortOrder, isEnabled: true })
        .returning()
      if (created && item.children?.length) await this.insertSeedItems(menuId, item.children, created.id)
    }
  }

  // Bổ sung các mục chuẩn còn thiếu (so theo URL) vào menu đã tồn tại — không đụng mục user đã sửa.
  async addMissingMenuItems(menuId: string, items: SeedMenuItem[]) {
    const existing = await this.db.select().from(menuItems).where(eq(menuItems.menuId, menuId))
    const byUrl = new Map(existing.map((item) => [item.url, item]))
    let added = 0

    for (const item of items) {
      let parent = byUrl.get(item.url)
      if (!parent) {
        const [created] = await this.db
          .insert(menuItems)
          .values({ menuId, label: item.label, url: item.url, sortOrder: item.sortOrder, isEnabled: true })
          .returning()
        if (!created) continue
        parent = created
        byUrl.set(item.url, created)
        added += 1
      }
      for (const child of item.children ?? []) {
        if (byUrl.has(child.url)) continue
        const [created] = await this.db
          .insert(menuItems)
          .values({
            menuId,
            parentId: parent.id,
            label: child.label,
            url: child.url,
            sortOrder: child.sortOrder,
            isEnabled: true,
          })
          .returning()
        if (!created) continue
        byUrl.set(child.url, created)
        added += 1
      }
    }
    return added
  }

  async findMenuItem(menuId: string, itemId: string) {
    const [item] = await this.db
      .select()
      .from(menuItems)
      .where(and(eq(menuItems.id, itemId), eq(menuItems.menuId, menuId)))
      .limit(1)
    return item ?? null
  }

  async createMenuItem(menuId: string, input: MenuItemInput) {
    const [created] = await this.db
      .insert(menuItems)
      .values({ menuId, ...input })
      .returning()
    return created ?? null
  }

  async updateMenuItem(itemId: string, input: MenuItemInput) {
    const [updated] = await this.db
      .update(menuItems)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(menuItems.id, itemId))
      .returning()
    return updated ?? null
  }

  async deleteMenuItem(menuId: string, itemId: string) {
    await this.db.delete(menuItems).where(and(eq(menuItems.id, itemId), eq(menuItems.menuId, menuId)))
  }

  async findLinkGroupByCode(code: string) {
    const [group] = await this.db.select().from(linkGroups).where(eq(linkGroups.code, code)).limit(1)
    return group ?? null
  }

  async listLinkGroups() {
    const groups = await this.db.select().from(linkGroups).orderBy(asc(linkGroups.code))
    return Promise.all(
      groups.map(async (g) => {
        const links = await this.db
          .select()
          .from(contentLinks)
          .where(eq(contentLinks.groupId, g.id))
          .orderBy(asc(contentLinks.sortOrder))
        return { ...g, links }
      }),
    )
  }

  async listEnabledLinks(groupId: string) {
    return this.db
      .select()
      .from(contentLinks)
      .where(and(eq(contentLinks.groupId, groupId), eq(contentLinks.isEnabled, true)))
      .orderBy(asc(contentLinks.sortOrder))
  }

  async findContentLink(groupId: string, linkId: string) {
    const [link] = await this.db
      .select()
      .from(contentLinks)
      .where(and(eq(contentLinks.id, linkId), eq(contentLinks.groupId, groupId)))
      .limit(1)
    return link ?? null
  }

  async createContentLink(data: {
    groupId: string
    label: string
    url: string
    type: ContentLinkRecord['type']
    target: ContentLinkRecord['target']
    icon: string | null
    sortOrder: number
    isEnabled: boolean
  }) {
    const [created] = await this.db.insert(contentLinks).values(data).returning()
    return created ?? null
  }

  async updateContentLink(
    linkId: string,
    data: {
      label: string
      url: string
      type: ContentLinkRecord['type']
      target: ContentLinkRecord['target']
      icon: string | null
      sortOrder: number
      isEnabled: boolean
    },
  ) {
    const [updated] = await this.db
      .update(contentLinks)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(contentLinks.id, linkId))
      .returning()
    return updated ?? null
  }

  async deleteContentLink(groupId: string, linkId: string) {
    await this.db.delete(contentLinks).where(and(eq(contentLinks.id, linkId), eq(contentLinks.groupId, groupId)))
  }
}
