import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import logo from '../assets/header/logo.png'

// Khung chung cho mọi trang: Header + Footer + state dropdown/mobile.
// Header tự lấy menu từ CMS (fetchNavOfferings), fallback dữ liệu tĩnh khi CMS chưa có
// → không cần truyền nav ở đây. Trang chỉ cần đặt nội dung phần thân vào children.
//   shellClassName: lớp cho div ngoài cùng (mặc định 'page-shell')
//   mainClassName : lớp cho <main>
//   mainProps     : thuộc tính bổ sung cho <main> (vd data-* )
export default function PageLayout({ children, shellClassName = 'page-shell', mainClassName, mainProps }) {
  const [activeDropdown, setActiveDropdown] = useState(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  // Đổi route → đóng dropdown/menu mobile
  useEffect(() => {
    setActiveDropdown(null)
    setMobileOpen(false)
  }, [location.pathname])

  return (
    <div className={shellClassName}>
      <Header
        activeDropdown={activeDropdown}
        setActiveDropdown={setActiveDropdown}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        location={location}
        logoMain={logo}
      />
      <main className={mainClassName} {...mainProps}>
        {children}
      </main>
      <Footer logoFooter={logo} />
    </div>
  )
}
