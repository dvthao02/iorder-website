import NavDropdown from './NavDropdown'

// Mục "Dịch vụ" trên header. label có thể được CMS (Menu điều hướng) ghi đè.
export default function ServicesMenu({ label = 'Dịch vụ', items, isOpen, isActive, onOpen, onClose }) {
  return (
    <NavDropdown
      name="services"
      label={label}
      basePath="/dich-vu"
      items={items}
      columns={2}
      isOpen={isOpen}
      isActive={isActive}
      onOpen={onOpen}
      onClose={onClose}
    />
  )
}
