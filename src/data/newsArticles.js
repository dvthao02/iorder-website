import newsImage1 from '../assets/news/news1.jpg'
import newsImage2 from '../assets/news/news2.jpg'
import newsImage3 from '../assets/news/news3.jpg'

export const newsArticles = [
  {
    id: 1,
    slug: 'toi-uu-quan-ly-nha-hang-voi-order-tai-ban-iorder',
    title: 'Tối ưu hoá quản lý nhà hàng với giải pháp order tại bàn iOrder',
    excerpt: 'Order tại bàn giúp nhà hàng giảm thời gian chờ, hạn chế sai sót khi ghi món và đồng bộ đơn hàng tới thu ngân, bếp/bar nhanh hơn.',
    category: 'Nhà hàng - Cafe',
    date: '2026-06-02',
    focusName: 'Order tại bàn',
    sourceUrl: 'https://iorder.vn/detail-news-2',
    image: newsImage1,
    imageAlt: 'Nhân viên nhà hàng sử dụng iOrder để order tại bàn',
    readingTime: '6 phút đọc',
    highlights: ['Order tại bàn', 'In bill nhanh', 'Giảm sai sót'],
    body: [
      'Trong giờ cao điểm, nhân viên nhà hàng thường phải nhận món liên tục, chuyển thông tin xuống bếp và cập nhật bill cho từng bàn. iOrder giải quyết điểm nghẽn này bằng luồng order tại bàn, nơi món được ghi nhận ngay trên hệ thống và truyền về khu vực xử lý phù hợp.',
      'Khi đơn hàng được cập nhật theo thời gian thực, thu ngân và phục vụ nhìn cùng một dữ liệu: bàn nào đang dùng món, món nào đã thêm, tổng bill hiện tại là bao nhiêu và khi nào cần in hóa đơn. Cách làm này giảm phụ thuộc vào ghi chép thủ công và hạn chế nhầm món.',
      'Bài toán không chỉ là gọi món nhanh hơn. iOrder còn giúp nhà hàng tạo trải nghiệm chuyên nghiệp hơn cho khách, rút ngắn thời gian thanh toán, hỗ trợ thanh toán online và cung cấp dữ liệu doanh thu, kho, hiệu suất nhân viên để chủ quán ra quyết định dựa trên số liệu.'
    ],
    checklist: ['Có order tại bàn theo từng bàn/phòng không?', 'Đơn có chuyển nhanh tới bếp/bar không?', 'Bill có cập nhật theo thời gian thực không?', 'Có in hóa đơn và hỗ trợ thanh toán online không?']
  },
  {
    id: 2,
    slug: 'quan-ly-kho-iorder-cho-cua-hang-ban-le',
    title: 'Quản lý kho iOrder cho cửa hàng bán lẻ',
    excerpt: 'iOrder giúp chủ cửa hàng theo dõi nhập xuất tồn, cảnh báo hàng sắp hết và kiểm tra lệch kho theo từng chi nhánh.',
    category: 'Quản lý kho',
    date: '2026-06-02',
    focusName: 'Tồn kho rõ ràng',
    image: newsImage2,
    imageAlt: 'Quản lý kho và sản phẩm trên hệ thống iOrder',
    readingTime: '6 phút đọc',
    highlights: ['Nhập xuất tồn', 'Cảnh báo tồn thấp', 'Theo chi nhánh'],
    body: [
      'Kho là phần dễ lệch nhất khi cửa hàng vừa bán tại quầy, vừa nhập hàng, đổi trả hoặc chuyển hàng giữa các điểm bán. iOrder gom các nghiệp vụ này vào một dữ liệu tồn kho tập trung.',
      'Chủ cửa hàng có thể theo dõi số lượng còn lại, lịch sử nhập xuất, nhóm sản phẩm bán nhanh và nhóm hàng chậm luân chuyển. Khi tồn kho xuống thấp, cửa hàng có cơ sở để nhập bổ sung trước khi hết hàng.',
      'Với mô hình nhiều chi nhánh, iOrder giúp tách tồn theo từng điểm bán để quản lý không phải đoán hàng đang nằm ở đâu. Báo cáo kho đi cùng dữ liệu bán hàng thực tế, giảm phụ thuộc vào sổ tay hoặc file rời.'
    ],
    checklist: ['Có theo dõi tồn theo chi nhánh không?', 'Có lịch sử nhập xuất rõ ràng không?', 'Có cảnh báo hàng sắp hết không?', 'Có kiểm được sản phẩm bán chậm không?']
  },
  {
    id: 3,
    slug: 'iorder-cho-nha-hang-cafe-goi-mon-in-bep-thanh-toan',
    title: 'iOrder cho nhà hàng, cafe: gọi món, in bếp, thanh toán',
    excerpt: 'Mô hình F&B cần sơ đồ bàn, gọi món nhanh, in bếp/bar và xử lý tách gộp bàn mượt trong giờ cao điểm.',
    category: 'Nhà hàng - Cafe',
    date: '2026-06-01',
    focusName: 'Vận hành F&B',
    image: newsImage3,
    imageAlt: 'Quy trình gọi món và in bếp cho nhà hàng cafe',
    readingTime: '5 phút đọc',
    highlights: ['Sơ đồ bàn', 'In bếp/bar', 'Tách gộp bàn'],
    body: [
      'Nhà hàng và quán cafe không chỉ cần một màn hình tính tiền. Quy trình thực tế gồm nhận bàn, gọi món, chuyển món xuống bếp hoặc bar, bổ sung món, tách gộp bàn và thanh toán nhiều phương thức.',
      'iOrder tập trung vào luồng vận hành đó để nhân viên phục vụ, thu ngân và bếp cùng nhìn đúng trạng thái đơn. Món được gửi xuống khu vực xử lý phù hợp, hạn chế nhầm món hoặc bỏ sót trong giờ đông khách.',
      'Khi đóng ca, chủ quán cần xem doanh thu, món bán chạy, hóa đơn hủy, phương thức thanh toán và hiệu suất từng ca. Đây là phần iOrder kết nối trực tiếp giữa thao tác tại bàn và báo cáo quản lý.'
    ],
    checklist: ['Có sơ đồ bàn/phòng không?', 'Có in bếp và in bar riêng không?', 'Có tách/gộp/chuyển bàn không?', 'Có xem món bán chạy theo ngày không?']
  },
  {
    id: 4,
    slug: 'bao-cao-doanh-thu-iorder-giup-chu-cua-hang-nhin-ro-dieu-gi',
    title: 'Báo cáo doanh thu iOrder giúp chủ cửa hàng nhìn rõ điều gì?',
    excerpt: 'Doanh thu theo ngày, ca, nhân viên, chi nhánh và sản phẩm bán chạy là dữ liệu nền để ra quyết định nhanh hơn.',
    category: 'Báo cáo doanh thu',
    date: '2026-05-31',
    focusName: 'Quản trị bằng dữ liệu',
    image: newsImage1,
    imageAlt: 'Báo cáo doanh thu iOrder trên màn hình quản lý',
    readingTime: '4 phút đọc',
    highlights: ['Theo ca', 'Theo nhân viên', 'Theo sản phẩm'],
    body: [
      'Một báo cáo tốt không chỉ liệt kê tổng tiền bán được. Chủ cửa hàng cần biết doanh thu đến từ đâu, ca nào bán tốt, sản phẩm nào đang kéo doanh số và điểm bán nào cần được hỗ trợ.',
      'iOrder ghi nhận dữ liệu từ đơn hàng để tạo báo cáo theo ngày, ca, nhân viên, hình thức thanh toán và chi nhánh. Khi dữ liệu cập nhật liên tục, chủ cửa hàng có thể theo dõi từ xa mà không phải chờ tổng hợp cuối ngày.',
      'Báo cáo cũng giúp phát hiện vấn đề: tồn kho cao nhưng bán chậm, doanh thu lệch giữa các ca, tỷ lệ hủy đơn bất thường hoặc chi nhánh có doanh thu giảm. Đây là cơ sở để điều chỉnh nhập hàng, đào tạo nhân viên và tối ưu vận hành.'
    ],
    checklist: ['Có xem doanh thu theo ca không?', 'Có tách tiền mặt và chuyển khoản không?', 'Có biết sản phẩm bán chạy không?', 'Có so sánh chi nhánh được không?']
  },
  {
    id: 5,
    slug: 'trien-khai-iorder-cho-cua-hang-moi-can-chuan-bi-gi',
    title: 'Triển khai iOrder cho cửa hàng mới cần chuẩn bị gì?',
    excerpt: 'Danh mục sản phẩm, bảng giá, thiết bị bán hàng, tài khoản nhân viên và quy trình ca là những phần nên chuẩn bị trước.',
    category: 'Triển khai',
    date: '2026-05-30',
    focusName: 'Cài đặt ban đầu',
    image: newsImage2,
    imageAlt: 'Cài đặt thiết bị bán hàng và dữ liệu iOrder',
    readingTime: '5 phút đọc',
    highlights: ['Danh mục sản phẩm', 'Thiết bị', 'Đào tạo nhân viên'],
    body: [
      'Triển khai phần mềm bán hàng hiệu quả bắt đầu từ dữ liệu ban đầu. Cửa hàng nên chuẩn bị danh mục sản phẩm, nhóm hàng, giá bán, đơn vị tính, tồn kho đầu kỳ và danh sách nhân viên.',
      'Với thiết bị, iOrder có thể được cấu hình cùng máy in hóa đơn, máy in bếp, máy quét mã vạch hoặc thiết bị bán hàng tại quầy. Kiểm tra thiết bị trước ngày khai trương giúp giảm rủi ro gián đoạn khi bắt đầu bán thật.',
      'Sau phần cài đặt, đội ngũ cần thống nhất quy trình: ai được giảm giá, ai được hủy đơn, khi nào đóng ca, cách xử lý đổi trả và kênh liên hệ hỗ trợ. iOrder vận hành tốt nhất khi phần mềm đi cùng quy trình rõ.'
    ],
    checklist: ['Đã có danh mục sản phẩm chưa?', 'Đã kiểm tra máy in và mã vạch chưa?', 'Đã tạo tài khoản nhân viên chưa?', 'Đã thống nhất quy trình chốt ca chưa?']
  },
  {
    id: 6,
    slug: 'iorder-phu-hop-voi-mo-hinh-kinh-doanh-nao',
    title: 'iOrder phù hợp với mô hình kinh doanh nào?',
    excerpt: 'iOrder phục vụ cửa hàng bán lẻ, cafe, nhà hàng, trà sữa, mini mart và chuỗi cần quản lý dữ liệu tập trung.',
    category: 'Mô hình kinh doanh',
    date: '2026-05-29',
    focusName: 'Mô hình phù hợp',
    image: newsImage3,
    imageAlt: 'Các mô hình cửa hàng sử dụng iOrder',
    readingTime: '7 phút đọc',
    highlights: ['Bán lẻ', 'F&B', 'Chuỗi cửa hàng'],
    body: [
      'iOrder phù hợp với các mô hình cần bán hàng nhanh tại quầy nhưng vẫn phải kiểm soát tồn kho, nhân viên, khách hàng và doanh thu. Nhóm phổ biến gồm cửa hàng bán lẻ, mini mart, cafe, trà sữa, nhà hàng và chuỗi nhiều điểm bán.',
      'Với bán lẻ, trọng tâm là mã vạch, tồn kho, giá bán và báo cáo sản phẩm. Với F&B, trọng tâm chuyển sang sơ đồ bàn, gọi món, in bếp và thanh toán. Với chuỗi, trọng tâm là dữ liệu tập trung, phân quyền và báo cáo theo chi nhánh.',
      'Điểm mạnh của iOrder là có thể bắt đầu từ một cửa hàng nhỏ rồi mở rộng dần. Khi mô hình lớn hơn, chủ kinh doanh có thể chuẩn hóa danh mục, quyền nhân viên, báo cáo và quy trình triển khai cho từng điểm bán.'
    ],
    checklist: ['Cửa hàng có cần bán nhanh tại quầy không?', 'Có cần quản lý tồn kho không?', 'Có nhiều nhân viên hoặc chi nhánh không?', 'Có cần xem báo cáo từ xa không?']
  }
]

export function findNewsArticle(slug) {
  return newsArticles.find((article) => article.slug === slug)
}
