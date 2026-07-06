import { Link } from 'react-router-dom'

// Khối dropdown dùng chung cho mọi mục có menu con (Phần mềm, Giải pháp, Dịch vụ, Hỗ trợ).
// - basePath có giá trị  → trigger là Link điều hướng được (Phần mềm/Giải pháp/Dịch vụ).
// - basePath không có    → trigger là button chỉ để mở/đóng menu (Hỗ trợ, không có trang riêng).
export default function NavDropdown({
  name,
  label,
  basePath,
  items,
  columns = 2,
  isOpen,
  isActive = false,
  onOpen,
  onClose,
}) {
  const gridClass = columns === 1 ? 'dropdown-grid-single' : 'dropdown-grid-2'

  return (
    <div className={`nav-item has-dropdown ${isOpen ? 'open' : ''}`} onMouseEnter={onOpen} onFocusCapture={onOpen}>
      {basePath ? (
        <Link to={basePath} className={`nav-trigger ${isActive || isOpen ? 'active' : ''}`} onClick={onClose}>
          {label}
        </Link>
      ) : (
        <button
          type="button"
          className={`nav-trigger ${isOpen ? 'active' : ''}`}
          onClick={() => (isOpen ? onClose() : onOpen())}
        >
          {label}
        </button>
      )}

      {isOpen ? (
        <div className={`dropdown-menu dropdown-menu-${name}`}>
          <div className={`dropdown-grid ${gridClass}`}>
            {items.map((item) => (
              <Link key={item.slug ?? item.href} to={item.href} className="dropdown-item" onClick={onClose}>
                {item.title}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
