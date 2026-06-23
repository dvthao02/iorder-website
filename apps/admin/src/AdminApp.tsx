import type { AuthUser } from '@iorder/contracts'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

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
  { key: 'dashboard', slug: '', label: 'Tổng quan' },
  { key: 'homepage', slug: 'trang-chu', label: 'Trang chủ' },
  { key: 'offerings', slug: 'phan-mem', label: 'Phần mềm & Giải pháp' },
  { key: 'posts', slug: 'bai-viet', label: 'Bài viết' },
  { key: 'partners', slug: 'doi-tac', label: 'Đối tác & Khách hàng' },
  { key: 'media', slug: 'thu-vien', label: 'Ảnh & tài liệu' },
  { key: 'navigation', slug: 'menu', label: 'Menu điều hướng' },
  { key: 'settings', slug: 'cai-dat', label: 'Cài đặt website' },
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
    return <main className="admin-shell"><section className="admin-card login-card"><p className="admin-kicker">iOrder CMS</p><h1>Đăng nhập quản trị</h1><p>Quản lý nội dung website iOrder. Hệ thống này độc lập với tài khoản POS.</p><LoginForm error={error} isSubmitting={isSubmitting} onSubmit={handleLogin} /></section></main>
  }

  const back = () => goTo('dashboard')
  let content: React.ReactNode
  switch (activeModule) {
    case 'homepage': content = <HomepageEditor onBack={back} />; break
    case 'offerings': content = <OfferingsManager onBack={back} />; break
    case 'posts': content = <PostsManager onBack={back} />; break
    case 'partners': content = <PartnersManager onBack={back} />; break
    case 'media': content = <MediaLibrary onBack={back} />; break
    case 'navigation': content = <NavigationEditor onBack={back} />; break
    case 'settings': content = <SiteProfileEditor onBack={back} />; break
    default: content = <Dashboard onOpen={goTo} />
  }

  return <div className="admin-workspace">
    <aside className="admin-sidebar">
      <div><p className="admin-kicker">iOrder CMS</p><strong>Quản trị nội dung</strong></div>
      <nav aria-label="Chức năng quản trị">{navigation.map((item) => <button className={activeModule === item.key ? 'is-active' : ''} key={item.key} type="button" onClick={() => goTo(item.key)}>{item.label}</button>)}</nav>
      <div className="sidebar-account"><span>{user.fullName}</span><small>@{user.username}</small><button type="button" onClick={() => void handleLogout()}>Đăng xuất</button></div>
    </aside>
    <main className="admin-main">{content}</main>
  </div>
}
