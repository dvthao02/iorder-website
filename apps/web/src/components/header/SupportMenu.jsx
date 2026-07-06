import NavDropdown from './NavDropdown'

export const SUPPORT_ITEMS = [
  { slug: 'cai-dat', title: 'Hỗ trợ cài đặt', href: '/ho-tro/cai-dat' },
  { slug: 'faq', title: 'FAQ', href: '/ho-tro/faq' },
  { slug: 'lien-he', title: 'Liên hệ hỗ trợ', href: '/lien-he' },
]

// Mục "Hỗ trợ" trên header — không có trang riêng nên trigger là button, không phải Link.
// label/items có thể được CMS (Menu điều hướng) ghi đè; mặc định dùng danh sách tĩnh.
export default function SupportMenu({ label = 'Hỗ trợ', items = SUPPORT_ITEMS, isOpen, onOpen, onClose }) {
  return (
    <NavDropdown
      name="support"
      label={label}
      items={items}
      columns={1}
      isOpen={isOpen}
      onOpen={onOpen}
      onClose={onClose}
    />
  )
}
