import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Menu } from 'lucide-react'
import {
  servicePages as defaultServicePages,
  softwareProducts as defaultSoftwareMenu,
  solutionPages as defaultSolutionPages,
} from '../data/siteContent'
import { fetchMenu, fetchNavOfferings } from '../utils/contentApi'
import HeaderActions from './header/HeaderActions'
import MobileNav from './header/MobileNav'
import ServicesMenu from './header/ServicesMenu'
import SoftwareMenu from './header/SoftwareMenu'
import SolutionsMenu from './header/SolutionsMenu'
import SupportMenu, { SUPPORT_ITEMS } from './header/SupportMenu'

// Cấu trúc header mặc định — dùng khi CMS chưa có menu main-nav (offline/DB trống).
const FALLBACK_NAV = [
  { id: 'home', label: 'Trang chủ', url: '/', children: [] },
  { id: 'software', label: 'Phần mềm', url: '/phan-mem', children: [] },
  { id: 'solutions', label: 'Giải pháp', url: '/giai-phap', children: [] },
  { id: 'services', label: 'Dịch vụ', url: '/dich-vu', children: [] },
  { id: 'news', label: 'Tin tức', url: '/tin-tuc', children: [] },
  {
    id: 'support',
    label: 'Hỗ trợ',
    url: '/ho-tro',
    children: SUPPORT_ITEMS.map((item) => ({ id: item.slug, label: item.title, url: item.href })),
  },
]

export default function Header({
  setActiveDropdown,
  mobileOpen,
  setMobileOpen,
  location,
  logoMain,
  softwareProducts,
  solutionPages,
  servicePages,
}) {
  const [scrolled, setScrolled] = useState(false)
  const [openDropdown, setOpenDropdown] = useState(null)
  const [cmsNav, setCmsNav] = useState(null)
  const [cmsMenu, setCmsMenu] = useState(null)

  useEffect(() => {
    fetchNavOfferings()
      .then(setCmsNav)
      .catch(() => {})
    // Menu main-nav do admin quản lý (Menu điều hướng): nhãn, thứ tự, ẩn/hiện từng mục.
    fetchMenu('main-nav')
      .then(setCmsMenu)
      .catch(() => {})
  }, [])

  useEffect(() => {
    const updateHeaderState = () => {
      setScrolled(window.scrollY > 18)
    }

    updateHeaderState()
    window.addEventListener('scroll', updateHeaderState, { passive: true })

    return () => window.removeEventListener('scroll', updateHeaderState)
  }, [])

  const flattenMenu = (pages, parentPath) => {
    if (!Array.isArray(pages) || pages.length === 0) return []

    return pages.flatMap((page) => {
      if (Array.isArray(page.items) && page.items.length > 0) {
        return page.items.map((child, index) => ({
          slug: child.slug ?? `${page.slug}-${index}`,
          title: typeof child === 'string' ? child : child.title,
          href:
            typeof child === 'string'
              ? `${parentPath}/${page.slug}`
              : (child.href ?? `${parentPath}/${page.slug}/${child.slug}`),
        }))
      }

      return {
        slug: page.slug,
        title: page.title,
        href: page.href ?? `${parentPath}/${page.slug}`,
      }
    })
  }

  const effectiveSoftware =
    cmsNav?.software ?? (Array.isArray(softwareProducts) && softwareProducts.length > 0 ? softwareProducts : null)
  const effectiveSolutions =
    cmsNav?.solutions ?? (Array.isArray(solutionPages) && solutionPages.length > 0 ? solutionPages : null)
  const effectiveServices =
    cmsNav?.services ?? (Array.isArray(servicePages) && servicePages.length > 0 ? servicePages : null)

  const softwareMenu = effectiveSoftware ? flattenMenu(effectiveSoftware, '/phan-mem') : defaultSoftwareMenu
  const solutionsMenu = effectiveSolutions ? flattenMenu(effectiveSolutions, '/giai-phap') : defaultSolutionPages
  const servicesMenu = effectiveServices ? flattenMenu(effectiveServices, '/dich-vu') : defaultServicePages

  // Danh sách mục header: ưu tiên menu CMS (đã lọc mục ẩn, đúng thứ tự), fallback cấu trúc tĩnh.
  const navItems = cmsMenu?.items?.length ? cmsMenu.items : FALLBACK_NAV

  const closeMenu = () => {
    setOpenDropdown(null)
    setActiveDropdown(null)
    setMobileOpen(false)
  }

  const openDropdownFor = (name) => setOpenDropdown(name)

  // Mỗi mục menu render theo URL: 3 mục Offerings dùng dropdown dữ liệu riêng,
  // mục có con (Hỗ trợ) dùng dropdown thường, còn lại là link phẳng.
  const renderNavItem = (item) => {
    const dropdownProps = {
      key: item.id,
      label: item.label,
      isOpen: false,
      isActive: location.pathname.startsWith(item.url),
      onClose: closeMenu,
    }

    switch (item.url) {
      case '/phan-mem':
        return (
          <SoftwareMenu
            {...dropdownProps}
            items={softwareMenu}
            isOpen={openDropdown === 'software'}
            onOpen={() => openDropdownFor('software')}
          />
        )
      case '/giai-phap':
        return (
          <SolutionsMenu
            {...dropdownProps}
            items={solutionsMenu}
            isOpen={openDropdown === 'solutions'}
            onOpen={() => openDropdownFor('solutions')}
          />
        )
      case '/dich-vu':
        return (
          <ServicesMenu
            {...dropdownProps}
            items={servicesMenu}
            isOpen={openDropdown === 'services'}
            onOpen={() => openDropdownFor('services')}
          />
        )
      default:
        if (item.children?.length) {
          return (
            <SupportMenu
              key={item.id}
              label={item.label}
              items={item.children.map((child) => ({ slug: child.id, title: child.label, href: child.url }))}
              isOpen={openDropdown === item.url}
              onOpen={() => openDropdownFor(item.url)}
              onClose={closeMenu}
            />
          )
        }
        return (
          <NavLink key={item.id} className="nav-link" to={item.url} end={item.url === '/'}>
            {item.label}
          </NavLink>
        )
    }
  }

  return (
    <header className={`header ${scrolled ? 'scrolled' : ''}`} onMouseLeave={() => setOpenDropdown(null)}>
      <div className="header-container">
        <Link to="/" className="logo" onClick={closeMenu}>
          <img src={logoMain} alt="iOrder" loading="eager" decoding="sync" fetchPriority="high" />
        </Link>

        <nav className="nav" aria-label="Menu chính">
          {navItems.map(renderNavItem)}
        </nav>

        <HeaderActions />

        <button
          className="menu-btn"
          type="button"
          aria-label="Mở menu"
          onClick={() => setMobileOpen((value) => !value)}
        >
          <Menu size={22} />
        </button>
      </div>

      {mobileOpen ? (
        <MobileNav
          navItems={navItems}
          softwareMenu={softwareMenu}
          solutionsMenu={solutionsMenu}
          servicesMenu={servicesMenu}
          onNavigate={closeMenu}
        />
      ) : null}
    </header>
  )
}
