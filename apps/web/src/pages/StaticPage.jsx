import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowRight, CheckCircle } from 'lucide-react'
import PageLayout from '../components/PageLayout'
import { setPageSeo } from '../utils/seo'
import { fetchContentPage } from '../utils/contentApi'
import NotFound from './NotFound'

// REMOVE-BY: khi toàn bộ trang tĩnh đã vào CMS
const pages = {
  '/phan-mem/quan-ly-ban-hang-iorder': {
    title: 'Phần mềm quản lý bán hàng - iOrder',
    lead: 'Giải pháp POS giúp cửa hàng, nhà hàng và chuỗi kinh doanh quản lý bán hàng, kho, nhân viên và báo cáo trên một nền tảng.',
    sections: [
      {
        title: 'Tính năng nổi bật',
        items: [
          'Bán hàng tại quầy',
          'Quản lý kho',
          'In hóa đơn và in bếp',
          'Phân quyền nhân viên',
          'Báo cáo doanh thu',
        ],
      },
      { title: 'Phù hợp với', items: ['Nhà hàng', 'Quán cafe', 'Cửa hàng bán lẻ', 'Siêu thị mini', 'Chuỗi cửa hàng'] },
    ],
  },
  '/phan-mem/quan-ly-truong-mam-non-mimiedu': {
    title: 'Phần mềm quản lý trường mầm non - MimiEdu',
    lead: 'Hỗ trợ trường mầm non quản lý học sinh, lớp học, học phí, điểm danh và trao đổi thông tin với phụ huynh.',
    sections: [
      {
        title: 'Nghiệp vụ trường học',
        items: [
          'Quản lý hồ sơ học sinh',
          'Điểm danh',
          'Theo dõi học phí',
          'Thông báo cho phụ huynh',
          'Báo cáo lớp học',
        ],
      },
      {
        title: 'Lợi ích',
        items: [
          'Giảm giấy tờ thủ công',
          'Dữ liệu tập trung',
          'Phụ huynh nắm thông tin nhanh',
          'Ban giám hiệu dễ theo dõi',
        ],
      },
    ],
  },
  '/phan-mem/dong-bo-du-lieu-iorder-rpa': {
    title: 'Phần mềm đồng bộ dữ liệu iOrder RPA',
    lead: 'Tự động hóa thao tác lặp lại và đồng bộ dữ liệu giữa iOrder với website, sàn thương mại điện tử hoặc phần mềm nội bộ.',
    sections: [
      {
        title: 'Tác vụ có thể tự động hóa',
        items: ['Đồng bộ sản phẩm', 'Đồng bộ đơn hàng', 'Xuất nhập báo cáo', 'Kiểm tra dữ liệu định kỳ'],
      },
      {
        title: 'Giá trị vận hành',
        items: ['Giảm nhập liệu tay', 'Hạn chế sai sót', 'Tiết kiệm thời gian', 'Dễ mở rộng theo quy trình riêng'],
      },
    ],
  },
  '/phan-mem/quan-ly-tram-sac-xe-dien': {
    title: 'Phần mềm quản lý trạm sạc xe điện',
    lead: 'Quản lý điểm sạc, phiên sạc, thanh toán, trạng thái thiết bị và báo cáo doanh thu cho mô hình trạm sạc xe điện.',
    sections: [
      {
        title: 'Tính năng chính',
        items: [
          'Theo dõi trạng thái trụ sạc',
          'Quản lý phiên sạc',
          'Thanh toán',
          'Báo cáo doanh thu',
          'Quản lý người dùng',
        ],
      },
      {
        title: 'Mục tiêu',
        items: [
          'Vận hành tập trung',
          'Giám sát thiết bị tốt hơn',
          'Minh bạch doanh thu',
          'Hỗ trợ mở rộng nhiều điểm sạc',
        ],
      },
    ],
  },
  '/phan-mem/quan-ly-van-tai': {
    title: 'Phần mềm quản lý vận tải',
    lead: 'Hỗ trợ doanh nghiệp vận tải quản lý đơn vận chuyển, phương tiện, tài xế, lịch trình và chi phí khai thác.',
    sections: [
      {
        title: 'Nghiệp vụ chính',
        items: [
          'Quản lý đơn vận chuyển',
          'Theo dõi phương tiện',
          'Phân công tài xế',
          'Chi phí nhiên liệu và bảo trì',
          'Báo cáo chuyến',
        ],
      },
      {
        title: 'Lợi ích',
        items: ['Tối ưu điều phối', 'Kiểm soát chi phí', 'Theo dõi tiến độ', 'Dữ liệu vận hành tập trung'],
      },
    ],
  },
  '/phan-mem/hoa-don-dien-tu-chu-ky-so': {
    title: 'Hóa đơn điện tử - Chữ ký số',
    lead: 'Tư vấn và hỗ trợ triển khai hóa đơn điện tử, chữ ký số, hợp đồng điện tử cho cửa hàng và doanh nghiệp.',
    sections: [
      {
        title: 'Hỗ trợ triển khai',
        items: ['Tư vấn gói dịch vụ', 'Hướng dẫn hồ sơ', 'Cài đặt chữ ký số', 'Hỗ trợ phát hành hóa đơn'],
      },
      {
        title: 'Phù hợp với',
        items: ['Hộ kinh doanh', 'Doanh nghiệp nhỏ', 'Chuỗi cửa hàng', 'Đơn vị cần chuẩn hóa chứng từ'],
      },
    ],
  },
  '/giai-phap/phan-mem': {
    title: 'Phần mềm cho các lĩnh vực',
    lead: 'Bộ giải pháp quản lý bán hàng, vận hành và chăm sóc khách hàng cho nhiều mô hình kinh doanh.',
    sections: [
      {
        title: 'Nhóm lĩnh vực trọng tâm',
        items: ['Bán hàng và doanh nghiệp', 'Sức khỏe và làm đẹp', 'Quản lý thể thao', 'Ăn uống và giải trí'],
      },
      {
        title: 'Năng lực triển khai',
        items: [
          'Tư vấn quy trình trước khi cài đặt',
          'Chuẩn hóa danh mục sản phẩm, giá bán và kho',
          'Đào tạo nhân viên theo vai trò',
          'Báo cáo vận hành theo chi nhánh',
        ],
      },
    ],
  },
  '/giai-phap/phan-mem/ban-hang-doanh-nghiep': {
    title: 'Giải pháp bán hàng và doanh nghiệp',
    lead: 'Quản lý bán hàng, đơn hàng, tồn kho, khách hàng và báo cáo cho cửa hàng, siêu thị mini, food court và mô hình nhiều điểm bán.',
    sections: [
      {
        title: 'Tính năng chính',
        items: [
          'Bán hàng POS tại quầy',
          'Quản lý tồn kho theo chi nhánh',
          'Theo dõi công nợ và khách hàng',
          'Báo cáo doanh thu theo ca, ngày, tháng',
        ],
      },
      {
        title: 'Phù hợp với',
        items: ['Cửa hàng bán lẻ', 'Siêu thị mini', 'Chuỗi cửa hàng', 'Doanh nghiệp cần đồng bộ dữ liệu bán hàng'],
      },
    ],
  },
  '/giai-phap/phan-mem/suc-khoe-lam-dep': {
    title: 'Giải pháp sức khỏe và làm đẹp',
    lead: 'Hỗ trợ spa, salon, nail, clinic và thẩm mỹ viện quản lý lịch hẹn, dịch vụ, khách hàng và doanh thu.',
    sections: [
      {
        title: 'Quản lý vận hành',
        items: [
          'Lịch hẹn và trạng thái phục vụ',
          'Gói dịch vụ và liệu trình',
          'Thông tin khách hàng thân thiết',
          'Hoa hồng nhân viên tư vấn và kỹ thuật viên',
        ],
      },
      {
        title: 'Báo cáo cần có',
        items: [
          'Doanh thu theo dịch vụ',
          'Tần suất quay lại của khách',
          'Hiệu suất nhân viên',
          'Tồn kho mỹ phẩm và vật tư',
        ],
      },
    ],
  },
  '/giai-phap/phan-mem/quan-ly-the-thao': {
    title: 'Giải pháp quản lý thể thao',
    lead: 'Quản lý hội viên, sân bãi, lịch đặt, dịch vụ phụ trợ và doanh thu cho phòng gym, yoga, pickleball, golf 3D và sân thể thao.',
    sections: [
      {
        title: 'Nghiệp vụ chính',
        items: [
          'Quản lý gói hội viên',
          'Đặt lịch theo khung giờ',
          'Thanh toán và gia hạn gói',
          'Theo dõi doanh thu dịch vụ',
        ],
      },
      {
        title: 'Mở rộng',
        items: ['Thông báo lịch tập', 'Quản lý huấn luyện viên', 'Bán hàng tại quầy', 'Báo cáo sử dụng sân/phòng'],
      },
    ],
  },
  '/giai-phap/phan-mem/an-uong-giai-tri': {
    title: 'Giải pháp ăn uống và giải trí',
    lead: 'Tối ưu quy trình gọi món, in bếp, thanh toán, quản lý bàn/phòng và kiểm soát doanh thu theo ca.',
    sections: [
      {
        title: 'Tính năng vận hành',
        items: ['Sơ đồ bàn/phòng', 'Gọi món nhanh', 'In bếp/bar', 'Tách/gộp/chuyển bàn', 'Thanh toán đa phương thức'],
      },
      { title: 'Mô hình phù hợp', items: ['Nhà hàng', 'Quán cafe', 'Bar', 'Karaoke', 'Khu vui chơi'] },
    ],
  },
  '/giai-phap/ha-tang': {
    title: 'Giải pháp hạ tầng mạng',
    lead: 'Thiết kế, triển khai và bảo trì hạ tầng mạng, wifi, camera, máy chủ và hệ thống bảo mật cho doanh nghiệp.',
    sections: [
      {
        title: 'Hạng mục triển khai',
        items: [
          'Khảo sát hiện trạng',
          'Thiết kế sơ đồ mạng',
          'Thi công và cấu hình thiết bị',
          'Bàn giao tài liệu vận hành',
        ],
      },
      {
        title: 'Mục tiêu',
        items: ['Kết nối ổn định', 'Dễ mở rộng', 'Bảo mật tốt hơn', 'Giảm thời gian gián đoạn dịch vụ'],
      },
    ],
  },
  '/giai-phap/ha-tang/mang-wifi-camera': {
    title: 'Mạng nội bộ, Wifi và Camera',
    lead: 'Xây dựng hệ thống mạng nội bộ, wifi phủ sóng và camera giám sát ổn định cho cửa hàng, văn phòng và chuỗi chi nhánh.',
    sections: [
      {
        title: 'Phạm vi',
        items: [
          'Thiết kế LAN/Wifi',
          'Cấu hình router, switch, access point',
          'Lắp đặt camera IP',
          'Phân quyền xem camera',
        ],
      },
      {
        title: 'Bàn giao',
        items: ['Sơ đồ kết nối', 'Tài khoản quản trị', 'Hướng dẫn vận hành', 'Lịch bảo trì đề xuất'],
      },
    ],
  },
  '/giai-phap/ha-tang/can-bang-tai-ha-bao-mat': {
    title: 'Cân bằng tải Internet, HA và bảo mật',
    lead: 'Giúp hệ thống internet và dịch vụ nội bộ vận hành ổn định hơn nhờ dự phòng đường truyền, phân tải và chính sách bảo mật.',
    sections: [
      {
        title: 'Giải pháp',
        items: ['Cân bằng tải nhiều WAN', 'Failover khi mất mạng', 'Firewall và phân vùng mạng', 'VPN truy cập từ xa'],
      },
      { title: 'Lợi ích', items: ['Giảm gián đoạn', 'Tăng bảo mật', 'Quản lý truy cập rõ ràng', 'Dễ theo dõi sự cố'] },
    ],
  },
  '/giai-phap/ha-tang/data-center': {
    title: 'Data center cho doanh nghiệp',
    lead: 'Tư vấn hạ tầng lưu trữ, máy chủ, backup và giám sát phù hợp với nhu cầu vận hành của doanh nghiệp.',
    sections: [
      { title: 'Thành phần', items: ['Máy chủ', 'Lưu trữ dữ liệu', 'Backup định kỳ', 'Giám sát tài nguyên'] },
      {
        title: 'Yêu cầu kiểm soát',
        items: ['Tính sẵn sàng', 'Khả năng mở rộng', 'An toàn dữ liệu', 'Quy trình khôi phục'],
      },
    ],
  },
  '/giai-phap/ha-tang/may-chu-server': {
    title: 'Máy chủ, Proxy, Web server, Mail server',
    lead: 'Triển khai máy chủ ứng dụng, proxy, web, mail và file server theo nhu cầu sử dụng nội bộ hoặc public.',
    sections: [
      {
        title: 'Dịch vụ',
        items: ['Cài đặt hệ điều hành', 'Cấu hình web/mail/file server', 'Thiết lập proxy', 'Backup và giám sát'],
      },
      { title: 'Bảo mật', items: ['Phân quyền truy cập', 'Cập nhật định kỳ', 'Chứng chỉ SSL', 'Theo dõi log'] },
    ],
  },
  '/giai-phap/ha-tang/kiem-soat-ra-vao-cham-cong': {
    title: 'Kiểm soát ra vào, chấm công',
    lead: 'Tích hợp thiết bị vân tay, khuôn mặt, thẻ từ và phần mềm chấm công cho văn phòng, cửa hàng và nhà xưởng.',
    sections: [
      {
        title: 'Tính năng',
        items: ['Quản lý nhân sự', 'Ghi nhận giờ vào ra', 'Xuất báo cáo chấm công', 'Phân quyền khu vực'],
      },
      { title: 'Thiết bị', items: ['Máy chấm công', 'Khóa cửa điện tử', 'Đầu đọc thẻ', 'Camera hỗ trợ giám sát'] },
    ],
  },
  '/giai-phap/dich-vu-cntt': {
    title: 'Dịch vụ CNTT',
    lead: 'Dịch vụ hỗ trợ triển khai, bảo trì, xử lý sự cố và tư vấn chuyển đổi số cho doanh nghiệp.',
    sections: [
      {
        title: 'Nhóm dịch vụ',
        items: [
          'Thi công mạng, wifi, camera',
          'Bảo trì IT',
          'Hosting và website',
          'Chữ ký số và hóa đơn điện tử',
          'Phát triển phần mềm theo yêu cầu',
        ],
      },
      {
        title: 'Cách làm việc',
        items: ['Tiếp nhận yêu cầu', 'Khảo sát và đề xuất', 'Triển khai', 'Bảo hành và hỗ trợ'],
      },
    ],
  },
  '/dich-vu/dich-vu-cntt/thi-cong-mang-wifi-camera': {
    title: 'Thi công mạng, Wifi, Camera',
    lead: 'Khảo sát, thiết kế và thi công hệ thống mạng, wifi, camera cho văn phòng, cửa hàng và chuỗi chi nhánh.',
    sections: [
      {
        title: 'Quy trình',
        items: ['Khảo sát mặt bằng', 'Lập danh sách thiết bị', 'Thi công dây và lắp đặt', 'Cấu hình và kiểm thử'],
      },
      { title: 'Bàn giao', items: ['Sơ đồ hệ thống', 'Thông tin quản trị', 'Hướng dẫn sử dụng', 'Chính sách bảo trì'] },
    ],
  },
  '/dich-vu/tich-hop': {
    title: 'Dịch vụ tích hợp',
    lead: 'Kết nối iOrder với hệ thống hiện có để đồng bộ dữ liệu sản phẩm, đơn hàng, kho, khách hàng và báo cáo.',
    sections: [
      {
        title: 'Kênh tích hợp',
        items: ['Website bán hàng', 'Sàn thương mại điện tử', 'Phần mềm kế toán', 'CRM', 'Cổng thanh toán'],
      },
      {
        title: 'Cách triển khai',
        items: ['Khảo sát dữ liệu', 'Thiết kế luồng đồng bộ', 'Kiểm thử mẫu', 'Bàn giao và giám sát'],
      },
    ],
  },
  '/dich-vu/support': {
    title: 'Hỗ trợ kỹ thuật',
    lead: 'Kênh hỗ trợ kỹ thuật cho khách hàng trong quá trình cài đặt, sử dụng, xử lý lỗi thiết bị và tối ưu vận hành.',
    sections: [
      {
        title: 'Nội dung hỗ trợ',
        items: ['Cài đặt ban đầu', 'Kết nối máy in', 'Hướng dẫn thao tác', 'Kiểm tra dữ liệu', 'Tư vấn quy trình'],
      },
      { title: 'Kênh liên hệ', items: ['Hotline', 'Email', 'Zalo', 'Hỗ trợ từ xa khi cần'] },
    ],
  },
  '/dich-vu/dich-vu-cntt/bao-tri-it': {
    title: 'Bảo trì và xử lý sự cố IT',
    lead: 'Dịch vụ bảo trì định kỳ và xử lý sự cố máy tính, mạng, máy in, camera và phần mềm văn phòng.',
    sections: [
      {
        title: 'Hạng mục hỗ trợ',
        items: ['Kiểm tra thiết bị', 'Xử lý lỗi mạng', 'Cài đặt phần mềm', 'Tư vấn nâng cấp'],
      },
      {
        title: 'Cam kết vận hành',
        items: ['Tiếp nhận nhanh', 'Ưu tiên sự cố ảnh hưởng bán hàng', 'Ghi nhận lịch sử xử lý', 'Đề xuất phòng ngừa'],
      },
    ],
  },
  '/dich-vu/dich-vu-cntt/hosting-website': {
    title: 'Tên miền, hosting, thiết kế website',
    lead: 'Cung cấp tên miền, hosting và website giới thiệu doanh nghiệp, bán hàng hoặc landing page chiến dịch.',
    sections: [
      {
        title: 'Gói triển khai',
        items: ['Đăng ký tên miền', 'Cấu hình hosting', 'Thiết kế giao diện', 'Tối ưu hiển thị mobile'],
      },
      {
        title: 'Sau bàn giao',
        items: ['Hướng dẫn cập nhật nội dung', 'Backup cơ bản', 'Cấu hình email', 'Hỗ trợ kỹ thuật'],
      },
    ],
  },
  '/dich-vu/dich-vu-cntt/chu-ky-so-hoa-don-dien-tu': {
    title: 'Chữ ký số, hóa đơn điện tử',
    lead: 'Tư vấn và hỗ trợ đăng ký chữ ký số, hóa đơn điện tử, hợp đồng điện tử cho hộ kinh doanh và doanh nghiệp.',
    sections: [
      {
        title: 'Hỗ trợ',
        items: ['Tư vấn gói phù hợp', 'Hướng dẫn hồ sơ', 'Cài đặt công cụ ký số', 'Hỗ trợ xuất hóa đơn ban đầu'],
      },
      {
        title: 'Lợi ích',
        items: ['Tiết kiệm thời gian', 'Dễ tra cứu', 'Phù hợp quy trình kế toán', 'Hạn chế sai sót thủ công'],
      },
    ],
  },
  '/dich-vu/dich-vu-cntt/name-card-dien-tu': {
    title: 'Name card điện tử cá nhân, doanh nghiệp',
    lead: 'Thiết kế name card điện tử giúp cá nhân và doanh nghiệp chia sẻ thông tin liên hệ, hồ sơ năng lực, mạng xã hội và kênh tư vấn nhanh chóng.',
    sections: [
      {
        title: 'Nội dung hiển thị',
        items: [
          'Thông tin cá nhân hoặc doanh nghiệp',
          'Số điện thoại, email, địa chỉ',
          'Liên kết website và mạng xã hội',
          'QR code chia sẻ nhanh',
        ],
      },
      {
        title: 'Phù hợp với',
        items: ['Nhân sự kinh doanh', 'Chủ doanh nghiệp', 'Đội ngũ tư vấn', 'Thương hiệu cần hồ sơ giới thiệu gọn nhẹ'],
      },
    ],
  },
  '/dich-vu/dich-vu-cntt/phat-trien-phan-mem': {
    title: 'Phát triển phần mềm theo yêu cầu',
    lead: 'Thiết kế và phát triển phần mềm quản lý, website, ứng dụng nội bộ hoặc công cụ tích hợp theo nghiệp vụ riêng.',
    sections: [
      {
        title: 'Phạm vi',
        items: [
          'Phân tích nghiệp vụ',
          'Thiết kế giao diện',
          'Phát triển tính năng',
          'Tích hợp API',
          'Bảo trì sau triển khai',
        ],
      },
      {
        title: 'Đầu ra',
        items: ['Tài liệu yêu cầu', 'Bản demo', 'Mã nguồn hoặc gói triển khai theo thỏa thuận', 'Hướng dẫn sử dụng'],
      },
    ],
  },
  '/dich-vu/dich-vu-cntt/tu-van-chuyen-doi-so': {
    title: 'Tư vấn chuyển đổi số',
    lead: 'Đánh giá quy trình hiện tại và đề xuất lộ trình số hóa bán hàng, kho, nhân sự, chăm sóc khách hàng và báo cáo.',
    sections: [
      {
        title: 'Nội dung tư vấn',
        items: ['Rà soát quy trình', 'Xác định điểm nghẽn', 'Đề xuất công cụ', 'Lộ trình triển khai theo giai đoạn'],
      },
      {
        title: 'Mục tiêu',
        items: [
          'Giảm thao tác thủ công',
          'Dữ liệu tập trung',
          'Theo dõi hiệu quả tốt hơn',
          'Dễ mở rộng khi tăng chi nhánh',
        ],
      },
    ],
  },
  '/ho-tro/cai-dat': {
    title: 'Hỗ trợ cài đặt',
    lead: 'Hướng dẫn chuẩn bị thiết bị, cài đặt phần mềm, kết nối máy in và kiểm tra quy trình bán hàng ban đầu.',
    sections: [
      {
        title: 'Các bước chính',
        items: [
          'Kiểm tra thiết bị',
          'Cài đặt ứng dụng',
          'Kết nối máy in hóa đơn/bếp',
          'Tạo dữ liệu mẫu',
          'Chạy thử đơn hàng',
        ],
      },
      { title: 'Cần chuẩn bị', items: ['Máy tính hoặc tablet', 'Máy in', 'Mạng ổn định', 'Danh mục sản phẩm ban đầu'] },
    ],
  },
  '/ho-tro/faq': {
    title: 'Câu hỏi thường gặp',
    lead: 'Tổng hợp các câu hỏi phổ biến khi bắt đầu sử dụng iOrder.',
    sections: [
      {
        title: 'Bắt đầu',
        items: [
          'Có thể dùng thử trước khi đăng ký không?',
          'Có hỗ trợ nhập dữ liệu ban đầu không?',
          'Có dùng được nhiều chi nhánh không?',
        ],
      },
      {
        title: 'Vận hành',
        items: [
          'Mất mạng có ảnh hưởng bán hàng không?',
          'Có kết nối máy in bếp không?',
          'Có phân quyền nhân viên không?',
        ],
      },
    ],
  },
  '/ho-tro/video': {
    title: 'Video hướng dẫn',
    lead: 'Khu vực tổng hợp video hướng dẫn thao tác bán hàng, quản lý kho, báo cáo và cấu hình thiết bị.',
    sections: [
      { title: 'Chủ đề video', items: ['Tạo sản phẩm', 'Bán hàng POS', 'In hóa đơn', 'Kiểm kho', 'Xem báo cáo'] },
      {
        title: 'Đang cập nhật',
        items: ['Video sẽ được bổ sung theo từng nhóm nghiệp vụ', 'Liên hệ hỗ trợ nếu cần hướng dẫn trực tiếp'],
      },
    ],
  },
  '/huong-dan': {
    title: 'Hướng dẫn sử dụng',
    lead: 'Tài liệu thao tác nhanh cho người mới bắt đầu và quản lý cửa hàng.',
    sections: [
      { title: 'Người bán hàng', items: ['Đăng nhập', 'Tạo đơn', 'Thanh toán', 'In hóa đơn', 'Đóng ca'] },
      {
        title: 'Quản lý',
        items: ['Tạo sản phẩm', 'Quản lý kho', 'Thêm nhân viên', 'Xem báo cáo', 'Cấu hình chi nhánh'],
      },
    ],
  },
  '/faq': {
    title: 'FAQ',
    lead: 'Giải đáp nhanh các câu hỏi thường gặp về sản phẩm, triển khai và hỗ trợ.',
    sections: [
      {
        title: 'Sản phẩm',
        items: [
          'Có phù hợp nhà hàng và bán lẻ không?',
          'Có dùng được nhiều thiết bị không?',
          'Có báo cáo doanh thu theo thời gian thực không?',
        ],
      },
      {
        title: 'Triển khai',
        items: ['Thời gian cài đặt bao lâu?', 'Có đào tạo nhân viên không?', 'Có hỗ trợ chuyển dữ liệu không?'],
      },
    ],
  },
  '/ho-tro-tu-xa': {
    title: 'Hỗ trợ từ xa',
    lead: 'Đội ngũ kỹ thuật có thể hỗ trợ kiểm tra cấu hình, thiết bị và phần mềm qua các công cụ điều khiển từ xa.',
    sections: [
      {
        title: 'Khi nào cần hỗ trợ từ xa',
        items: ['Lỗi in hóa đơn', 'Không kết nối thiết bị', 'Cần kiểm tra cấu hình', 'Cần hướng dẫn thao tác nhanh'],
      },
      {
        title: 'Thông tin cần cung cấp',
        items: ['Tên cửa hàng', 'Số điện thoại liên hệ', 'Mô tả lỗi', 'Ảnh chụp màn hình nếu có'],
      },
    ],
  },
  '/gioi-thieu': {
    title: 'Về iOrder',
    lead: 'iOrder là nền tảng quản lý bán hàng và vận hành cửa hàng được thiết kế cho những chủ kinh doanh muốn nhìn rõ dữ liệu, giảm sai sót và mở rộng mà không đánh mất sự kiểm soát.',
    sections: [
      {
        title: 'Chúng tôi tin vào vận hành rõ ràng',
        items: [
          'Bán hàng nhanh nhưng dữ liệu phải chính xác',
          'Quản lý kho phải đi cùng đơn hàng thực tế',
          'Báo cáo phải giúp chủ cửa hàng ra quyết định ngay',
          'Mở thêm chi nhánh phải có quy trình thống nhất',
        ],
      },
      {
        title: 'iOrder đồng hành trong từng ca bán',
        items: [
          'POS tại quầy, gọi món, in bếp và thanh toán',
          'Tồn kho, khách hàng, nhân viên và phân quyền',
          'Báo cáo doanh thu theo thời gian thực',
          'Hỗ trợ thiết bị, hạ tầng và triển khai thực tế tại cửa hàng',
        ],
      },
      {
        title: 'Dành cho mô hình đang muốn lớn lên',
        items: [
          'Nhà hàng, cafe, trà sữa, bán lẻ và chuỗi cửa hàng',
          'Chủ kinh doanh cần quản lý từ xa',
          'Đội ngũ cần thao tác đơn giản, ít đào tạo',
          'Doanh nghiệp cần dữ liệu tập trung để mở rộng',
        ],
      },
      {
        title: 'Điều làm iOrder khác biệt',
        items: [
          'Không tách rời phần mềm khỏi vận hành thực tế',
          'Tập trung vào trải nghiệm nhân viên lẫn góc nhìn quản lý',
          'Linh hoạt theo nghiệp vụ từng mô hình',
          'Ưu tiên triển khai được, dùng được và đo lường được',
        ],
      },
    ],
  },
  '/terms': {
    title: 'Điều khoản dịch vụ',
    lead: 'Các điều khoản sử dụng dịch vụ, trách nhiệm hỗ trợ và nguyên tắc bảo vệ dữ liệu khi khách hàng sử dụng iOrder.',
    sections: [
      {
        title: 'Nguyên tắc sử dụng',
        items: [
          'Cung cấp thông tin chính xác',
          'Bảo mật tài khoản',
          'Sử dụng dịch vụ đúng mục đích',
          'Thông báo khi phát hiện sự cố',
        ],
      },
      {
        title: 'Hỗ trợ và dữ liệu',
        items: [
          'Hỗ trợ trong phạm vi dịch vụ đăng ký',
          'Không chia sẻ dữ liệu trái phép',
          'Sao lưu theo chính sách từng gói',
          'Liên hệ khi cần điều chỉnh thông tin',
        ],
      },
    ],
  },
  '/tin-tuc/tinh-nang-ban-hang-online-tich-hop': {
    title: 'Tính năng bán hàng online tích hợp',
    lead: 'Bán hàng online hiệu quả cần đồng bộ đơn hàng, tồn kho, khách hàng và trạng thái xử lý về cùng một hệ thống quản lý.',
    sections: [
      {
        title: 'Nội dung chính',
        items: [
          'Đồng bộ sản phẩm giữa kênh online và POS',
          'Kiểm soát tồn kho khi phát sinh đơn',
          'Theo dõi trạng thái xử lý đơn',
          'Tổng hợp báo cáo theo kênh bán',
        ],
      },
      {
        title: 'Checklist triển khai',
        items: [
          'Chuẩn hóa mã sản phẩm',
          'Cấu hình kho xuất hàng',
          'Quy định quy trình xác nhận đơn',
          'Kiểm tra báo cáo sau mỗi ca',
        ],
      },
    ],
  },
  '/tin-tuc/cach-toi-uu-hoa-doanh-thu-ban-hang': {
    title: 'Cách tối ưu hóa doanh thu bán hàng',
    lead: 'Doanh thu tăng bền vững khi cửa hàng kiểm soát tốt tốc độ phục vụ, tồn kho, khuyến mãi và dữ liệu khách hàng.',
    sections: [
      {
        title: 'Việc nên làm',
        items: [
          'Theo dõi sản phẩm bán chạy',
          'Tạo combo phù hợp',
          'Nhắc lại khách hàng cũ',
          'So sánh doanh thu theo ca và nhân viên',
        ],
      },
      {
        title: 'Dữ liệu cần xem',
        items: ['Doanh thu theo ngày', 'Biên lợi nhuận', 'Tỷ lệ hủy đơn', 'Tồn kho chậm luân chuyển'],
      },
    ],
  },
  '/tin-tuc/cau-chuyen-khach-hang-mo-rong-chuoi': {
    title: 'Mở rộng chuỗi cửa hàng cần chuẩn bị gì?',
    lead: 'Khi tăng số lượng chi nhánh, dữ liệu tập trung, phân quyền rõ ràng và quy trình vận hành thống nhất là điều kiện quan trọng.',
    sections: [
      {
        title: 'Nền tảng cần có',
        items: [
          'Danh mục sản phẩm dùng chung',
          'Báo cáo theo chi nhánh',
          'Phân quyền quản lý',
          'Đồng bộ kho và giá bán',
        ],
      },
      {
        title: 'Rủi ro thường gặp',
        items: [
          'Mỗi chi nhánh tự đặt quy trình riêng',
          'Không kiểm soát tồn kho',
          'Báo cáo chậm',
          'Khó đào tạo nhân viên mới',
        ],
      },
    ],
  },
  '/tin-tuc/cap-nhat-bao-mat-du-lieu': {
    title: 'Bảo mật dữ liệu bán hàng',
    lead: 'Dữ liệu bán hàng, khách hàng và doanh thu cần được bảo vệ bằng phân quyền, sao lưu và quy trình quản trị tài khoản rõ ràng.',
    sections: [
      {
        title: 'Nguyên tắc bảo mật',
        items: [
          'Không dùng chung tài khoản',
          'Phân quyền theo vai trò',
          'Khóa tài khoản nhân viên nghỉ việc',
          'Sao lưu dữ liệu định kỳ',
        ],
      },
      {
        title: 'Điểm cần kiểm tra',
        items: ['Danh sách tài khoản', 'Lịch sử thao tác quan trọng', 'Thiết bị đăng nhập', 'Quy trình đổi mật khẩu'],
      },
    ],
  },
  '/tin-tuc/ket-noi-iorder-voi-he-thong-hien-tai': {
    title: 'Kết nối iOrder với hệ thống hiện tại',
    lead: 'Tích hợp hệ thống giúp giảm nhập liệu thủ công và đảm bảo dữ liệu sản phẩm, đơn hàng, kho, khách hàng được đồng bộ đúng quy trình.',
    sections: [
      {
        title: 'Luồng thường tích hợp',
        items: [
          'Đơn hàng online về POS',
          'Tồn kho từ POS sang website',
          'Dữ liệu khách hàng sang CRM',
          'Báo cáo sang kế toán',
        ],
      },
      {
        title: 'Chuẩn bị trước khi tích hợp',
        items: ['Mã sản phẩm thống nhất', 'Quy định kho nguồn', 'Tài khoản API', 'Kịch bản kiểm thử'],
      },
    ],
  },
  '/tin-tuc/phan-mem-pos-tot-nhat-2024': {
    title: 'Tiêu chí chọn phần mềm POS phù hợp',
    lead: 'Một phần mềm POS tốt không chỉ bán hàng nhanh mà còn phải hỗ trợ kho, báo cáo, nhân viên, thiết bị và khả năng mở rộng.',
    sections: [
      {
        title: 'Tiêu chí đánh giá',
        items: [
          'Dễ dùng',
          'Ổn định khi đông khách',
          'Kết nối máy in và thiết bị',
          'Báo cáo rõ ràng',
          'Hỗ trợ sau bán hàng',
        ],
      },
      {
        title: 'Câu hỏi trước khi chọn',
        items: [
          'Có phù hợp mô hình của mình không?',
          'Có mở rộng nhiều chi nhánh không?',
          'Có hỗ trợ nhập dữ liệu ban đầu không?',
          'Chi phí duy trì gồm những gì?',
        ],
      },
    ],
  },
}

const aliases = {
  '/dich-vu/dich-vu-cntt': '/giai-phap/dich-vu-cntt',
  '/giai-phap/dich-vu-cntt/thi-cong-mang-wifi-camera': '/dich-vu/dich-vu-cntt/thi-cong-mang-wifi-camera',
  '/giai-phap/dich-vu-cntt/bao-tri-it': '/dich-vu/dich-vu-cntt/bao-tri-it',
  '/giai-phap/dich-vu-cntt/hosting-website': '/dich-vu/dich-vu-cntt/hosting-website',
  '/giai-phap/dich-vu-cntt/chu-ky-so-hoa-don-dien-tu': '/dich-vu/dich-vu-cntt/chu-ky-so-hoa-don-dien-tu',
  '/giai-phap/dich-vu-cntt/phat-trien-phan-mem': '/dich-vu/dich-vu-cntt/phat-trien-phan-mem',
  '/giai-phap/dich-vu-cntt/tu-van-chuyen-doi-so': '/dich-vu/dich-vu-cntt/tu-van-chuyen-doi-so',
}

export default function StaticPage() {
  const location = useLocation()
  const normalizedPath = aliases[location.pathname] ?? location.pathname
  const staticPage = pages[normalizedPath]

  const [cmsPage, setCmsPage] = useState(null)
  const [cmsChecked, setCmsChecked] = useState(false)

  useEffect(() => {
    let active = true
    setCmsChecked(false)
    setCmsPage(null)
    const slug = normalizedPath.replace(/^\/+/, '')
    fetchContentPage(slug)
      .then((item) => {
        if (active) setCmsPage(item)
      })
      .catch(() => {
        if (active) setCmsPage(null)
      })
      .finally(() => {
        if (active) setCmsChecked(true)
      })
    return () => {
      active = false
    }
  }, [normalizedPath])

  const page = cmsPage ?? staticPage

  useEffect(() => {
    if (!page) return
    setPageSeo({
      title: `${cmsPage?.seoTitle ?? page.title} - iOrder`,
      description: cmsPage?.seoDescription ?? page.lead,
    })
  }, [location.pathname, page, cmsPage])

  // Chưa xác định được CMS có nội dung hay không → tránh chớp 404 tạm thời
  if (!cmsChecked && !staticPage) return null

  // URL không khớp trang nào (CMS lẫn tĩnh) → trang 404 thật (kèm noindex)
  if (!page) return <NotFound />

  if (cmsPage) {
    return (
      <PageLayout mainProps={{ 'data-content-source': 'cms' }}>
        <section className="detail-hero">
          <div className="container">
            <h1 className="detail-title">{cmsPage.title}</h1>
            {cmsPage.lead ? <p className="detail-summary">{cmsPage.lead}</p> : null}
          </div>
        </section>

        <section className="detail-section">
          <div className="container">
            <div className="static-page-body" dangerouslySetInnerHTML={{ __html: cmsPage.body }} />
          </div>
        </section>

        <section className="detail-cta">
          <div className="container">
            <h2>Cần tư vấn chi tiết?</h2>
            <p>Đội ngũ iOrder sẽ hỗ trợ chọn giải pháp, cấu hình và lộ trình triển khai phù hợp.</p>
            <Link to="/lien-he" className="btn large primary">
              <span>Liên hệ tư vấn</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        </section>
      </PageLayout>
    )
  }

  return (
    <PageLayout mainProps={{ 'data-content-source': 'static-fallback' }}>
      <section className="detail-hero">
        <div className="container">
          <h1 className="detail-title">{staticPage.title}</h1>
          <p className="detail-summary">{staticPage.lead}</p>
        </div>
      </section>

      <section className="detail-section">
        <div className="container">
          <div className="detail-grid">
            {staticPage.sections.map((section) => (
              <div key={section.title} className="detail-card">
                <h2 style={{ marginTop: 0 }}>{section.title}</h2>
                <div className="detail-list">
                  {section.items.map((item) => (
                    <div key={item} className="detail-list-item">
                      <CheckCircle size={22} color="#1588e3" />
                      <p>{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="detail-cta">
        <div className="container">
          <h2>Cần tư vấn chi tiết?</h2>
          <p>Đội ngũ iOrder sẽ hỗ trợ chọn giải pháp, cấu hình và lộ trình triển khai phù hợp.</p>
          <Link to="/lien-he" className="btn large primary">
            <span>Liên hệ tư vấn</span>
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </PageLayout>
  )
}
