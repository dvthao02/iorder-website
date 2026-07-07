import { LogOut } from 'lucide-react'

// Thông tin tài khoản + nút đăng xuất ở đáy sidebar (con của Sidebar).
export function SidebarAccount({
  fullName,
  username,
  onLogout,
}: {
  fullName: string
  username: string
  onLogout: () => void
}) {
  return (
    <div className="sidebar-account">
      <span>{fullName}</span>
      <small>@{username}</small>
      <button type="button" title="Đăng xuất" onClick={onLogout}>
        <LogOut size={16} /> <span>Đăng xuất</span>
      </button>
    </div>
  )
}
