import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu } from "lucide-react";
import {
  externalLinks,
  servicePages as defaultServicePages,
  softwareProducts as defaultSoftwareMenu,
  solutionPages as defaultSolutionPages,
} from "../data/siteContent";
import { fetchNavOfferings } from "../utils/contentApi";

export default function Header({
  activeDropdown,
  setActiveDropdown,
  mobileOpen,
  setMobileOpen,
  location,
  logoMain,
  softwareProducts,
  solutionPages,
  servicePages,
}) {
  const [scrolled, setScrolled] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [cmsNav, setCmsNav] = useState(null);

  useEffect(() => {
    fetchNavOfferings().then(setCmsNav).catch(() => {});
  }, []);

  useEffect(() => {
    const updateHeaderState = () => {
      setScrolled(window.scrollY > 18);
    };

    updateHeaderState();
    window.addEventListener("scroll", updateHeaderState, { passive: true });

    return () => window.removeEventListener("scroll", updateHeaderState);
  }, []);

  const flattenMenu = (pages, parentPath) => {
    if (!Array.isArray(pages) || pages.length === 0) return [];

    return pages.flatMap((page) => {
      if (Array.isArray(page.items) && page.items.length > 0) {
        return page.items.map((child, index) => ({
          slug: child.slug ?? `${page.slug}-${index}`,
          title: typeof child === "string" ? child : child.title,
          href:
            typeof child === "string"
              ? `${parentPath}/${page.slug}`
              : child.href ?? `${parentPath}/${page.slug}/${child.slug}`,
        }));
      }

      return {
        slug: page.slug,
        title: page.title,
        href: page.href ?? `${parentPath}/${page.slug}`,
      };
    });
  };

  const effectiveSoftware = cmsNav?.software ?? (Array.isArray(softwareProducts) && softwareProducts.length > 0 ? softwareProducts : null)
  const effectiveSolutions = cmsNav?.solutions ?? (Array.isArray(solutionPages) && solutionPages.length > 0 ? solutionPages : null)
  const effectiveServices = cmsNav?.services ?? (Array.isArray(servicePages) && servicePages.length > 0 ? servicePages : null)

  const softwareMenu = effectiveSoftware ? flattenMenu(effectiveSoftware, "/phan-mem") : defaultSoftwareMenu;
  const solutionsMenu = effectiveSolutions ? flattenMenu(effectiveSolutions, "/giai-phap") : defaultSolutionPages;
  const servicesMenu = effectiveServices ? flattenMenu(effectiveServices, "/dich-vu") : defaultServicePages;

  const closeMenu = () => {
    setOpenDropdown(null);
    setActiveDropdown(null);
    setMobileOpen(false);
  };

  const toggleDropdown = (name) => {
    setOpenDropdown(openDropdown === name ? null : name);
  };

  return (
    <header className={`header ${scrolled ? "scrolled" : ""}`} onMouseLeave={() => setOpenDropdown(null)}>
      <div className="header-container">
        <Link to="/" className="logo" onClick={closeMenu}>
          <img src={logoMain} alt="iOrder" loading="eager" decoding="sync" fetchPriority="high" />
        </Link>

        <nav className="nav" aria-label="Menu chính">
          <NavLink className="nav-link" to="/" end>
            Trang chủ
          </NavLink>

          <div
            className={`nav-item has-dropdown ${
              openDropdown === "software" ? "open" : ""
            }`}
            onMouseEnter={() => setOpenDropdown("software")}
            onFocusCapture={() => setOpenDropdown("software")}
          >
            <Link
              to="/phan-mem"
              className={`nav-trigger ${
                location.pathname.startsWith("/phan-mem") ||
                openDropdown === "software"
                  ? "active"
                  : ""
              }`}
              onClick={closeMenu}
            >
              Phần mềm
            </Link>

            {openDropdown === "software" ? (
              <div className="dropdown-menu dropdown-menu-software">
                <div className="dropdown-grid dropdown-grid-2">
                  {softwareMenu.map((item) => (
                    <Link
                      key={item.slug}
                      to={item.href}
                      className="dropdown-item"
                      onClick={closeMenu}
                    >
                      {item.title}
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div
            className={`nav-item has-dropdown ${
              openDropdown === "solutions" ? "open" : ""
            }`}
            onMouseEnter={() => setOpenDropdown("solutions")}
            onFocusCapture={() => setOpenDropdown("solutions")}
          >
            <Link
              to="/giai-phap"
              className={`nav-trigger ${
                location.pathname.startsWith("/giai-phap") ||
                openDropdown === "solutions"
                  ? "active"
                  : ""
              }`}
              onClick={closeMenu}
            >
              Giải pháp
            </Link>

            {openDropdown === "solutions" ? (
              <div className="dropdown-menu dropdown-menu-solutions">
                <div className="dropdown-grid dropdown-grid-2">
                  {solutionsMenu.map((item) => (
                    <Link
                      key={item.slug}
                      to={item.href}
                      className="dropdown-item"
                      onClick={closeMenu}
                    >
                      {item.title}
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div
            className={`nav-item has-dropdown ${
              openDropdown === "services" ? "open" : ""
            }`}
            onMouseEnter={() => setOpenDropdown("services")}
            onFocusCapture={() => setOpenDropdown("services")}
          >
            <Link
              to="/dich-vu"
              className={`nav-trigger ${
                location.pathname.startsWith("/dich-vu") ||
                openDropdown === "services"
                  ? "active"
                  : ""
              }`}
              onClick={closeMenu}
            >
              Dịch vụ
            </Link>

            {openDropdown === "services" ? (
              <div className="dropdown-menu dropdown-menu-services">
                <div className="dropdown-grid dropdown-grid-2">
                  {servicesMenu.map((item) => (
                    <Link
                      key={item.slug}
                      to={item.href}
                      className="dropdown-item"
                      onClick={closeMenu}
                    >
                      {item.title}
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <NavLink className="nav-link" to="/tin-tuc">
            Tin tức
          </NavLink>

          <div
            className={`nav-item has-dropdown ${
              openDropdown === "support" ? "open" : ""
            }`}
            onMouseEnter={() => setOpenDropdown("support")}
            onFocusCapture={() => setOpenDropdown("support")}
          >
            <button
              type="button"
              className={`nav-trigger ${
                openDropdown === "support" ? "active" : ""
              }`}
              onClick={() => toggleDropdown("support")}
            >
              Hỗ trợ
            </button>

            {openDropdown === "support" ? (
              <div className="dropdown-menu dropdown-menu-support">
                <div className="dropdown-grid dropdown-grid-single">
                  <Link
                    to="/ho-tro/cai-dat"
                    className="dropdown-item"
                    onClick={closeMenu}
                  >
                    Hỗ trợ cài đặt
                  </Link>
                  <Link
                    to="/ho-tro/faq"
                    className="dropdown-item"
                    onClick={closeMenu}
                  >
                    FAQ
                  </Link>
                  <Link
                    to="/ho-tro/video"
                    className="dropdown-item"
                    onClick={closeMenu}
                  >
                    Video hướng dẫn
                  </Link>
                  <Link
                    to="/lien-he"
                    className="dropdown-item"
                    onClick={closeMenu}
                  >
                    Liên hệ hỗ trợ
                  </Link>
                </div>
              </div>
            ) : null}
          </div>
        </nav>

        <div className="nav-actions">
          <a
            className="btn outline"
            href={externalLinks.appLogin}
            target="_blank"
            rel="noreferrer"
          >
            Đăng nhập
          </a>

          <a
            className="btn primary"
            href={externalLinks.trial}
            target="_blank"
            rel="noreferrer"
          >
            Đăng ký dùng thử
          </a>
        </div>

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
        <div className="mobile-nav">
          <div className="container mobile-nav-panel">
            <NavLink to="/" end onClick={closeMenu}>
              Trang chủ
            </NavLink>

            <NavLink to="/tin-tuc" onClick={closeMenu}>
              Tin tức
            </NavLink>

            <div className="mobile-menu-group">
              <Link
                to="/phan-mem"
                className="mobile-menu-title"
                onClick={closeMenu}
              >
                Phần mềm
              </Link>

              <div className="mobile-menu-links">
                {softwareMenu.map((item) => (
                  <Link
                    key={item.slug}
                    to={item.href}
                    onClick={closeMenu}
                  >
                    {item.title}
                  </Link>
                ))}
              </div>
            </div>

            <div className="mobile-menu-group">
              <Link
                to="/giai-phap"
                className="mobile-menu-title"
                onClick={closeMenu}
              >
                Giải pháp
              </Link>

              <div className="mobile-menu-links">
                {solutionsMenu.map((item) => (
                  <Link key={item.slug} to={item.href} onClick={closeMenu}>
                    {item.title}
                  </Link>
                ))}
              </div>
            </div>

            <div className="mobile-menu-group">
              <Link
                to="/dich-vu"
                className="mobile-menu-title"
                onClick={closeMenu}
              >
                Dịch vụ
              </Link>

              <div className="mobile-menu-links">
                {servicesMenu.map((item) => (
                  <Link key={item.slug} to={item.href} onClick={closeMenu}>
                    {item.title}
                  </Link>
                ))}
              </div>
            </div>

            <div className="mobile-menu-group">
              <div className="mobile-menu-title mobile-menu-title-icon">
                Hỗ trợ
              </div>

              <div className="mobile-menu-links">
                <Link to="/ho-tro/cai-dat" onClick={closeMenu}>
                  Hỗ trợ cài đặt
                </Link>
                <Link to="/ho-tro/faq" onClick={closeMenu}>
                  FAQ
                </Link>
                <Link to="/ho-tro/video" onClick={closeMenu}>
                  Video hướng dẫn
                </Link>
                <Link to="/lien-he" onClick={closeMenu}>
                  Liên hệ hỗ trợ
                </Link>
              </div>
            </div>

            <div className="mobile-nav-actions">
              <a
                className="btn outline"
                href={externalLinks.appLogin}
                target="_blank"
                rel="noreferrer"
              >
                Đăng nhập
              </a>

              <a
                className="btn primary"
                href={externalLinks.trial}
                target="_blank"
                rel="noreferrer"
              >
                Dùng thử miễn phí
              </a>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
