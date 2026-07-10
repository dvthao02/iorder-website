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

const HEADER_STYLES = `
/* =========================
   iOrder Premium Header
========================= */

:root {
  --header-height: 76px;
  --primary: #0b8edc;
  --primary-dark: #0669a8;
  --text-main: #101828;
  --text-soft: #475467;
  --border-soft: rgba(226, 232, 240, 0.9);
}

.header {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
  width: 100%;
  background: rgba(255, 255, 255, 0.97);
  border-bottom: 1px solid rgba(226, 232, 240, 0.92);
  box-shadow: 0 16px 42px rgba(15, 23, 42, 0.09);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    backdrop-filter 0.2s ease;
}

.header.scrolled {
  background: rgba(255, 255, 255, 0.97);
  border-bottom-color: rgba(226, 232, 240, 0.92);
  box-shadow: 0 16px 42px rgba(15, 23, 42, 0.09);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
}

.header-container {
  width: min(1440px, calc(100% - var(--container-padding) * 2));
  height: var(--header-height);
  margin-inline: auto;
  display: grid;
  grid-template-columns: 190px minmax(0, 1fr) auto;
  align-items: center;
  gap: 28px;
}

.header.scrolled .header-container {
  background: transparent;
}

.logo {
  display: inline-flex;
  align-items: center;
  justify-self: start;
  min-width: 0;
  text-decoration: none;
}

.logo img {
  display: block;
  width: auto;
  height: 38px;
  max-width: 165px;
  object-fit: contain;
}

.nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-width: 0;
}

.nav-item {
  position: relative;
  display: flex;
  align-items: center;
}

.nav-link,
.nav-trigger {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  height: 40px;
  padding: 0 14px;
  border: 1px solid transparent;
  border-radius: 12px;
  background: transparent;
  color: var(--text-soft);
  font-size: 16.5px;
  font-weight: 600;
  line-height: 1;
  letter-spacing: -0.01em;
  text-decoration: none;
  white-space: nowrap;
  cursor: pointer;
  transition:
    color 0.18s ease,
    background 0.18s ease,
    box-shadow 0.18s ease;
}

.nav-link::after {
  content: '';
  position: absolute;
  left: 16px;
  right: 16px;
  bottom: 4px;
  height: 2px;
  border-radius: 999px;
  background: linear-gradient(90deg, #0b8edc, #24c6dc);
  opacity: 0;
  transform: scaleX(0.45);
  transform-origin: center;
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}

.nav-link:hover,
.nav-link.active {
  color: var(--primary-dark);
}

.nav-link:hover::after,
.nav-link.active::after {
  opacity: 1;
  transform: scaleX(1);
}

.nav-trigger::before {
  content: '';
  position: absolute;
  left: 14px;
  right: 30px;
  bottom: 4px;
  height: 2px;
  border-radius: 999px;
  background: linear-gradient(90deg, #0b8edc, #24c6dc);
  opacity: 0;
  transform: scaleX(0.45);
  transform-origin: center;
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}

.nav-trigger:hover,
.nav-trigger.active,
.nav-item.open > .nav-trigger {
  color: var(--primary-dark);
}

.nav-trigger:hover::before,
.nav-trigger.active::before,
.nav-item.open > .nav-trigger::before {
  opacity: 1;
  transform: scaleX(1);
}

.nav-trigger::after {
  content: '';
  width: 7px;
  height: 7px;
  margin-left: 5px;
  border-right: 2px solid currentColor;
  border-bottom: 2px solid currentColor;
  transform: translateY(-2px) rotate(45deg);
  opacity: 0.65;
  transition:
    transform 0.18s ease,
    opacity 0.18s ease;
}

.nav-item:hover > .nav-trigger::after,
.nav-item.open > .nav-trigger::after {
  transform: translateY(1px) rotate(225deg);
  opacity: 1;
}

.nav-link:focus-visible,
.nav-trigger:focus-visible {
  outline: 3px solid rgba(11, 142, 220, 0.22);
  outline-offset: 3px;
}

/* Dropdown base */
.dropdown-menu {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  z-index: 1200;
  width: max-content;
  min-width: 320px;
  max-width: min(760px, calc(100vw - 32px));
  padding: 12px;
  background: #ffffff;
  border: 1px solid rgba(226, 232, 240, 0.95);
  border-radius: 20px;
  box-shadow:
    0 28px 80px rgba(15, 23, 42, 0.16),
    0 6px 18px rgba(15, 23, 42, 0.05);
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transform: translateY(10px);
  transition:
    opacity 0.18s ease,
    visibility 0.18s ease,
    transform 0.18s ease;
}

.dropdown-menu::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: -6px;
  height: 6px;
}

/* Mũi tên nối liền trigger với dropdown, tránh cảm giác 2 khối tách rời */
.dropdown-menu::after {
  content: '';
  position: absolute;
  top: -6px;
  left: 28px;
  width: 14px;
  height: 14px;
  background: #ffffff;
  border-left: 1px solid rgba(226, 232, 240, 0.95);
  border-top: 1px solid rgba(226, 232, 240, 0.95);
  border-radius: 3px 0 0 0;
  transform: rotate(45deg);
}

.nav-item.has-dropdown::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 100%;
  height: 6px;
  background: transparent;
}

.nav-item:hover > .dropdown-menu,
.nav-item.open > .dropdown-menu {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
  transform: translateY(0);
}

.dropdown-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(220px, 1fr));
  gap: 4px 10px;
}

.dropdown-item {
  position: relative;
  display: flex;
  align-items: center;
  min-height: 38px;
  padding: 7px 11px;
  border-radius: 10px;
  color: #172033;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.28;
  letter-spacing: -0.01em;
  text-decoration: none;
  transition:
    color 0.16s ease,
    background 0.16s ease,
    transform 0.16s ease;
}

.dropdown-item::after {
  content: '';
  position: absolute;
  left: 11px;
  right: 11px;
  bottom: 3px;
  height: 2px;
  border-radius: 999px;
  background: linear-gradient(90deg, #0b8edc, #24c6dc);
  opacity: 0;
  transform: scaleX(0.4);
  transform-origin: left;
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}

.dropdown-item:hover,
.dropdown-item:focus-visible {
  color: var(--primary-dark);
  background: rgba(11, 142, 220, 0.08);
  transform: translateX(3px);
  outline: 0;
}

.dropdown-item:hover::after,
.dropdown-item:focus-visible::after {
  opacity: 1;
  transform: scaleX(1);
}

/* Dropdown sizes: Phần mềm / Giải pháp / Dịch vụ */
.dropdown-menu-software,
.dropdown-menu-solutions,
.dropdown-menu-services {
  min-width: 720px;
  max-width: min(760px, calc(100vw - 32px));
}

.dropdown-grid-2 {
  grid-template-columns: repeat(2, minmax(300px, 1fr));
}

.dropdown-grid-2 .dropdown-item {
  min-width: 0;
  white-space: normal;
  line-height: 1.45;
  text-align: left;
  justify-content: flex-start;
}

.dropdown-grid-single {
  grid-template-columns: 1fr;
}

/* Right buttons */
.nav-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  justify-self: end;
  white-space: nowrap;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 42px;
  padding: 9px 18px;
  border-radius: 999px;
  border: 1px solid transparent;
  font-size: 15.5px;
  font-weight: 600;
  line-height: 1.1;
  text-decoration: none;
  cursor: pointer;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    background 0.18s ease,
    color 0.18s ease,
    border-color 0.18s ease;
}

.btn.outline {
  color: #101828;
  background: #ffffff;
  border-color: rgba(203, 213, 225, 0.95);
}

.btn.outline:hover {
  color: var(--primary-dark);
  border-color: rgba(11, 142, 220, 0.35);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
  transform: translateY(-1px);
}

.btn.primary {
  color: #ffffff;
  background: linear-gradient(135deg, #1597df, #0570b8);
  box-shadow: 0 14px 30px rgba(11, 142, 220, 0.28);
}

.btn.primary:hover {
  background: linear-gradient(135deg, #0e8dd5, #055f9e);
  box-shadow: 0 18px 38px rgba(11, 142, 220, 0.34);
  transform: translateY(-1px);
}

.menu-btn {
  display: none;
  width: 44px;
  height: 44px;
  place-items: center;
  border: 1px solid rgba(203, 213, 225, 0.95);
  border-radius: 12px;
  background: #ffffff;
  color: #101828;
  cursor: pointer;
}

.mobile-nav {
  display: none;
}

@media (max-width: 1180px) {
  .header-container {
    width: calc(100% - 80px);
    grid-template-columns: 170px minmax(0, 1fr) auto;
    gap: 18px;
  }

  .nav-link,
  .nav-trigger {
    padding: 0 12px;
    font-size: 16px;
  }

  .btn {
    padding-inline: 15px;
  }

  .dropdown-menu-software,
  .dropdown-menu-solutions,
  .dropdown-menu-services {
    min-width: 640px;
  }

  .dropdown-grid-2 {
    grid-template-columns: repeat(2, minmax(280px, 1fr));
  }
}

@media (max-width: 1080px) {
  :root {
    --header-height: 72px;
  }

  .header-container {
    width: calc(100% - 28px);
    height: var(--header-height);
    grid-template-columns: auto auto;
    justify-content: space-between;
  }

  .logo img {
    height: 38px;
    max-width: 150px;
  }

  .nav,
  .nav-actions {
    display: none;
  }

  .menu-btn {
    display: grid;
    justify-self: end;
    position: relative;
    z-index: 2;
  }

  .mobile-nav {
    display: block;
    position: fixed;
    top: var(--header-height);
    left: 0;
    right: 0;
    z-index: 990;
    max-height: calc(100svh - var(--header-height));
    overflow-y: auto;
    overscroll-behavior: contain;
    scrollbar-width: thin;
    scrollbar-color: rgba(100, 116, 139, 0.32) transparent;
    padding: 14px 0 18px;
    background: rgba(255, 255, 255, 0.98);
    border-bottom: 1px solid rgba(226, 232, 240, 0.95);
    box-shadow: 0 20px 60px rgba(15, 23, 42, 0.14);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
  }

  .mobile-nav-panel {
    display: grid;
    gap: 9px;
    padding-bottom: 24px;
  }

  .mobile-nav::-webkit-scrollbar {
    width: 4px;
  }

  .mobile-nav::-webkit-scrollbar-thumb {
    background: rgba(100, 116, 139, 0.3);
    border-radius: 999px;
  }

  .mobile-nav a,
  .mobile-menu-title {
    display: flex;
    align-items: center;
    min-height: 44px;
    padding: 11px 14px;
    border-radius: 12px;
    color: #101828;
    font-size: 15px;
    font-weight: 700;
    text-decoration: none;
  }

  .mobile-nav a:hover,
  .mobile-menu-title:hover {
    color: var(--primary-dark);
    background: rgba(11, 142, 220, 0.08);
  }

  .mobile-menu-group {
    padding: 8px;
    border: 1px solid rgba(226, 232, 240, 0.9);
    border-radius: 16px;
    background: #ffffff;
  }

  .mobile-menu-title {
    color: var(--primary-dark);
  }

  .mobile-menu-title-icon {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .mobile-menu-links {
    display: grid;
    gap: 4px;
    padding-left: 6px;
  }

  .mobile-menu-links a {
    color: #667085;
    font-size: 14.5px;
    font-weight: 620;
  }

  .mobile-nav-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    padding-top: 4px;
  }

  .mobile-nav-actions .btn {
    width: 100%;
  }
}

@media (max-width: 560px) {
  .header-container {
    width: calc(100% - 20px);
  }

  .mobile-nav-actions {
    grid-template-columns: 1fr;
  }
}

/* ── Dark mode ───────────────────────────────────────────────── */
[data-theme='dark'] .header,
[data-theme='dark'] .header.scrolled {
  background: rgba(7, 15, 30, 0.97) !important;
  border-bottom-color: rgba(30, 58, 82, 0.8) !important;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.35) !important;
}

[data-theme='dark'] .nav-link,
[data-theme='dark'] .nav-trigger {
  color: #cbd5e1;
}

[data-theme='dark'] .nav-link:hover,
[data-theme='dark'] .nav-link.active,
[data-theme='dark'] .nav-trigger:hover,
[data-theme='dark'] .nav-item.open > .nav-trigger {
  color: #60a5fa;
  background: rgba(96, 165, 250, 0.08);
  border-color: transparent;
}

[data-theme='dark'] .dropdown-menu {
  background: #0d1f35;
  border-color: rgba(30, 58, 82, 0.9);
  box-shadow: 0 28px 80px rgba(0, 0, 0, 0.4);
}

[data-theme='dark'] .dropdown-menu::after {
  background: #0d1f35;
  border-color: rgba(30, 58, 82, 0.9);
}

[data-theme='dark'] .dropdown-item {
  color: #cbd5e1;
}

[data-theme='dark'] .dropdown-item:hover {
  color: #60a5fa;
  background: rgba(96, 165, 250, 0.08);
}

[data-theme='dark'] .btn.outline {
  color: #cbd5e1;
  background: rgba(15, 34, 54, 0.9);
  border-color: rgba(30, 58, 82, 0.9);
}

[data-theme='dark'] .btn.outline:hover {
  color: #60a5fa;
  border-color: rgba(96, 165, 250, 0.35);
}

[data-theme='dark'] .mobile-nav {
  background: rgba(7, 15, 30, 0.98) !important;
  border-bottom-color: rgba(30, 58, 82, 0.8);
}

[data-theme='dark'] .mobile-nav a,
[data-theme='dark'] .mobile-menu-title {
  color: #cbd5e1;
}

[data-theme='dark'] .mobile-menu-group {
  background: rgba(13, 31, 53, 0.9);
  border-color: rgba(30, 58, 82, 0.8);
}

[data-theme='dark'] .menu-btn {
  background: rgba(13, 31, 53, 0.9);
  border-color: rgba(30, 58, 82, 0.8);
  color: #cbd5e1;
}
`
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
    <>
      <style>{HEADER_STYLES}</style>
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
    </>
  )
}
