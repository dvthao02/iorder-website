import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowRight, Home, Search } from 'lucide-react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { setPageSeo } from '../utils/seo'
import logoMain from '../assets/header/logo.png'
import logoFooter from '../assets/header/logo.png'

const SUGGESTIONS = [
  { label: 'Trang chủ', to: '/' },
  { label: 'Phần mềm', to: '/phan-mem' },
  { label: 'Giải pháp', to: '/giai-phap' },
  { label: 'Dịch vụ', to: '/dich-vu' },
  { label: 'Tin tức', to: '/tin-tuc' },
  { label: 'Liên hệ', to: '/lien-he' },
]

export default function NotFound() {
  const [activeDropdown, setActiveDropdown] = useState(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setPageSeo({
      title: 'Không tìm thấy trang (404) - iOrder',
      description: 'Trang bạn tìm không tồn tại hoặc đã được di chuyển.',
      noindex: true,
    })
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
        logoMain={logoMain}
        solutionPages={[]}
        servicePages={[]}
      />

      <main>
        <section className="notfound-section">
          <div className="container notfound-box">
            <p className="notfound-code">404</p>
            <h1>Không tìm thấy trang</h1>
            <p className="notfound-lead">
              Trang <code>{location.pathname}</code> không tồn tại hoặc đã được di chuyển.
              Bạn thử quay lại trang chủ hoặc chọn một mục bên dưới.
            </p>

            <div className="notfound-actions">
              <Link to="/" className="btn large primary">
                <Home size={18} /> <span>Về trang chủ</span>
              </Link>
              <Link to="/lien-he" className="btn large ghost">
                <span>Liên hệ hỗ trợ</span> <ArrowRight size={18} />
              </Link>
            </div>

            <div className="notfound-suggest">
              <p><Search size={16} /> Có thể bạn đang tìm:</p>
              <div className="notfound-links">
                {SUGGESTIONS.map((item) => (
                  <Link key={item.to} to={item.to}>{item.label}</Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer logoFooter={logoFooter} />
    </div>
  )
}
