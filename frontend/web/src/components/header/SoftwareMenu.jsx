import NavDropdown from './NavDropdown'

// Mục "Phần mềm" trên header. label có thể được CMS (Menu điều hướng) ghi đè.
export default function SoftwareMenu({ label = 'Phần mềm', items, isOpen, isActive, onOpen, onClose }) {
  return (
    <NavDropdown
      name="software"
      label={label}
      basePath="/phan-mem"
      items={items}
      columns={2}
      isOpen={isOpen}
      isActive={isActive}
      onOpen={onOpen}
      onClose={onClose}
    />
  )
}
