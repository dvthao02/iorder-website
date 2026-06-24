import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import logo from '../assets/header/logo.png'

// Khung chung cho mọi trang: Header + Footer + state dropdown/mobile.
// Header tự lấy menu từ CMS (fetchNavOfferings), fallback dữ liệu tĩnh khi CMS chưa có
// → không cần truyền nav ở đây. Trang chỉ cần đặt nội dung phần thân vào children.
export default function PageLayout({ children }) {
  const [activeDropdown, setActiveDropdown] = useState(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  // Đổi route → đóng dropdown/menu mobile
  useEffect(() => {
    setActiveDropdown(null)
    setMobileOpen(false)
  }, [location.pathname])

  return (
    <div className="page-shell">
      <Header
        activeDropdown={activeDropdown}
        setActiveDropdown={setActiveDropdown}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        location={location}
        logoMain={logo}
      />
      <main>{children}</main>
      <Footer logoFooter={logo} />
    </div>
  )
}
