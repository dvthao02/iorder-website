import type { AuthUser } from '@iorder/contracts'
import { useEffect, useState } from 'react'

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

const navigation = [
  { key: 'dashboard', label: 'Tổng quan' },
  { key: 'homepage', label: 'Trang chủ' },
  { key: 'offerings', label: 'Phần mềm & Giải pháp' },
  { key: 'posts', label: 'Bài viết' },
  { key: 'partners', label: 'Đối tác & Khách hàng' },
  { key: 'media', label: 'Ảnh & tài liệu' },
  { key: 'navigation', label: 'Menu điều hướng' },
  { key: 'settings', label: 'Cài đặt website' },
]

const errorMessages: Record<string, string> = {
  INVALID_CREDENTIALS: 'Tên đăng nhập hoặc mật khẩu không đúng.',
  API_UNAVAILABLE: 'Không kết nối được CMS API. Hãy kiểm tra dịch vụ tại cổng 4000.',
  NO_CMS_ROLE: 'Tài khoản chưa được cấp quyền CMS.',
  TOO_MANY_REQUESTS: 'Bạn đã thử quá nhiều lần. Vui lòng chờ một phút.',
}

export function AdminApp() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [activeModule, setActiveModule] = useState('dashboard')

  useEffect(() => {
    getSession().then((session) => setUser(session.user)).catch(() => setUser(null)).finally(() => setIsLoading(false))
  }, [])

  const handleLogin = async (username: string, password: string) => {
    setIsSubmitting(true); setError('')
    try { const session = await login(username, password); setUser(session.user) }
    catch (loginError) { const code = loginError instanceof Error ? loginError.message : 'UNKNOWN'; setError(errorMessages[code] ?? 'Không thể đăng nhập. Vui lòng thử lại.') }
    finally { setIsSubmitting(false) }
  }

  const handleLogout = async () => { await logout().catch(() => undefined); setUser(null); setActiveModule('dashboard') }

  if (isLoading) return <main className="admin-shell"><p>Đang kiểm tra phiên đăng nhập...</p></main>
  if (!user) return <main className="admin-shell"><section className="admin-card login-card"><p className="admin-kicker">iOrder CMS</p><h1>Đăng nhập quản trị</h1><p>Quản lý nội dung website iOrder. Hệ thống này độc lập với tài khoản POS.</p><LoginForm error={error} isSubmitting={isSubmitting} onSubmit={handleLogin} /></section></main>

  let content: React.ReactNode
  switch (activeModule) {
    case 'homepage': content = <HomepageEditor onBack={() => setActiveModule('dashboard')} />; break
    case 'offerings': content = <OfferingsManager onBack={() => setActiveModule('dashboard')} />; break
    case 'posts': content = <PostsManager onBack={() => setActiveModule('dashboard')} />; break
    case 'partners': content = <PartnersManager onBack={() => setActiveModule('dashboard')} />; break
    case 'media': content = <MediaLibrary onBack={() => setActiveModule('dashboard')} />; break
    case 'navigation': content = <NavigationEditor onBack={() => setActiveModule('dashboard')} />; break
    case 'settings': content = <SiteProfileEditor onBack={() => setActiveModule('dashboard')} />; break
    default: content = <Dashboard onOpen={setActiveModule} />
  }

  return <div className="admin-workspace">
    <aside className="admin-sidebar">
      <div><p className="admin-kicker">iOrder CMS</p><strong>Quản trị nội dung</strong></div>
      <nav aria-label="Chức năng quản trị">{navigation.map((item) => <button className={activeModule === item.key ? 'is-active' : ''} key={item.key} type="button" onClick={() => setActiveModule(item.key)}>{item.label}</button>)}</nav>
      <div className="sidebar-account"><span>{user.fullName}</span><small>@{user.username}</small><button type="button" onClick={() => void handleLogout()}>Đăng xuất</button></div>
    </aside>
    <main className="admin-main">{content}</main>
  </div>
}
