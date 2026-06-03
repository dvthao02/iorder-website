import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu } from "lucide-react";

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

  useEffect(() => {
    const updateHeaderState = () => {
      setScrolled(window.scrollY > 18);
    };

    updateHeaderState();
    window.addEventListener("scroll", updateHeaderState, { passive: true });

    return () => window.removeEventListener("scroll", updateHeaderState);
  }, []);

  const defaultSoftwareMenu = [
    {
      slug: "quan-ly-ban-hang-iorder",
      title: "Phần mềm quản lý bán hàng - iOrder",
    },
    {
      slug: "quan-ly-truong-mam-non-mimiedu",
      title: "Phần mềm quản lý trường mầm non - MimiEdu",
    },
    {
      slug: "dong-bo-du-lieu-iorder-rpa",
      title: "Phần mềm đồng bộ dữ liệu iOrder RPA",
    },
    {
      slug: "quan-ly-tram-sac-xe-dien",
      title: "Phần mềm quản lý trạm sạc xe điện",
    },
    {
      slug: "quan-ly-van-tai",
      title: "Phần mềm quản lý vận tải",
    },
    {
      slug: "hoa-don-dien-tu-chu-ky-so",
      title: "Hóa đơn điện tử - Chữ ký số",
    },
  ];

  const defaultSolutionPages = [
    {
      slug: "mang-wifi-camera",
      title: "Giải pháp hạ tầng mạng nội bộ, Wifi và camera",
      href: "/giai-phap/ha-tang/mang-wifi-camera",
    },
    {
      slug: "can-bang-tai-ha-bao-mat",
      title: "Cân bằng tải Internet, HA và bảo mật",
      href: "/giai-phap/ha-tang/can-bang-tai-ha-bao-mat",
    },
    {
      slug: "data-center",
      title: "Hệ thống data center cho doanh nghiệp",
      href: "/giai-phap/ha-tang/data-center",
    },
    {
      slug: "may-chu-server",
      title: "Giải pháp máy chủ lưu trữ; Proxy; Web server; Mail server; File server",
      href: "/giai-phap/ha-tang/may-chu-server",
    },
    {
      slug: "kiem-soat-ra-vao-cham-cong",
      title: "Giải pháp kiểm soát ra vào, chấm công vân tay, khuôn mặt",
      href: "/giai-phap/ha-tang/kiem-soat-ra-vao-cham-cong",
    },
  ];

  const defaultServicePages = [
    {
      slug: "thi-cong-mang-wifi-camera",
      title: "Thiết kế, thi công hệ thống mạng nội bộ, Wifi, Camera, Kiểm soát ra vào",
      href: "/dich-vu/dich-vu-cntt/thi-cong-mang-wifi-camera",
    },
    {
      slug: "bao-tri-it",
      title: "Bảo trì và xử lý sự cố IT",
      href: "/dich-vu/dich-vu-cntt/bao-tri-it",
    },
    {
      slug: "hosting-website",
      title: "Cung cấp tên miền, hosting, thiết kế website",
      href: "/dich-vu/dich-vu-cntt/hosting-website",
    },
    {
      slug: "chu-ky-so-hoa-don-dien-tu",
      title: "Chữ ký số, hóa đơn điện tử, hợp đồng điện tử",
      href: "/dich-vu/dich-vu-cntt/chu-ky-so-hoa-don-dien-tu",
    },
    {
      slug: "name-card-dien-tu",
      title: "Name card điện tử cá nhân, doanh nghiệp",
      href: "/dich-vu/dich-vu-cntt/name-card-dien-tu",
    },
    {
      slug: "phat-trien-phan-mem",
      title: "Phát triển phần mềm theo yêu cầu",
      href: "/dich-vu/dich-vu-cntt/phat-trien-phan-mem",
    },
    {
      slug: "tu-van-chuyen-doi-so",
      title: "Tư vấn, đào tạo chuyển đổi số",
      href: "/dich-vu/dich-vu-cntt/tu-van-chuyen-doi-so",
    },
  ];

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

  const solutionsMenu =
    Array.isArray(solutionPages) && solutionPages.length > 0
      ? flattenMenu(solutionPages, "/giai-phap")
      : defaultSolutionPages;

  const servicesMenu =
    Array.isArray(servicePages) && servicePages.length > 0
      ? flattenMenu(servicePages, "/dich-vu")
      : defaultServicePages;

  const softwareMenu =
    Array.isArray(softwareProducts) && softwareProducts.length > 0
      ? flattenMenu(softwareProducts, "/phan-mem")
      : defaultSoftwareMenu;

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
          <img src={logoMain} alt="iOrder" />
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
            href="https://app.iorder.vn/login"
            target="_blank"
            rel="noreferrer"
          >
            Đăng nhập
          </a>

          <a
            className="btn primary"
            href="https://app.iorder.vn/register-trial"
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
                href="https://app.iorder.vn/login"
                target="_blank"
                rel="noreferrer"
              >
                Đăng nhập
              </a>

              <a
                className="btn primary"
                href="https://app.iorder.vn/register-trial"
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
