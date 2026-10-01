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
  MonitorSmartphone,
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
  { key: 'sales-equipment', slug: 'thiet-bi', label: 'Thiết bị', icon: MonitorSmartphone, group: 'site' },
  { key: 'posts', slug: 'tin-tuc', label: 'Tin tức', icon: FileText, group: 'site' },
  { key: 'guides', slug: 'huong-dan', label: 'Hướng dẫn', icon: FileStack, group: 'site' },
  { key: 'content-pages', slug: 'trang-noi-dung', label: 'Trang nội dung', icon: FileStack, group: 'site' },
  { key: 'media', slug: 'thu-vien', label: 'Thư viện media', icon: ImageIcon, group: 'shared' },
  { key: 'partners', slug: 'doi-tac', label: 'Đối tác & Khách hàng', icon: Users, group: 'shared' },
  { key: 'testimonials', slug: 'danh-gia', label: 'Đánh giá khách hàng', icon: Star, group: 'shared' },
  { key: 'downloads', slug: 'ho-tro-cai-dat', label: 'Tài liệu tải xuống', icon: Download, group: 'shared' },
  { key: 'navigation', slug: 'menu', label: 'Điều hướng website', icon: ListTree, group: 'navigation' },
  { key: 'leads', slug: 'khach-lien-he', label: 'Liên hệ khách hàng', icon: Inbox, group: 'leads' },
  { key: 'settings', slug: 'cai-dat', label: 'Cấu hình website', icon: Settings, group: 'config' },
] as const

export const navigationGroups: { id: string; label: string }[] = [
  { id: 'overview', label: '' },
  { id: 'site', label: 'Nội dung website' },
  { id: 'shared', label: 'Media & nội dung dùng chung' },
  { id: 'navigation', label: 'SEO & điều hướng' },
  { id: 'leads', label: 'Khách hàng & liên hệ' },
  { id: 'config', label: 'Cấu hình & hệ thống' },
]

// Quyền hiển thị của điều hướng chỉ phục vụ trải nghiệm UI. API guards vẫn là
// nguồn quyết định quyền truy cập cuối cùng.
export const adminOnlyNavigationGroups = new Set(['navigation', 'config'])

export const slugByKey: Record<string, string> = Object.fromEntries(navigation.map((item) => [item.key, item.slug]))
export const keyBySlug: Record<string, string> = Object.fromEntries(navigation.map((item) => [item.slug, item.key]))
