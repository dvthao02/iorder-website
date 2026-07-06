import {
  Download,
  Factory,
  FileStack,
  FileText,
  Home,
  Image as ImageIcon,
  Inbox,
  Layers,
  LayoutDashboard,
  ListTree,
  Package,
  Settings,
  Star,
  Users,
  Wrench,
} from 'lucide-react'

// Cấu hình toàn bộ mục trong sidebar — sửa/thêm mục mới chỉ cần đụng vào file này.
// Nhóm "site" đi theo đúng thứ tự các mục khách hàng thấy trên navbar công khai:
// Trang chủ → Phần mềm → Giải pháp → Dịch vụ → Tin tức → Hỗ trợ.
// Mỗi mục là 1 trang riêng — không còn tab chuyển loại dùng chung.
export const navigation = [
  { key: 'dashboard', slug: '', label: 'Tổng quan', icon: LayoutDashboard, group: 'overview' },
  { key: 'homepage', slug: 'trang-chu', label: 'Trang chủ', icon: Home, group: 'site' },
  { key: 'software', slug: 'phan-mem', label: 'Phần mềm', icon: Package, group: 'site' },
  { key: 'solutions', slug: 'giai-phap', label: 'Giải pháp', icon: Layers, group: 'site' },
  { key: 'services', slug: 'dich-vu', label: 'Dịch vụ', icon: Wrench, group: 'site' },
  { key: 'industries', slug: 'nganh-hang', label: 'Ngành hàng', icon: Factory, group: 'site' },
  { key: 'posts', slug: 'tin-tuc', label: 'Tin tức', icon: FileText, group: 'site' },
  { key: 'downloads', slug: 'ho-tro-cai-dat', label: 'Hỗ trợ cài đặt', icon: Download, group: 'site' },
  { key: 'content-pages', slug: 'trang-noi-dung', label: 'Trang nội dung', icon: FileStack, group: 'site' },
  { key: 'partners', slug: 'doi-tac', label: 'Đối tác & Khách hàng', icon: Users, group: 'shared' },
  { key: 'testimonials', slug: 'danh-gia', label: 'Đánh giá khách hàng', icon: Star, group: 'shared' },
  { key: 'leads', slug: 'khach-lien-he', label: 'Khách liên hệ', icon: Inbox, group: 'shared' },
  { key: 'media', slug: 'thu-vien', label: 'Ảnh & tài liệu', icon: ImageIcon, group: 'shared' },
  { key: 'navigation', slug: 'menu', label: 'Menu điều hướng', icon: ListTree, group: 'config' },
  { key: 'settings', slug: 'cai-dat', label: 'Cài đặt website', icon: Settings, group: 'config' },
] as const

export const navigationGroups: { id: string; label: string }[] = [
  { id: 'overview', label: '' },
  { id: 'site', label: 'Nội dung website' },
  { id: 'shared', label: 'Thành phần dùng chung' },
  { id: 'config', label: 'Cấu hình website' },
]

export const slugByKey: Record<string, string> = Object.fromEntries(navigation.map((item) => [item.key, item.slug]))
export const keyBySlug: Record<string, string> = Object.fromEntries(navigation.map((item) => [item.slug, item.key]))
