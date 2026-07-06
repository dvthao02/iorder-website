import type { CmsRole } from '@iorder/contracts'

import { SidebarHeader } from './SidebarHeader'
import { SidebarNav } from './SidebarNav'

// Component cha của toàn bộ sidebar admin — ghép Header (logo/thu gọn), Nav (điều hướng) và Account (tài khoản).
export function Sidebar({
  collapsed,
  onToggleCollapsed,
  activeKey,
  badges,
  onNavigate,
  roles,
}: {
  collapsed: boolean
  onToggleCollapsed: () => void
  activeKey: string
  badges: Record<string, number>
  onNavigate: (key: string) => void
  roles: CmsRole[]
}) {
  return (
    <aside className="admin-sidebar">
      <SidebarHeader collapsed={collapsed} onToggle={onToggleCollapsed} />
      <SidebarNav activeKey={activeKey} badges={badges} onNavigate={onNavigate} roles={roles} />
    </aside>
  )
}
