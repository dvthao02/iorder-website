import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'

import logoIorderMark from '../assets/logo-circle.jpg'
import logoIorder from '../assets/logo.png'

// Logo + nút thu gọn/mở rộng sidebar (con của Sidebar).
export function SidebarHeader({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  return (
    <div className="sidebar-header">
      <span className={`sidebar-logo-badge${collapsed ? ' is-mark' : ''}`}>
        <img src={collapsed ? logoIorderMark : logoIorder} alt="iOrder" />
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
