import { ActivityLog } from './ActivityLog'
import { SiteProfileEditor } from './SiteProfileEditor'
import { UsersManager } from './UsersManager'

export type SettingsTab = 'profile' | 'users' | 'activity'

const TAB_LABELS: Record<SettingsTab, string> = {
  profile: 'Thông tin website',
  users: 'Người dùng',
  activity: 'Hoạt động',
}

// Trang "Cài đặt" gộp 3 khu vực trước đây là các mục sidebar riêng: thông tin công ty,
// quản lý người dùng và nhật ký hoạt động. Chuyển tab bằng URL (xem AdminApp) — mỗi tab
// chỉ bọc lại component gốc, không sửa nội dung bên trong các component đó.
export function SettingsPage({
  activeTab,
  onTabChange,
  isAdmin,
}: {
  activeTab: SettingsTab
  onTabChange: (tab: SettingsTab) => void
  isAdmin: boolean
}) {
  const tabs: SettingsTab[] = isAdmin ? ['profile', 'users', 'activity'] : ['profile']
  const resolvedTab = tabs.includes(activeTab) ? activeTab : 'profile'

  return (
    <div className="admin-module">
      <div className="tab-nav">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            className={resolvedTab === tab ? 'is-active' : ''}
            onClick={() => onTabChange(tab)}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      {resolvedTab === 'profile' && <SiteProfileEditor />}
      {resolvedTab === 'users' && isAdmin && <UsersManager />}
      {resolvedTab === 'activity' && <ActivityLog />}
    </div>
  )
}
