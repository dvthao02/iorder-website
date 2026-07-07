import type { LucideIcon } from 'lucide-react'

// 1 mục trong sidebar (con của SidebarNavGroup).
export function SidebarNavItem({
  label,
  icon: Icon,
  isActive,
  badge,
  onClick,
}: {
  label: string
  icon: LucideIcon
  isActive: boolean
  badge?: number | undefined
  onClick: () => void
}) {
  return (
    <button className={isActive ? 'is-active' : ''} type="button" title={label} onClick={onClick}>
      <Icon size={18} /> <span>{label}</span>
      {(badge ?? 0) > 0 && <span className="nav-badge">{badge}</span>}
    </button>
  )
}
