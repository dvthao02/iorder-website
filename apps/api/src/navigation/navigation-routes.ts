import { contentIdSchema, menuItemInputSchema } from '@iorder/contracts'
import type { CmsDatabase } from '@iorder/database'
import { contentLinks, linkGroups, menuItems, menus } from '@iorder/database'
import { and, asc, eq } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'

import { createAuthGuard, requireCmsUser } from '../auth/auth-guard.js'

type MenuItemRecord = typeof menuItems.$inferSelect & { children?: MenuItemRecord[] }

function buildTree(items: (typeof menuItems.$inferSelect)[]): MenuItemRecord[] {
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

function serializeItem(item: MenuItemRecord): Record<string, unknown> {
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

async function getMenuWithItems(db: CmsDatabase, location: string, enabledOnly = false) {
  const [menu] = await db.select().from(menus).where(eq(menus.location, location)).limit(1)
  if (!menu) return null

  const filters = [eq(menuItems.menuId, menu.id)]
  if (enabledOnly) filters.push(eq(menuItems.isEnabled, true))

  const items = await db.select().from(menuItems).where(and(...filters)).orderBy(asc(menuItems.sortOrder))
  return { ...menu, items: buildTree(items) }
}

export function registerNavigationRoutes(app: FastifyInstance, { db }: { db: CmsDatabase }) {
  const authGuard = createAuthGuard(db)

  // ── Public: get menu by location ──────────────────────────────────────────
  app.get('/api/public/menus/:location', async (request, reply) => {
    const { location } = request.params as { location: string }
    const menu = await getMenuWithItems(db, location, true)
    if (!menu) return reply.code(404).send({ error: 'NOT_FOUND' })
    return {
      id: menu.id,
      name: menu.name,
      location: menu.location,
      items: menu.items.map(serializeItem),
    }
  })

  // ── Public: get link group by code ────────────────────────────────────────
  app.get('/api/public/link-groups/:code', async (request, reply) => {
    const { code } = request.params as { code: string }
    const [group] = await db.select().from(linkGroups).where(eq(linkGroups.code, code)).limit(1)
    if (!group) return reply.code(404).send({ error: 'NOT_FOUND' })

    const links = await db.select().from(contentLinks).where(and(eq(contentLinks.groupId, group.id), eq(contentLinks.isEnabled, true))).orderBy(asc(contentLinks.sortOrder))
    return { id: group.id, code: group.code, name: group.name, links }
  })

  // ── Admin: create menu ────────────────────────────────────────────────────
  app.post('/api/admin/menus', { preHandler: [authGuard] }, async (request, reply) => {
    requireCmsUser(request)
    const { name, location } = request.body as { name: string; location: string }
    if (!name || !location) return reply.code(400).send({ error: 'MISSING_FIELDS' })
    const [existing] = await db.select().from(menus).where(eq(menus.location, location)).limit(1)
    if (existing) return reply.code(409).send({ error: 'LOCATION_TAKEN' })
    const [created] = await db.insert(menus).values({ name, location }).returning()
    return reply.code(201).send({ item: { ...created, items: [] } })
  })

  // ── Admin: seed default navigation ───────────────────────────────────────
  app.post('/api/admin/menus/seed-defaults', { preHandler: [authGuard] }, async (request, reply) => {
    requireCmsUser(request)

    const defaultMenus = [
      { name: 'Menu chính', location: 'main-nav' },
      { name: 'Footer', location: 'footer-nav' },
    ]

    const mainNavItems = [
      { label: 'Trang chủ', url: '/', sortOrder: 0 },
      { label: 'Phần mềm', url: '/phan-mem', sortOrder: 1 },
      { label: 'Giải pháp', url: '/giai-phap', sortOrder: 2 },
      { label: 'Dịch vụ', url: '/dich-vu', sortOrder: 3 },
      { label: 'Tin tức', url: '/tin-tuc', sortOrder: 4 },
      { label: 'Hỗ trợ', url: '/ho-tro', sortOrder: 5 },
    ]

    const created: string[] = []

    for (const menuDef of defaultMenus) {
      const [existing] = await db.select().from(menus).where(eq(menus.location, menuDef.location)).limit(1)
      if (existing) { created.push(`${menuDef.location} (đã tồn tại)`); continue }

      const [newMenu] = await db.insert(menus).values(menuDef).returning()
      if (!newMenu) continue
      if (menuDef.location === 'main-nav') {
        for (const item of mainNavItems) {
          await db.insert(menuItems).values({ menuId: newMenu.id, ...item, isEnabled: true })
        }
      }
      created.push(menuDef.location)
    }

    return reply.code(201).send({ created })
  })

  // ── Admin: list all menus ─────────────────────────────────────────────────
  app.get('/api/admin/menus', { preHandler: [authGuard] }, async (request) => {
    requireCmsUser(request)
    const allMenus = await db.select().from(menus).orderBy(asc(menus.location))
    const withItems = await Promise.all(allMenus.map(async (m) => {
      const items = await db.select().from(menuItems).where(eq(menuItems.menuId, m.id)).orderBy(asc(menuItems.sortOrder))
      return { ...m, items: buildTree(items) }
    }))
    return { items: withItems.map((m) => ({ ...m, items: m.items.map(serializeItem) })) }
  })

  // ── Admin: get single menu ────────────────────────────────────────────────
  app.get('/api/admin/menus/:location', { preHandler: [authGuard] }, async (request, reply) => {
    requireCmsUser(request)
    const { location } = request.params as { location: string }
    const menu = await getMenuWithItems(db, location)
    if (!menu) return reply.code(404).send({ error: 'NOT_FOUND' })
    return { id: menu.id, name: menu.name, location: menu.location, items: menu.items.map(serializeItem) }
  })

  // ── Admin: upsert menu item ───────────────────────────────────────────────
  app.put('/api/admin/menus/:location/items/:itemId', { preHandler: [authGuard] }, async (request, reply) => {
    requireCmsUser(request)
    const { location, itemId } = request.params as { location: string; itemId: string }
    const [menu] = await db.select().from(menus).where(eq(menus.location, location)).limit(1)
    if (!menu) return reply.code(404).send({ error: 'MENU_NOT_FOUND' })

    const body = menuItemInputSchema.safeParse(request.body)
    if (!body.success) return reply.code(400).send({ error: 'VALIDATION_ERROR', issues: body.error.issues })
    const input = body.data

    if (itemId === 'new') {
      const [created] = await db.insert(menuItems).values({ menuId: menu.id, ...input }).returning()
      return reply.code(201).send({ item: { ...created, children: [] } })
    }

    const [existing] = await db.select().from(menuItems).where(and(eq(menuItems.id, itemId), eq(menuItems.menuId, menu.id))).limit(1)
    if (!existing) return reply.code(404).send({ error: 'ITEM_NOT_FOUND' })

    const [updated] = await db.update(menuItems).set({ ...input, updatedAt: new Date() }).where(eq(menuItems.id, itemId)).returning()
    return { item: { ...updated, children: [] } }
  })

  // ── Admin: delete menu item ───────────────────────────────────────────────
  app.delete('/api/admin/menus/:location/items/:itemId', { preHandler: [authGuard] }, async (request, reply) => {
    requireCmsUser(request)
    const { location, itemId } = request.params as { location: string; itemId: string }
    const [menu] = await db.select().from(menus).where(eq(menus.location, location)).limit(1)
    if (!menu) return reply.code(404).send({ error: 'MENU_NOT_FOUND' })
    await db.delete(menuItems).where(and(eq(menuItems.id, itemId), eq(menuItems.menuId, menu.id)))
    return reply.code(204).send()
  })

  // ── Admin: list link groups ───────────────────────────────────────────────
  app.get('/api/admin/link-groups', { preHandler: [authGuard] }, async (request) => {
    requireCmsUser(request)
    const groups = await db.select().from(linkGroups).orderBy(asc(linkGroups.code))
    const withLinks = await Promise.all(groups.map(async (g) => {
      const links = await db.select().from(contentLinks).where(eq(contentLinks.groupId, g.id)).orderBy(asc(contentLinks.sortOrder))
      return { ...g, links }
    }))
    return { items: withLinks }
  })

  // ── Admin: upsert content link ────────────────────────────────────────────
  app.put('/api/admin/link-groups/:code/links/:linkId', { preHandler: [authGuard] }, async (request, reply) => {
    requireCmsUser(request)
    const { code, linkId } = request.params as { code: string; linkId: string }
    const [group] = await db.select().from(linkGroups).where(eq(linkGroups.code, code)).limit(1)
    if (!group) return reply.code(404).send({ error: 'GROUP_NOT_FOUND' })

    const bodySchema = menuItemInputSchema.omit({ parentId: true, target: true }).extend({
      groupId: contentIdSchema.optional(),
      type: menuItemInputSchema.shape.target.optional(),
      target: menuItemInputSchema.shape.target.optional(),
    })
    const body = request.body as Record<string, unknown>
    const input = { ...body, groupId: group.id } as Record<string, unknown> & { groupId: string }

    if (linkId === 'new') {
      const [created] = await db.insert(contentLinks).values({
        groupId: group.id,
        label: input.label as string,
        url: input.url as string,
        type: (input.type as typeof contentLinks.type._.data) ?? 'external',
        target: (input.target as typeof contentLinks.target._.data) ?? '_self',
        icon: (input.icon as string | null) ?? null,
        sortOrder: (input.sortOrder as number) ?? 0,
        isEnabled: (input.isEnabled as boolean) ?? true,
      }).returning()
      return reply.code(201).send({ item: created })
    }

    const [existing] = await db.select().from(contentLinks).where(and(eq(contentLinks.id, linkId), eq(contentLinks.groupId, group.id))).limit(1)
    if (!existing) return reply.code(404).send({ error: 'LINK_NOT_FOUND' })

    const [updated] = await db.update(contentLinks).set({
      label: input.label as string,
      url: input.url as string,
      type: (input.type as typeof contentLinks.type._.data) ?? existing.type,
      target: (input.target as typeof contentLinks.target._.data) ?? existing.target,
      icon: (input.icon as string | null) ?? null,
      sortOrder: (input.sortOrder as number) ?? existing.sortOrder,
      isEnabled: (input.isEnabled as boolean) ?? existing.isEnabled,
      updatedAt: new Date(),
    }).where(eq(contentLinks.id, linkId)).returning()
    return { item: updated }
  })

  // ── Admin: delete content link ────────────────────────────────────────────
  app.delete('/api/admin/link-groups/:code/links/:linkId', { preHandler: [authGuard] }, async (request, reply) => {
    requireCmsUser(request)
    const { code, linkId } = request.params as { code: string; linkId: string }
    const [group] = await db.select().from(linkGroups).where(eq(linkGroups.code, code)).limit(1)
    if (!group) return reply.code(404).send({ error: 'GROUP_NOT_FOUND' })
    await db.delete(contentLinks).where(and(eq(contentLinks.id, linkId), eq(contentLinks.groupId, group.id)))
    return reply.code(204).send()
  })
}
