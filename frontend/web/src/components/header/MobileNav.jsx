import { Link, NavLink } from 'react-router-dom'
import { externalLinks } from '../../data/siteContent'

// Toàn bộ menu mobile (drawer) — render theo cùng navItems với header desktop.
export default function MobileNav({ navItems, softwareMenu, solutionsMenu, servicesMenu, onNavigate }) {
  const offeringsByUrl = {
    '/phan-mem': softwareMenu,
    '/giai-phap': solutionsMenu,
    '/dich-vu': servicesMenu,
  }

  return (
    <div className="mobile-nav">
      <div className="container mobile-nav-panel">
        {navItems.map((item) => {
          const offeringLinks = offeringsByUrl[item.url]
          if (offeringLinks) {
            return (
              <div className="mobile-menu-group" key={item.id}>
                <Link to={item.url} className="mobile-menu-title" onClick={onNavigate}>
                  {item.label}
                </Link>
                <div className="mobile-menu-links">
                  {offeringLinks.map((link) => (
                    <Link key={link.slug} to={link.href} onClick={onNavigate}>
                      {link.title}
                    </Link>
                  ))}
                </div>
              </div>
            )
          }

          if (item.children?.length) {
            return (
              <div className="mobile-menu-group" key={item.id}>
                <div className="mobile-menu-title mobile-menu-title-icon">{item.label}</div>
                <div className="mobile-menu-links">
                  {item.children.map((child) => (
                    <Link key={child.id} to={child.url} onClick={onNavigate}>
                      {child.label}
                    </Link>
                  ))}
                </div>
              </div>
            )
          }

          return (
            <NavLink key={item.id} to={item.url} end={item.url === '/'} onClick={onNavigate}>
              {item.label}
            </NavLink>
          )
        })}

        <div className="mobile-nav-actions">
          <a className="btn outline" href={externalLinks.appLogin} target="_blank" rel="noreferrer">
            Đăng nhập
          </a>

          <a className="btn primary" href={externalLinks.trial} target="_blank" rel="noreferrer">
            Dùng thử miễn phí
          </a>
        </div>
      </div>
    </div>
  )
}
