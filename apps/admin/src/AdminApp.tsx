import type { AuthUser } from '@iorder/contracts'
import { Boxes, FileText, Home, Image as ImageIcon, LayoutDashboard, ListTree, LogOut, PanelLeftClose, PanelLeftOpen, Settings, Star, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import logoIorder from './assets/logo.png'
import logoIorderMark from './assets/logo-circle.jpg'
import { getSession, login, logout } from './api'
import { Dashboard } from './Dashboard'
import { HomepageEditor } from './HomepageEditor'
import { LoginForm } from './LoginForm'
import { MediaLibrary } from './MediaLibrary'
import { NavigationEditor } from './NavigationEditor'
import { OfferingsManager } from './OfferingsManager'
import { PartnersManager } from './PartnersManager'
import { PostsManager } from './PostsManager'
import { SiteProfileEditor } from './SiteProfileEditor'
import { TestimonialsManager } from './TestimonialsManager'
import { ToastHost } from './toast'

const navigation = [
  { key: 'dashboard', slug: '', label: 'Tổng quan', icon: LayoutDashboard, group: 'content' },
  { key: 'homepage', slug: 'trang-chu', label: 'Trang chủ', icon: Home, group: 'content' },
  { key: 'offerings', slug: 'phan-mem', label: 'Phần mềm & Giải pháp', icon: Boxes, group: 'content' },
  { key: 'posts', slug: 'bai-viet', label: 'Bài viết', icon: FileText, group: 'content' },
  { key: 'partners', slug: 'doi-tac', label: 'Đối tác & Khách hàng', icon: Users, group: 'content' },
  { key: 'testimonials', slug: 'danh-gia', label: 'Đánh giá khách hàng', icon: Star, group: 'content' },
  { key: 'media', slug: 'thu-vien', label: 'Ảnh & tài liệu', icon: ImageIcon, group: 'content' },
  { key: 'navigation', slug: 'menu', label: 'Menu điều hướng', icon: ListTree, group: 'config' },
  { key: 'settings', slug: 'cai-dat', label: 'Cài đặt website', icon: Settings, group: 'config' },
] as const

const groups: { id: string; label: string }[] = [
  { id: 'content', label: 'Quản trị nội dung' },
  { id: 'config', label: 'Cấu hình website' },
]

const slugByKey: Record<string, string> = Object.fromEntries(navigation.map((item) => [item.key, item.slug]))
const keyBySlug: Record<string, string> = Object.fromEntries(navigation.map((item) => [item.slug, item.key]))

const errorMessages: Record<string, string> = {
  INVALID_CREDENTIALS: 'Tên đăng nhập hoặc mật khẩu không đúng.',
  API_UNAVAILABLE: 'Không kết nối được CMS API. Hãy kiểm tra dịch vụ tại cổng 4000.',
  NO_CMS_ROLE: 'Tài khoản chưa được cấp quyền CMS.',
  TOO_MANY_REQUESTS: 'Bạn đã thử quá nhiều lần. Vui lòng chờ một phút.',
}

export function AdminApp() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('admin.sidebar.collapsed') === '1')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { section } = useParams()
  const isLoginRoute = section === 'login'
  const activeModule = (section && keyBySlug[section]) || 'dashboard'

  const goTo = (key: string) => {
    const slug = slugByKey[key] ?? ''
    navigate(slug ? `/${slug}` : '/')
  }

  const toggleSidebar = () => setCollapsed((value) => {
    const next = !value
    localStorage.setItem('admin.sidebar.collapsed', next ? '1' : '0')
    return next
  })

  useEffect(() => {
    getSession().then((session) => setUser(session.user)).catch(() => setUser(null)).finally(() => setIsLoading(false))
  }, [])

  // Điều hướng theo trạng thái đăng nhập: chưa đăng nhập → /login; đã đăng nhập mà ở /login → /
  useEffect(() => {
    if (isLoading) return
    if (!user && !isLoginRoute) navigate('/login', { replace: true })
    if (user && isLoginRoute) navigate('/', { replace: true })
  }, [isLoading, user, isLoginRoute, navigate])

  const handleLogin = async (username: string, password: string) => {
    setIsSubmitting(true); setError('')
    try { const session = await login(username, password); setUser(session.user); navigate('/', { replace: true }) }
    catch (loginError) { const code = loginError instanceof Error ? loginError.message : 'UNKNOWN'; setError(errorMessages[code] ?? 'Không thể đăng nhập. Vui lòng thử lại.') }
    finally { setIsSubmitting(false) }
  }

  const handleLogout = async () => { await logout().catch(() => undefined); setUser(null); navigate('/login', { replace: true }) }

  if (isLoading) return <main className="admin-shell"><p>Đang kiểm tra phiên đăng nhập...</p></main>
  if (!user) {
    if (!isLoginRoute) return <main className="admin-shell"><p>Đang chuyển tới trang đăng nhập...</p></main>
    return <main className="admin-shell"><section className="admin-card login-card"><img className="login-logo" src={logoIorder} alt="iOrder" /><p className="admin-kicker">Hệ thống quản trị nội dung</p><h1>Đăng nhập quản trị</h1><p>Quản lý nội dung website iOrder. Hệ thống này độc lập với tài khoản POS.</p><LoginForm error={error} isSubmitting={isSubmitting} onSubmit={handleLogin} /></section></main>
  }

  let content: React.ReactNode
  switch (activeModule) {
    case 'homepage': content = <HomepageEditor />; break
    case 'offerings': content = <OfferingsManager />; break
    case 'posts': content = <PostsManager />; break
    case 'partners': content = <PartnersManager />; break
    case 'testimonials': content = <TestimonialsManager />; break
    case 'media': content = <MediaLibrary />; break
    case 'navigation': content = <NavigationEditor />; break
    case 'settings': content = <SiteProfileEditor />; break
    default: content = <Dashboard onOpen={goTo} />
  }

  return <div className={`admin-workspace${collapsed ? ' is-collapsed' : ''}`}>
    <aside className="admin-sidebar">
      <div className="sidebar-header">
        <span className={`sidebar-logo-badge${collapsed ? ' is-mark' : ''}`}>
          <img src={collapsed ? logoIorderMark : logoIorder} alt="iOrder" />
        </span>
        <button type="button" className="sidebar-toggle" onClick={toggleSidebar} title={collapsed ? 'Mở rộng menu' : 'Thu gọn menu'} aria-label={collapsed ? 'Mở rộng menu' : 'Thu gọn menu'}>
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>
      <p className="sidebar-brand-sub">Quản trị nội dung</p>
      <nav aria-label="Chức năng quản trị">
        {groups.map((group) => (
          <div className="nav-group" key={group.id}>
            <p className="nav-group-label">{group.label}</p>
            {navigation.filter((item) => item.group === group.id).map((item) => (
              <button className={activeModule === item.key ? 'is-active' : ''} key={item.key} type="button" title={item.label} onClick={() => goTo(item.key)}>
                <item.icon size={18} /> <span>{item.label}</span>
              </button>
            ))}
          </div>
        ))}
      </nav>
      <div className="sidebar-account">
        <span>{user.fullName}</span>
        <small>@{user.username}</small>
        <button type="button" title="Đăng xuất" onClick={() => void handleLogout()}><LogOut size={16} /> <span>Đăng xuất</span></button>
      </div>
    </aside>
    <main className="admin-main">{content}</main>
    <ToastHost />
  </div>
}
