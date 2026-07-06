import { externalLinks } from '../../data/siteContent'

// Cụm nút "Đăng nhập / Đăng ký dùng thử" bên phải header (desktop).
export default function HeaderActions() {
  return (
    <div className="nav-actions">
      <a className="btn outline" href={externalLinks.appLogin} target="_blank" rel="noreferrer">
        Đăng nhập
      </a>

      <a className="btn primary" href={externalLinks.trial} target="_blank" rel="noreferrer">
        Đăng ký dùng thử
      </a>
    </div>
  )
}
