import NavDropdown from './NavDropdown'

// Mục "Giải pháp" trên header. label có thể được CMS (Menu điều hướng) ghi đè.
export default function SolutionsMenu({ label = 'Giải pháp', items, isOpen, isActive, onOpen, onClose }) {
  return (
    <NavDropdown
      name="solutions"
      label={label}
      basePath="/giai-phap"
      items={items}
      columns={2}
      isOpen={isOpen}
      isActive={isActive}
      onOpen={onOpen}
      onClose={onClose}
    />
  )
}
