import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'

import logoIorderMark from '../assets/logo-circle.jpg'

// Logo + nút thu gọn/mở rộng sidebar (con của Sidebar).
export function SidebarHeader({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  return (
    <div className="sidebar-header">
      <span className={`sidebar-logo-badge${collapsed ? ' is-mark' : ''}`}>
        <img src={logoIorderMark} alt="iOrder" />
        {!collapsed ? (
          <span className="sidebar-studio-label">
            <strong>iOrder</strong>
            <small>Content Studio</small>
          </span>
        ) : null}
      </span>
      <button
        type="button"
        className="sidebar-toggle"
        onClick={onToggle}
        title={collapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
        aria-label={collapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
      >
        {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
      </button>
    </div>
  )
}
