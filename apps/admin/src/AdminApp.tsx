import type { AuthUser } from '@iorder/contracts'
import { useEffect, useState } from 'react'
import { Bell, ChevronDown, KeyRound, LogOut, UserCircle } from 'lucide-react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

import logoIorder from './assets/logo.png'
import { changePassword, getLeads, getSession, listOfferings, listPosts, login, logout } from './api'
import { ContentPagesManager } from './ContentPagesManager'
import { Dashboard } from './Dashboard'
import { DownloadsManager } from './DownloadsManager'
import { HomepageEditor } from './HomepageEditor'
import { LeadsManager } from './LeadsManager'
import { LoginForm } from './LoginForm'
import { MediaLibrary } from './MediaLibrary'
import { NavigationEditor } from './NavigationEditor'
import { OfferingsManager } from './OfferingsManager'
import { PartnersManager } from './PartnersManager'
import { PostsManager } from './PostsManager'
import { Sidebar } from './sidebar/Sidebar'
import { keyBySlug, slugByKey } from './sidebar/navigation'
import { type SettingsTab, SettingsPage } from './SettingsPage'
import { TestimonialsManager } from './TestimonialsManager'
import { ToastHost, toast } from './toast'
import { ModalShell } from './ui'

// Slug con của trang Cài đặt — 'cai-dat' (tab mặc định), 'cai-dat/nguoi-dung', 'cai-dat/hoat-dong'.
// Vì AdminApp dùng 1 param route ':section' (không phải React Router lồng nhau thật), ta
// so khớp prefix thủ công trên chuỗi section thay vì thêm route con.
const SETTINGS_SLUG = 'cai-dat'
const SETTINGS_TAB_SLUGS: Record<string, SettingsTab> = {
  [SETTINGS_SLUG]: 'profile',
  [`${SETTINGS_SLUG}/nguoi-dung`]: 'users',
  [`${SETTINGS_SLUG}/hoat-dong`]: 'activity',
}
const SETTINGS_SLUG_BY_TAB: Record<SettingsTab, string> = {
  profile: SETTINGS_SLUG,
  users: `${SETTINGS_SLUG}/nguoi-dung`,
  activity: `${SETTINGS_SLUG}/hoat-dong`,
}
// Slug cũ độc lập của UsersManager/ActivityLog trước khi gộp vào tab Cài đặt — giữ lại để
// redirect, tránh vỡ bookmark cũ.
const LEGACY_SETTINGS_REDIRECTS: Record<string, SettingsTab> = {
  'nguoi-dung': 'users',
  'hoat-dong': 'activity',
}

const errorMessages: Record<string, string> = {
  INVALID_CREDENTIALS: 'Tên đăng nhập hoặc mật khẩu không đúng.',
  API_UNAVAILABLE: 'Không kết nối được CMS API. Hãy kiểm tra dịch vụ tại cổng 4000.',
  NO_CMS_ROLE: 'Tài khoản chưa được cấp quyền CMS.',
  TOO_MANY_REQUESTS: 'Bạn đã thử quá nhiều lần. Vui lòng chờ một phút.',
}

type ModuleHeader = { title: string; description?: string }

const defaultModuleHeader: ModuleHeader = {
  title: 'Tổng quan CMS iOrder',
  description: 'Theo dõi nội dung và tình trạng website một cách trực quan.',
}

const moduleHeaders: Record<string, ModuleHeader> = {
  dashboard: {
    title: 'Tổng quan CMS iOrder',
    description: 'Theo dõi nội dung và tình trạng website một cách trực quan.',
  },
  homepage: {
    title: 'Trang chủ',
    description: 'Quản lý nội dung, section và trạng thái xuất bản của trang chủ.',
  },
  software: {
    title: 'Phần mềm',
    description: 'Quản lý phần mềm hiển thị trên website.',
  },
  solutions: {
    title: 'Giải pháp',
    description: 'Quản lý giải pháp hiển thị trên website.',
  },
  services: {
    title: 'Dịch vụ',
    description: 'Quản lý dịch vụ hiển thị trên website.',
  },
  industries: {
    title: 'Ngành hàng',
    description: 'Quản lý ngành hàng hiển thị trên website.',
  },
  posts: {
    title: 'Bài viết',
    description: 'Tạo tin tức hoặc bài khuyến mãi, lưu nháp rồi xuất bản.',
  },
  downloads: {
    title: 'Hỗ trợ cài đặt',
    description: 'Quản lý tài liệu tải về và file hỗ trợ cài đặt.',
  },
  'content-pages': {
    title: 'Trang nội dung',
    description: 'Quản lý các trang nội dung tĩnh (FAQ, hướng dẫn, hỗ trợ...) hiển thị trên website.',
  },
  partners: {
    title: 'Đối tác & Khách hàng',
    description: 'Quản lý logo đối tác, khách hàng và vị trí hiển thị trên website.',
  },
  testimonials: {
    title: 'Đánh giá khách hàng',
    description: 'Lời chứng thực hiển thị ở mục khách hàng nói gì trên trang chủ.',
  },
  leads: {
    title: 'Khách liên hệ',
    description: 'Xem và xử lý lead thu được từ form liên hệ trên website.',
  },
  media: {
    title: 'Tài liệu và hình ảnh',
    description: 'Quản lý ảnh, tài liệu và metadata dùng trên website.',
  },
  navigation: {
    title: 'Menu & Điều hướng',
    description: 'Sắp xếp menu điều hướng và các nhóm liên kết hiển thị trên website.',
  },
  settings: {
    title: 'Cài đặt website',
    description: 'Thông tin công ty, người dùng CMS và nhật ký hoạt động.',
  },
}

export function AdminApp() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('admin.sidebar.collapsed') === '1')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [badges, setBadges] = useState<Record<string, number>>({})
  const navigate = useNavigate()
  const { section } = useParams()
  const location = useLocation()
  // Bỏ '/admin' basename (đã strip bởi BrowserRouter) và dấu '/' đầu, để có path đầy đủ
  // dùng cho route con dạng 'cai-dat/nguoi-dung' (AdminApp không dùng route lồng thật).
  const fullPath = location.pathname.replace(/^\/+/, '').replace(/\/+$/, '')
  const isLoginRoute = section === 'login'
  const settingsTabFromPath = SETTINGS_TAB_SLUGS[fullPath]
  const legacyRedirectTab = LEGACY_SETTINGS_REDIRECTS[fullPath]
  const activeModule = settingsTabFromPath
    ? 'settings'
    : legacyRedirectTab
      ? 'settings'
      : (section && keyBySlug[section]) || 'dashboard'
  const activeHeader = moduleHeaders[activeModule] ?? defaultModuleHeader
  const notificationCount = Object.values(badges).reduce((total, value) => total + value, 0)
  const notifications = [
    badges.posts ? `${badges.posts} bài viết đang lưu nháp` : null,
    badges.software ? `${badges.software} phần mềm đang lưu nháp` : null,
    badges.solutions ? `${badges.solutions} giải pháp đang lưu nháp` : null,
    badges.services ? `${badges.services} dịch vụ đang lưu nháp` : null,
    badges.industries ? `${badges.industries} ngành hàng đang lưu nháp` : null,
    badges.leads ? `${badges.leads} khách liên hệ mới` : null,
  ].filter(Boolean) as string[]

  const goTo = (key: string) => {
    const slug = slugByKey[key] ?? ''
    navigate(slug ? `/${slug}` : '/')
  }

  const toggleSidebar = () =>
    setCollapsed((value) => {
      const next = !value
      localStorage.setItem('admin.sidebar.collapsed', next ? '1' : '0')
      return next
    })

  useEffect(() => {
    getSession()
      .then((session) => setUser(session.user))
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false))
  }, [])

  useEffect(() => {
    if (!user) {
      setBadges({})
      return
    }
    Promise.all([
      listPosts().then((res) => res.items.filter((p) => p.status === 'draft').length),
      listOfferings('software', 'draft').then((res) => res.total),
      listOfferings('solution', 'draft').then((res) => res.total),
      listOfferings('service', 'draft').then((res) => res.total),
      listOfferings('industry', 'draft').then((res) => res.total),
      getLeads({ status: 'new', limit: 1 }).then((res) => res.totalNew),
    ])
      .then(([posts, software, solutions, services, industries, leads]) =>
        setBadges({ posts, software, solutions, services, industries, leads }),
      )
      .catch(() => undefined)
  }, [user, activeModule])

  // Điều hướng theo trạng thái đăng nhập: chưa đăng nhập → /login; đã đăng nhập mà ở /login → /
  useEffect(() => {
    if (isLoading) return
    if (!user && !isLoginRoute) navigate('/login', { replace: true })
    if (user && isLoginRoute) navigate('/', { replace: true })
    if (user && section && !isLoginRoute && !keyBySlug[section] && !settingsTabFromPath && !legacyRedirectTab)
      navigate('/', { replace: true })
  }, [isLoading, user, section, isLoginRoute, navigate, settingsTabFromPath, legacyRedirectTab])

  // Bookmark cũ 'nguoi-dung' / 'hoat-dong' (khi 2 trang này còn độc lập) → chuyển sang tab
  // tương ứng trong 'cai-dat/...' để không vỡ link đã lưu.
  useEffect(() => {
    if (isLoading || !user || !legacyRedirectTab) return
    navigate(`/${SETTINGS_SLUG_BY_TAB[legacyRedirectTab]}`, { replace: true })
  }, [isLoading, user, legacyRedirectTab, navigate])

  const activeSettingsTab: SettingsTab = settingsTabFromPath ?? 'profile'
  const goToSettingsTab = (tab: SettingsTab) => navigate(`/${SETTINGS_SLUG_BY_TAB[tab]}`)

  const handleLogin = async (username: string, password: string) => {
    setIsSubmitting(true)
    try {
      const session = await login(username, password)
      setUser(session.user)
      navigate('/', { replace: true })
    } catch (loginError) {
      const code = loginError instanceof Error ? loginError.message : 'UNKNOWN'
      toast.error(errorMessages[code] ?? 'Không thể đăng nhập. Vui lòng thử lại.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLogout = async () => {
    await logout().catch(() => undefined)
    setUser(null)
    navigate('/login', { replace: true })
  }

  if (isLoading)
    return (
      <main className="admin-shell">
        <p>Đang kiểm tra phiên đăng nhập...</p>
      </main>
    )
  if (!user) {
    if (!isLoginRoute)
      return (
        <main className="admin-shell">
          <p>Đang chuyển tới trang đăng nhập...</p>
        </main>
      )
    return (
      <main className="admin-shell">
        <section className="admin-card login-card">
          <img className="login-logo" src={logoIorder} alt="iOrder" />
          <p className="admin-kicker">Hệ thống quản trị nội dung</p>
          <h1>Đăng nhập quản trị</h1>
          <p>Quản lý nội dung website iOrder. Hệ thống này độc lập với tài khoản POS.</p>
          <LoginForm isSubmitting={isSubmitting} onSubmit={handleLogin} />
        </section>
        <ToastHost />
      </main>
    )
  }

  let content: React.ReactNode
  switch (activeModule) {
    case 'homepage':
      content = <HomepageEditor />
      break
    case 'software':
      content = <OfferingsManager key="software" type="software" />
      break
    case 'solutions':
      content = <OfferingsManager key="solution" type="solution" />
      break
    case 'services':
      content = <OfferingsManager key="service" type="service" />
      break
    case 'industries':
      content = <OfferingsManager key="industry" type="industry" />
      break
    case 'posts':
      content = <PostsManager currentUser={user} />
      break
    case 'partners':
      content = <PartnersManager />
      break
    case 'testimonials':
      content = <TestimonialsManager />
      break
    case 'leads':
      content = <LeadsManager />
      break
    case 'downloads':
      content = <DownloadsManager />
      break
    case 'content-pages':
      content = <ContentPagesManager />
      break
    case 'media':
      content = <MediaLibrary />
      break
    case 'navigation':
      content = <NavigationEditor />
      break
    case 'settings':
      content = (
        <SettingsPage
          activeTab={activeSettingsTab}
          onTabChange={goToSettingsTab}
          isAdmin={user.roles.includes('admin')}
        />
      )
      break
    default:
      content = <Dashboard onOpen={goTo} />
  }

  return (
    <div className={`admin-workspace${collapsed ? ' is-collapsed' : ''}`}>
      <Sidebar
        collapsed={collapsed}
        onToggleCollapsed={toggleSidebar}
        activeKey={activeModule}
        badges={badges}
        onNavigate={goTo}
        roles={user.roles}
      />
      <main className="admin-main">
        <AdminTopbar
          title={activeHeader.title}
          description={activeHeader.description}
          notificationCount={notificationCount}
          notifications={notifications}
          user={user}
          onLogout={() => void handleLogout()}
        />
        {content}
      </main>
      <ToastHost />
    </div>
  )
}

function AdminTopbar({
  title,
  description,
  notificationCount,
  notifications,
  user,
  onLogout,
}: {
  title: string
  description?: string | undefined
  notificationCount: number
  notifications: string[]
  user: AuthUser
  onLogout: () => void
}) {
  const [accountOpen, setAccountOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const displayName = user.fullName || user.username

  const openChangePassword = () => {
    setAccountOpen(false)
    setCurrentPassword('')
    setNewPassword('')
    setConfirmNewPassword('')
    setChangePasswordOpen(true)
  }

  const submitChangePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (newPassword !== confirmNewPassword) {
      toast.error('Mật khẩu mới và xác nhận không khớp.')
      return
    }
    setIsChangingPassword(true)
    try {
      await changePassword(currentPassword, newPassword)
      setChangePasswordOpen(false)
      toast.success('Đã đổi mật khẩu. Các phiên đăng nhập khác đã bị đăng xuất.')
    } catch (error) {
      const code = error instanceof Error ? error.message : ''
      toast.error(code === 'INVALID_CURRENT_PASSWORD' ? 'Mật khẩu hiện tại không đúng.' : 'Không thể đổi mật khẩu.')
    } finally {
      setIsChangingPassword(false)
    }
  }
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

  return (
    <header className="admin-topbar">
      <div className="admin-topbar-inner">
        <div className="admin-topbar-title">
          <h1>{title}</h1>
          {description ? <p>{description}</p> : null}
        </div>
        <div className="admin-topbar-actions">
          <div className="admin-notification-wrap">
            <button
              type="button"
              className="admin-icon-button"
              title="Thông báo"
              aria-label="Thông báo"
              aria-haspopup="menu"
              aria-expanded={notificationsOpen}
              onClick={() => {
                setAccountOpen(false)
                setNotificationsOpen((value) => !value)
              }}
            >
              <Bell size={18} />
              {notificationCount > 0 ? <span className="admin-notification-badge">{notificationCount}</span> : null}
            </button>
            {notificationsOpen ? (
              <div className="admin-notification-menu" role="menu">
                <strong>Thông báo</strong>
                {notifications.length ? (
                  notifications.map((item) => (
                    <button key={item} type="button" role="menuitem">
                      <span />
                      {item}
                    </button>
                  ))
                ) : (
                  <p>Không có thông báo mới.</p>
                )}
              </div>
            ) : null}
          </div>
          <div className="admin-account-wrap">
            <button
              type="button"
              className="admin-account-button"
              aria-haspopup="menu"
              aria-expanded={accountOpen}
              onClick={() => {
                setNotificationsOpen(false)
                setAccountOpen((value) => !value)
              }}
            >
              <span className="admin-account-avatar">{initials || <UserCircle size={18} />}</span>
              <span className="admin-account-copy">
                <strong>{displayName}</strong>
                <small>@{user.username}</small>
              </span>
              <ChevronDown size={16} />
            </button>
            {accountOpen ? (
              <>
                <span className="admin-account-backdrop" onClick={() => setAccountOpen(false)} />
                <div className="admin-account-menu" role="menu">
                  <div className="admin-account-menu-head">
                    <strong>{displayName}</strong>
                    <small>@{user.username}</small>
                  </div>
                  <button type="button" role="menuitem" onClick={openChangePassword}>
                    <KeyRound size={15} /> Đổi mật khẩu
                  </button>
                  <button type="button" role="menuitem" onClick={onLogout}>
                    <LogOut size={15} /> Đăng xuất
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {changePasswordOpen ? (
        <ModalShell
          as="form"
          onSubmit={(event) => void submitChangePassword(event)}
          onOverlayClick={() => setChangePasswordOpen(false)}
          header={
            <>
              <button type="button" className="modal-back" onClick={() => setChangePasswordOpen(false)}>
                ← Trở về
              </button>
              <h2>Đổi mật khẩu</h2>
            </>
          }
          footer={
            <>
              <button type="button" className="secondary-button" onClick={() => setChangePasswordOpen(false)}>
                Hủy
              </button>
              <button className="btn-primary" disabled={isChangingPassword} type="submit">
                {isChangingPassword ? 'Đang lưu...' : 'Đổi mật khẩu'}
              </button>
            </>
          }
        >
          <label>
            Mật khẩu hiện tại
            <input
              required
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
            />
          </label>
          <label>
            Mật khẩu mới
            <input
              required
              type="password"
              minLength={10}
              autoComplete="new-password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
            />
          </label>
          <label>
            Xác nhận mật khẩu mới
            <input
              required
              type="password"
              minLength={10}
              autoComplete="new-password"
              value={confirmNewPassword}
              onChange={(event) => setConfirmNewPassword(event.target.value)}
            />
          </label>
        </ModalShell>
      ) : null}
    </header>
  )
}
