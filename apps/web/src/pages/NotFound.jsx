import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, RotateCcw } from 'lucide-react'
import PageLayout from '../components/PageLayout'
import { setPageSeo } from '../utils/seo'

export default function NotFound() {
  const location = useLocation()

  useEffect(() => {
    setPageSeo({
      title: 'Không tìm thấy trang (404) - iOrder',
      description: 'Trang bạn tìm không tồn tại hoặc đã được di chuyển.',
      noindex: true,
    })
  }, [location.pathname])

  return (
    <PageLayout>
      <section className="notfound-section">
        <div className="container notfound-box">
          <p className="notfound-code">404</p>
          <h1>Không tìm thấy trang</h1>
          <p className="notfound-lead">
            Trang bạn đang tìm kiếm có thể đã bị xóa, đổi tên hoặc tạm thời không khả dụng.
          </p>

          <div className="notfound-actions">
            <Link to="/" className="btn primary notfound-home">
              <RotateCcw size={19} />
              <span>Quay về trang chủ</span>
              <Home size={18} />
            </Link>
          </div>
        </div>
      </section>
    </PageLayout>
  )
}
