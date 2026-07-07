import { ChevronDown, type LucideIcon } from 'lucide-react'

import { SidebarNavItem } from './SidebarNavItem'

// 1 nhóm mục trong sidebar, vd "Quản trị nội dung" (con của SidebarNav, cha của SidebarNavItem).
// Tiêu đề nhóm (khi có label) là 1 button collapse/expand — trạng thái do SidebarNav quản lý
// (lưu localStorage + tự mở khi nhóm chứa mục đang active).
export function SidebarNavGroup({
  id,
  label,
  items,
  activeKey,
  badges,
  onNavigate,
  expanded,
  onToggleExpanded,
}: {
  id: string
  label: string
  items: ReadonlyArray<{ key: string; label: string; icon: LucideIcon }>
  activeKey: string
  badges: Record<string, number>
  onNavigate: (key: string) => void
  expanded: boolean
  onToggleExpanded: (id: string) => void
}) {
  const panelId = `sidebar-group-panel-${id}`

  return (
    <div className="nav-group">
      {label && (
        <button
          type="button"
          className={`sidebar-group-header${expanded ? ' sidebar-group-header--expanded' : ''}`}
          aria-expanded={expanded}
          aria-controls={panelId}
          onClick={() => onToggleExpanded(id)}
        >
          <span className="nav-group-label">{label}</span>
          <ChevronDown className="sidebar-chevron" size={14} />
        </button>
      )}
      {(!label || expanded) && (
        <div className="nav-group-items" id={panelId}>
          {items.map((item) => (
            <SidebarNavItem
              key={item.key}
              label={item.label}
              icon={item.icon}
              isActive={activeKey === item.key}
              badge={badges[item.key]}
              onClick={() => onNavigate(item.key)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
