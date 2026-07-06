import type { CmsRole } from '@iorder/contracts'
import { useEffect, useState } from 'react'

import { navigation, navigationGroups } from './navigation'
import { SidebarNavGroup } from './SidebarNavGroup'

// Nhóm 'config' (menu, cài đặt, người dùng, hoạt động) chỉ dành cho admin — editor không được truy cập.
const ADMIN_ONLY_GROUPS = new Set(['config'])

// Key localStorage lưu danh sách group id đang bị collapse (không phải đang mở —
// mặc định mở khi key chưa tồn tại).
const COLLAPSED_GROUPS_KEY = 'admin.sidebar.collapsedGroups'

function readCollapsedGroups(): Set<string> {
  try {
    const raw = localStorage.getItem(COLLAPSED_GROUPS_KEY)
    if (!raw) return new Set()
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed)
      ? new Set(parsed.filter((value): value is string => typeof value === 'string'))
      : new Set()
  } catch {
    return new Set()
  }
}

function findActiveGroup(activeKey: string): string | undefined {
  return navigation.find((item) => item.key === activeKey)?.group
}

// Toàn bộ danh sách điều hướng của sidebar (con của Sidebar, cha của SidebarNavGroup).
export function SidebarNav({
  activeKey,
  badges,
  onNavigate,
  roles,
}: {
  activeKey: string
  badges: Record<string, number>
  onNavigate: (key: string) => void
  roles: CmsRole[]
}) {
  const isAdmin = roles.includes('admin')
  const visibleGroups = navigationGroups.filter((group) => isAdmin || !ADMIN_ONLY_GROUPS.has(group.id))
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(() => readCollapsedGroups())

  // Khôi phục lại từ localStorage khi mount (đề phòng thay đổi ở tab khác).
  useEffect(() => {
    setCollapsedGroups(readCollapsedGroups())
  }, [])

  const activeGroup = findActiveGroup(activeKey)

  const toggleGroup = (id: string) => {
    setCollapsedGroups((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      localStorage.setItem(COLLAPSED_GROUPS_KEY, JSON.stringify(Array.from(next)))
      return next
    })
  }

  return (
    <nav aria-label="Chức năng quản trị">
      {visibleGroups.map((group) => {
        // Nhóm chứa mục đang active luôn tự mở, không phụ thuộc trạng thái đã lưu
        // và không ghi đè localStorage khi tự mở.
        const expanded = group.id === activeGroup || !collapsedGroups.has(group.id)
        return (
          <SidebarNavGroup
            key={group.id}
            id={group.id}
            label={group.label}
            items={navigation.filter((item) => item.group === group.id)}
            activeKey={activeKey}
            badges={badges}
            onNavigate={onNavigate}
            expanded={expanded}
            onToggleExpanded={toggleGroup}
          />
        )
      })}
    </nav>
  )
}
