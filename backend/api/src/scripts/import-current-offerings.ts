/**
 * Idempotent import: seeds all static offerings (software, solution, service, industry)
 * from the public website's siteContent.js into the CMS database.
 * Run: pnpm --filter @iorder/api import:offerings
 */
import { config } from 'dotenv'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createDatabase } from '@iorder/database'
import { offerings } from '@iorder/database'
import { and, eq, isNull } from 'drizzle-orm'
import { readEnv } from '../env.js'

const here = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(here, '../../../../.env') })
const env = readEnv()
const { db, close } = createDatabase(env.DATABASE_URL)

// ── Static data (copied from siteContent.js + industrySolutions.js) ──────────

const softwareItems = [
  {
    slug: 'quan-ly-ban-hang-iorder',
    title: 'Phần mềm quản lý bán hàng - iOrder',
    summary:
      'Giải pháp POS giúp cửa hàng, nhà hàng và chuỗi kinh doanh quản lý bán hàng, kho, nhân viên và báo cáo trên một nền tảng.',
    icon: 'receipt',
    sortOrder: 0,
    isFeatured: true,
    contentJson: {
      description:
        'Nền tảng POS cho cửa hàng, nhà hàng, cafe và chuỗi bán lẻ cần quản lý bán hàng, kho, nhân viên và báo cáo.',
      tags: ['POS', 'Bán hàng', 'Báo cáo'],
      bestFor: 'Cửa hàng, cafe, nhà hàng và chuỗi bán lẻ',
      keyValue: 'Vận hành bán hàng tập trung',
      metrics: ['Tạo đơn ít bước', 'Thanh toán linh hoạt', 'Chốt ca rõ ràng'],
      features: [
        'Bán hàng tại quầy, gọi món và tạo đơn nhanh',
        'Quản lý sản phẩm, nhóm hàng, giá bán và mã vạch',
        'In hóa đơn, in bếp/bar và kết nối thiết bị bán hàng',
        'Theo dõi kho, nhân viên, khách hàng và phân quyền',
        'Báo cáo doanh thu theo ngày, ca, chi nhánh và hình thức thanh toán',
      ],
      benefits: [
        'Giảm thời gian đào tạo nhân viên mới',
        'Hạn chế sai sót trong giờ cao điểm',
        'Chủ cửa hàng nhìn rõ doanh thu và tồn kho',
        'Dễ mở rộng khi tăng chi nhánh hoặc thiết bị',
      ],
      faq: [
        [
          'iOrder có phù hợp nhà hàng và bán lẻ không?',
          'Có. Hệ thống có thể cấu hình theo bán lẻ, cafe, nhà hàng hoặc mô hình có bàn/phòng.',
        ],
        [
          'Có kết nối máy in và máy quét không?',
          'Có thể cấu hình máy in hóa đơn, máy in bếp/bar, máy quét mã vạch và thiết bị POS phổ biến.',
        ],
        [
          'Có dùng được nhiều chi nhánh không?',
          'Có. Dữ liệu có thể tách theo chi nhánh và tổng hợp báo cáo theo quyền quản lý.',
        ],
      ],
      items: [],
      category: null,
    },
  },
  {
    slug: 'quan-ly-truong-mam-non-mimiedu',
    title: 'Phần mềm quản lý trường mầm non - MimiEdu',
    summary: 'Hỗ trợ trường mầm non quản lý học sinh, lớp học, học phí, điểm danh và trao đổi thông tin với phụ huynh.',
    icon: 'users',
    sortOrder: 1,
    isFeatured: false,
    contentJson: {
      description: 'Hỗ trợ trường mầm non quản lý học sinh, lớp học, học phí, điểm danh và kết nối phụ huynh.',
      tags: ['Giáo dục', 'Học phí', 'Điểm danh'],
      bestFor: 'Trường mầm non, nhóm lớp và cơ sở giáo dục',
      keyValue: 'Quản lý hồ sơ và phụ huynh rõ ràng',
      metrics: ['Hồ sơ tập trung', 'Điểm danh nhanh', 'Học phí rõ ràng'],
      features: [
        'Quản lý hồ sơ học sinh, lớp học và phụ huynh',
        'Điểm danh, theo dõi tình trạng học sinh và thông báo',
        'Quản lý học phí, khoản thu và lịch sử thanh toán',
        'Gửi thông tin tới phụ huynh theo lớp hoặc từng học sinh',
        'Báo cáo lớp học, học phí và vận hành nhà trường',
      ],
      benefits: [
        'Giảm giấy tờ thủ công',
        'Phụ huynh nhận thông tin nhanh hơn',
        'Ban giám hiệu dễ theo dõi dữ liệu',
        'Chuẩn hóa quy trình giữa các lớp',
      ],
      faq: [
        ['Có quản lý nhiều lớp không?', 'Có.'],
        ['Có theo dõi học phí không?', 'Có.'],
        ['Phụ huynh có nhận thông báo được không?', 'Có thể cấu hình kênh thông báo.'],
      ],
      items: [],
      category: null,
    },
  },
  {
    slug: 'dong-bo-du-lieu-iorder-rpa',
    title: 'Phần mềm đồng bộ dữ liệu iOrder RPA',
    summary:
      'Tự động hóa thao tác lặp lại và đồng bộ dữ liệu giữa iOrder với website, sàn thương mại điện tử hoặc phần mềm nội bộ.',
    icon: 'boxes',
    sortOrder: 2,
    isFeatured: false,
    contentJson: {
      description: 'Tự động đồng bộ dữ liệu giữa hệ thống bán hàng, kế toán, sàn thương mại và phần mềm nội bộ.',
      tags: ['RPA', 'Đồng bộ', 'Tự động'],
      bestFor: 'Doanh nghiệp có nhiều nguồn dữ liệu vận hành',
      keyValue: 'Giảm nhập liệu lặp lại',
      metrics: ['Tự động hóa', 'Giảm nhập liệu', 'Đồng bộ định kỳ'],
      features: [
        'Đồng bộ sản phẩm, đơn hàng và dữ liệu vận hành',
        'Tự động thao tác lặp lại theo quy trình đã thống nhất',
        'Kết nối website, sàn thương mại, kế toán hoặc hệ thống nội bộ',
        'Theo dõi trạng thái đồng bộ và cảnh báo lỗi',
        'Xuất nhập dữ liệu theo lịch hoặc theo yêu cầu',
      ],
      benefits: [
        'Giảm thao tác nhập tay',
        'Hạn chế sai lệch dữ liệu',
        'Tiết kiệm thời gian vận hành',
        'Dễ mở rộng theo quy trình riêng',
      ],
      faq: [
        ['RPA có thay thế tích hợp API không?', 'Không nhất thiết.'],
        ['Có đồng bộ theo lịch được không?', 'Có.'],
        ['Cần chuẩn bị gì?', 'Cần mô tả nguồn dữ liệu và quy tắc đồng bộ.'],
      ],
      items: [],
      category: null,
    },
  },
  {
    slug: 'quan-ly-tram-sac-xe-dien',
    title: 'Phần mềm quản lý trạm sạc xe điện',
    summary:
      'Quản lý điểm sạc, phiên sạc, thanh toán, trạng thái thiết bị và báo cáo doanh thu cho mô hình trạm sạc xe điện.',
    icon: 'chart',
    sortOrder: 3,
    isFeatured: false,
    contentJson: {
      description: 'Theo dõi trạm sạc, phiên sạc, doanh thu, thiết bị và tình trạng vận hành theo thời gian thực.',
      tags: ['Trạm sạc', 'Thiết bị', 'Realtime'],
      bestFor: 'Đơn vị vận hành trạm sạc và bãi xe điện',
      keyValue: 'Giám sát vận hành thiết bị',
      metrics: ['Theo dõi trạm', 'Phiên sạc rõ ràng', 'Doanh thu realtime'],
      features: [
        'Quản lý điểm sạc, trụ sạc và trạng thái thiết bị',
        'Theo dõi phiên sạc, thời lượng và chi phí',
        'Ghi nhận thanh toán và báo cáo doanh thu',
        'Cảnh báo trạng thái bất thường hoặc cần kiểm tra',
        'Tổng hợp dữ liệu theo điểm sạc hoặc cụm trạm',
      ],
      benefits: [
        'Vận hành tập trung hơn',
        'Minh bạch phiên sạc và doanh thu',
        'Giảm thời gian kiểm tra thủ công',
        'Hỗ trợ mở rộng nhiều điểm sạc',
      ],
      faq: [],
      items: [],
      category: null,
    },
  },
  {
    slug: 'quan-ly-van-tai',
    title: 'Phần mềm quản lý vận tải',
    summary:
      'Hỗ trợ doanh nghiệp vận tải quản lý đơn vận chuyển, phương tiện, tài xế, lịch trình và chi phí khai thác.',
    icon: 'smartphone',
    sortOrder: 4,
    isFeatured: false,
    contentJson: {
      description: 'Quản lý đơn vận, phương tiện, tài xế, lịch trình và báo cáo chi phí trong hoạt động vận tải.',
      tags: ['Vận tải', 'Tài xế', 'Lịch trình'],
      bestFor: 'Đội xe, giao nhận và doanh nghiệp logistics',
      keyValue: 'Theo dõi chuyến và chi phí',
      metrics: ['Đơn vận rõ ràng', 'Theo dõi đội xe', 'Kiểm soát chi phí'],
      features: [
        'Quản lý đơn vận chuyển, tài xế và phương tiện',
        'Theo dõi lịch trình, trạng thái chuyến và điểm giao nhận',
        'Ghi nhận chi phí nhiên liệu, bảo trì và phát sinh',
        'Tổng hợp báo cáo chuyến, doanh thu và hiệu suất',
        'Hỗ trợ phân quyền theo vai trò vận hành',
      ],
      benefits: [
        'Tối ưu điều phối đội xe',
        'Kiểm soát chi phí tốt hơn',
        'Theo dõi tiến độ minh bạch',
        'Dữ liệu vận hành tập trung',
      ],
      faq: [],
      items: [],
      category: null,
    },
  },
  {
    slug: 'hoa-don-dien-tu-chu-ky-so',
    title: 'Hóa đơn điện tử - Chữ ký số',
    summary: 'Tư vấn và hỗ trợ triển khai hóa đơn điện tử, chữ ký số, hợp đồng điện tử cho cửa hàng và doanh nghiệp.',
    icon: 'shield',
    sortOrder: 5,
    isFeatured: false,
    contentJson: {
      description: 'Cung cấp giải pháp hóa đơn điện tử, chữ ký số và hợp đồng điện tử cho doanh nghiệp.',
      tags: ['Hóa đơn', 'Chữ ký số', 'Pháp lý'],
      bestFor: 'Doanh nghiệp cần chứng từ điện tử hợp lệ',
      keyValue: 'Số hóa chứng từ nhanh',
      metrics: ['Tư vấn gói', 'Cài đặt nhanh', 'Hỗ trợ phát hành'],
      features: [
        'Tư vấn hóa đơn điện tử, chữ ký số và hợp đồng điện tử',
        'Hỗ trợ hồ sơ đăng ký, cài đặt và kích hoạt',
        'Hướng dẫn phát hành hóa đơn ban đầu',
      ],
      benefits: ['Tiết kiệm thời gian xử lý chứng từ', 'Dễ tra cứu và bàn giao kế toán'],
      faq: [],
      items: [],
      category: null,
    },
  },
]

const solutionItems = [
  {
    slug: 'mang-wifi-camera',
    title: 'Hạ tầng mạng, Wifi và Camera',
    summary: 'Thiết kế mạng nội bộ, phủ sóng Wifi, camera giám sát và cấu hình thiết bị.',
    icon: 'server',
    sortOrder: 0,
    isFeatured: false,
    contentJson: {
      description:
        'Thiết kế mạng nội bộ, phủ sóng Wifi, camera giám sát và cấu hình thiết bị cho cửa hàng, văn phòng, chuỗi chi nhánh.',
      tags: ['LAN/Wifi', 'Camera', 'Thiết bị'],
      bestFor: 'Cửa hàng, văn phòng và chuỗi nhiều điểm',
      keyValue: 'Kết nối ổn định, dễ mở rộng',
      metrics: [],
      features: [
        'Khảo sát mặt bằng và hiện trạng mạng',
        'Thiết kế sơ đồ LAN/Wifi, router, switch và access point',
        'Lắp đặt camera IP và phân quyền xem camera',
        'Kiểm thử vùng phủ sóng, tốc độ và độ ổn định',
        'Bàn giao tài liệu vận hành và thông tin quản trị',
      ],
      benefits: [],
      faq: [],
      items: [],
      category: 'ha-tang',
    },
  },
  {
    slug: 'can-bang-tai-ha-bao-mat',
    title: 'Cân bằng tải Internet, HA và bảo mật',
    summary: 'Dự phòng đường truyền, phân tải, firewall, VPN và chính sách truy cập.',
    icon: 'shield',
    sortOrder: 1,
    isFeatured: false,
    contentJson: {
      description:
        'Dự phòng đường truyền, phân tải, firewall, VPN và chính sách truy cập để hệ thống vận hành ít gián đoạn hơn.',
      tags: ['Failover', 'Firewall', 'VPN'],
      bestFor: 'Doanh nghiệp cần mạng liên tục',
      keyValue: 'Giảm rủi ro mất kết nối',
      metrics: [],
      features: [
        'Cân bằng tải nhiều đường truyền Internet',
        'Failover khi mất mạng hoặc thiết bị lỗi',
        'Firewall, phân vùng mạng và chính sách truy cập',
        'VPN truy cập từ xa cho quản trị và chi nhánh',
      ],
      benefits: [],
      faq: [],
      items: [],
      category: 'ha-tang',
    },
  },
  {
    slug: 'data-center',
    title: 'Data center cho doanh nghiệp',
    summary: 'Tư vấn hạ tầng lưu trữ, máy chủ, backup và giám sát.',
    icon: 'server',
    sortOrder: 2,
    isFeatured: false,
    contentJson: {
      description: 'Tư vấn hạ tầng lưu trữ, máy chủ, backup, giám sát tài nguyên và phương án khôi phục dữ liệu.',
      tags: ['Storage', 'Backup', 'Monitoring'],
      bestFor: 'Doanh nghiệp có dữ liệu quan trọng',
      keyValue: 'Dữ liệu an toàn, dễ kiểm soát',
      metrics: [],
      features: [
        'Tư vấn máy chủ, lưu trữ và mô hình triển khai',
        'Thiết lập backup định kỳ và chính sách khôi phục',
        'Giám sát tài nguyên, dung lượng và tình trạng dịch vụ',
      ],
      benefits: [],
      faq: [],
      items: [],
      category: 'ha-tang',
    },
  },
  {
    slug: 'may-chu-server',
    title: 'Máy chủ, Proxy, Web/Mail/File server',
    summary: 'Triển khai server nội bộ hoặc public, cấu hình web, mail, file server, proxy, SSL.',
    icon: 'server',
    sortOrder: 3,
    isFeatured: false,
    contentJson: {
      description:
        'Triển khai server nội bộ hoặc public, cấu hình web, mail, file server, proxy, SSL, backup và giám sát log.',
      tags: ['Server', 'Proxy', 'SSL'],
      bestFor: 'Đội vận hành cần hệ thống riêng',
      keyValue: 'Chủ động hạ tầng ứng dụng',
      metrics: [],
      features: [
        'Cài đặt hệ điều hành và dịch vụ nền',
        'Cấu hình web, mail, file server hoặc proxy',
        'Thiết lập SSL, phân quyền và bảo mật truy cập',
      ],
      benefits: [],
      faq: [],
      items: [],
      category: 'ha-tang',
    },
  },
  {
    slug: 'kiem-soat-ra-vao-cham-cong',
    title: 'Kiểm soát ra vào và chấm công',
    summary: 'Tích hợp thiết bị vân tay, khuôn mặt, thẻ từ và phần mềm chấm công.',
    icon: 'shield',
    sortOrder: 4,
    isFeatured: false,
    contentJson: {
      description:
        'Tích hợp thiết bị vân tay, khuôn mặt, thẻ từ, khóa cửa điện tử và phần mềm chấm công cho văn phòng, cửa hàng.',
      tags: ['Chấm công', 'Ra vào', 'Thiết bị'],
      bestFor: 'Văn phòng, nhà xưởng và cửa hàng',
      keyValue: 'Quản lý nhân sự rõ ràng',
      metrics: [],
      features: [
        'Tư vấn thiết bị vân tay, khuôn mặt, thẻ từ hoặc khóa điện tử',
        'Cấu hình phân quyền khu vực và người dùng',
        'Đồng bộ dữ liệu chấm công và ra vào',
        'Xuất báo cáo phục vụ nhân sự và quản lý',
      ],
      benefits: [],
      faq: [],
      items: [],
      category: 'ha-tang',
    },
  },
]

const serviceItems = [
  {
    slug: 'thi-cong-mang-wifi-camera',
    title: 'Thi công mạng, Wifi, Camera',
    summary: 'Khảo sát, thiết kế và thi công hệ thống mạng, wifi, camera.',
    icon: 'network',
    sortOrder: 0,
    isFeatured: false,
    contentJson: {
      description:
        'Khảo sát, thiết kế và thi công hệ thống mạng, wifi, camera cho văn phòng, cửa hàng và chuỗi chi nhánh.',
      tags: [],
      bestFor: null,
      keyValue: null,
      metrics: [],
      features: [
        'Khảo sát mặt bằng và nhu cầu sử dụng',
        'Lập danh sách thiết bị và phương án dây',
        'Thi công, lắp đặt, cấu hình và kiểm thử',
        'Bàn giao sơ đồ hệ thống và thông tin quản trị',
      ],
      benefits: [],
      faq: [],
      items: [],
      category: null,
    },
  },
  {
    slug: 'bao-tri-it',
    title: 'Bảo trì và xử lý sự cố IT',
    summary: 'Dịch vụ bảo trì định kỳ và xử lý sự cố máy tính, mạng, máy in, camera.',
    icon: 'headphones',
    sortOrder: 1,
    isFeatured: false,
    contentJson: {
      description: 'Dịch vụ bảo trì định kỳ và xử lý sự cố máy tính, mạng, máy in, camera và phần mềm văn phòng.',
      tags: [],
      bestFor: null,
      keyValue: null,
      metrics: [],
      features: [
        'Kiểm tra thiết bị và hệ thống mạng',
        'Xử lý lỗi máy tính, máy in, camera và phần mềm',
        'Ghi nhận lịch sử hỗ trợ và khuyến nghị phòng ngừa',
        'Ưu tiên sự cố ảnh hưởng bán hàng và vận hành',
      ],
      benefits: [],
      faq: [],
      items: [],
      category: null,
    },
  },
  {
    slug: 'hosting-website',
    title: 'Tên miền, hosting, thiết kế website',
    summary: 'Cung cấp tên miền, hosting và website giới thiệu doanh nghiệp.',
    icon: 'server',
    sortOrder: 2,
    isFeatured: false,
    contentJson: {
      description:
        'Cung cấp tên miền, hosting và website giới thiệu doanh nghiệp, bán hàng hoặc landing page chiến dịch.',
      tags: [],
      bestFor: null,
      keyValue: null,
      metrics: [],
      features: [
        'Đăng ký tên miền và cấu hình hosting',
        'Thiết kế website giới thiệu hoặc landing page',
        'Tối ưu hiển thị mobile và nội dung cơ bản',
        'Hướng dẫn cập nhật nội dung sau bàn giao',
      ],
      benefits: [],
      faq: [],
      items: [],
      category: null,
    },
  },
  {
    slug: 'chu-ky-so-hoa-don-dien-tu',
    title: 'Chữ ký số, hóa đơn điện tử',
    summary: 'Tư vấn và hỗ trợ đăng ký chữ ký số, hóa đơn điện tử.',
    icon: 'shield',
    sortOrder: 3,
    isFeatured: false,
    contentJson: {
      description:
        'Tư vấn và hỗ trợ đăng ký chữ ký số, hóa đơn điện tử, hợp đồng điện tử cho hộ kinh doanh và doanh nghiệp.',
      tags: [],
      bestFor: null,
      keyValue: null,
      metrics: [],
      features: [
        'Tư vấn gói dịch vụ phù hợp',
        'Hướng dẫn hồ sơ đăng ký và kích hoạt',
        'Cài đặt công cụ ký số và kiểm tra phát hành',
      ],
      benefits: [],
      faq: [],
      items: [],
      category: null,
    },
  },
  {
    slug: 'name-card-dien-tu',
    title: 'Name card điện tử cá nhân, doanh nghiệp',
    summary: 'Thiết kế name card điện tử giúp chia sẻ thông tin liên hệ nhanh chóng.',
    icon: 'card',
    sortOrder: 4,
    isFeatured: false,
    contentJson: {
      description:
        'Thiết kế name card điện tử giúp chia sẻ thông tin liên hệ, hồ sơ năng lực, mạng xã hội và kênh tư vấn nhanh chóng.',
      tags: [],
      bestFor: null,
      keyValue: null,
      metrics: [],
      features: [
        'Thiết kế trang thông tin cá nhân hoặc doanh nghiệp',
        'Gắn số điện thoại, email, website và mạng xã hội',
        'Tạo QR code chia sẻ nhanh',
        'Tối ưu hiển thị trên điện thoại',
      ],
      benefits: [],
      faq: [],
      items: [],
      category: null,
    },
  },
  {
    slug: 'phat-trien-phan-mem',
    title: 'Phát triển phần mềm theo yêu cầu',
    summary: 'Thiết kế và phát triển phần mềm quản lý, website, ứng dụng nội bộ.',
    icon: 'code',
    sortOrder: 5,
    isFeatured: false,
    contentJson: {
      description:
        'Thiết kế và phát triển phần mềm quản lý, website, ứng dụng nội bộ hoặc công cụ tích hợp theo nghiệp vụ riêng.',
      tags: [],
      bestFor: null,
      keyValue: null,
      metrics: [],
      features: [
        'Phân tích nghiệp vụ và tài liệu yêu cầu',
        'Thiết kế giao diện và luồng sử dụng',
        'Phát triển tính năng, API và tích hợp',
        'Bảo trì, đào tạo và bàn giao theo thỏa thuận',
      ],
      benefits: [],
      faq: [],
      items: [],
      category: null,
    },
  },
  {
    slug: 'tu-van-chuyen-doi-so',
    title: 'Tư vấn chuyển đổi số',
    summary: 'Đánh giá quy trình hiện tại và đề xuất lộ trình số hóa.',
    icon: 'sparkles',
    sortOrder: 6,
    isFeatured: false,
    contentJson: {
      description:
        'Đánh giá quy trình hiện tại và đề xuất lộ trình số hóa bán hàng, kho, nhân sự, chăm sóc khách hàng và báo cáo.',
      tags: [],
      bestFor: null,
      keyValue: null,
      metrics: [],
      features: [
        'Rà soát quy trình vận hành hiện tại',
        'Xác định điểm nghẽn và dữ liệu cần chuẩn hóa',
        'Đề xuất công cụ và lộ trình triển khai',
        'Đào tạo đội ngũ theo từng giai đoạn',
      ],
      benefits: [],
      faq: [],
      items: [],
      category: null,
    },
  },
]

const industryItems = [
  {
    slug: 'nha-hang',
    title: 'Nhà hàng',
    summary: 'Quản lý bàn, gọi món, in bếp, thanh toán và doanh thu.',
    icon: 'utensils',
    sortOrder: 0,
    isFeatured: true,
    contentJson: {
      description: 'Quản lý bàn, gọi món, in bếp, thanh toán và doanh thu cho nhà hàng.',
      tags: ['Nhà hàng', 'F&B'],
      bestFor: 'Nhà hàng từ nhỏ đến chuỗi',
      keyValue: 'Vận hành bàn ăn rõ ràng',
      metrics: [],
      features: ['Sơ đồ bàn/phòng', 'Gọi món nhanh', 'In bếp/bar', 'Thanh toán đa phương thức', 'Báo cáo ca bán'],
      benefits: [],
      faq: [],
      items: [
        { title: 'Nhà hàng theo bàn', href: '/giai-phap/phan-mem/an-uong-giai-tri' },
        { title: 'Chuỗi nhà hàng', href: '/giai-phap/phan-mem/ban-hang-doanh-nghiep' },
      ],
      category: null,
    },
  },
  {
    slug: 'quan-cafe',
    title: 'Quán cafe',
    summary: 'Bán hàng nhanh, quản lý kho nguyên liệu và theo dõi doanh thu.',
    icon: 'coffee',
    sortOrder: 1,
    isFeatured: true,
    contentJson: {
      description: 'Bán hàng nhanh, quản lý kho nguyên liệu và theo dõi doanh thu cho quán cafe.',
      tags: ['Cafe', 'F&B'],
      bestFor: 'Quán cafe, trà sữa, đồ uống',
      keyValue: 'Bán nhanh, quản lý kho',
      metrics: [],
      features: [
        'Gọi món và tạo đơn nhanh',
        'Quản lý kho nguyên liệu',
        'In order lên quầy pha chế',
        'Báo cáo doanh thu theo ca',
      ],
      benefits: [],
      faq: [],
      items: [],
      category: null,
    },
  },
  {
    slug: 'ban-le',
    title: 'Bán lẻ',
    summary: 'Quét mã vạch, quản lý kho và báo cáo doanh thu theo thời gian thực.',
    icon: 'store',
    sortOrder: 2,
    isFeatured: true,
    contentJson: {
      description: 'Quét mã vạch, quản lý kho và báo cáo doanh thu theo thời gian thực cho cửa hàng bán lẻ.',
      tags: ['Bán lẻ', 'Siêu thị mini'],
      bestFor: 'Cửa hàng bán lẻ, siêu thị mini, tạp hóa',
      keyValue: 'Kiểm soát kho và doanh thu',
      metrics: [],
      features: [
        'Quét mã vạch và tạo đơn nhanh',
        'Quản lý tồn kho theo chi nhánh',
        'Kiểm kho định kỳ',
        'Báo cáo doanh thu theo ngày/tháng',
      ],
      benefits: [],
      faq: [],
      items: [],
      category: null,
    },
  },
  {
    slug: 'chuoi-cua-hang',
    title: 'Chuỗi cửa hàng',
    summary: 'Quản lý tập trung nhiều chi nhánh với phân quyền và báo cáo hợp nhất.',
    icon: 'building2',
    sortOrder: 3,
    isFeatured: false,
    contentJson: {
      description: 'Quản lý tập trung nhiều chi nhánh với phân quyền và báo cáo hợp nhất cho chuỗi cửa hàng.',
      tags: ['Chuỗi', 'Multi-branch'],
      bestFor: 'Chuỗi cửa hàng, franchise',
      keyValue: 'Quản lý tập trung nhiều chi nhánh',
      metrics: [],
      features: [
        'Danh mục sản phẩm dùng chung',
        'Phân quyền theo chi nhánh',
        'Báo cáo hợp nhất',
        'Đồng bộ giá bán và kho',
      ],
      benefits: [],
      faq: [],
      items: [],
      category: null,
    },
  },
]

// ── Import function ───────────────────────────────────────────────────────────

type OfferingType = 'software' | 'solution' | 'service' | 'industry'

async function importOfferings(type: OfferingType, items: any[]) {
  let created = 0
  let updated = 0

  for (const item of items) {
    const [existing] = await db
      .select({ id: offerings.id })
      .from(offerings)
      .where(and(eq(offerings.type, type), eq(offerings.slug, item.slug), isNull(offerings.deletedAt)))
      .limit(1)

    const values = {
      type,
      title: item.title,
      slug: item.slug,
      summary: item.summary,
      icon: item.icon,
      sortOrder: item.sortOrder,
      isFeatured: item.isFeatured,
      status: 'published' as const,
      publishedAt: new Date(),
      contentJson: item.contentJson as any,
      updatedAt: new Date(),
    }

    if (existing) {
      await db.update(offerings).set(values).where(eq(offerings.id, existing.id))
      updated++
      continue
    }

    await db.insert(offerings).values({
      coverMediaId: null,
      ...values,
    })
    created++
  }

  console.log(`[${type}] created=${created} updated=${updated}`)
}

async function main() {
  console.log('Importing offerings...')
  await importOfferings('software', softwareItems)
  await importOfferings('solution', solutionItems)
  await importOfferings('service', serviceItems)
  await importOfferings('industry', industryItems)
  console.log('Done.')
  await close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
