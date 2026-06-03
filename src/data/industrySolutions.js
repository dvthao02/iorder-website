export const industryGroups = [
  {
    title: 'Bán buôn, bán lẻ',
    items: [
      { slug: 'thoi-trang', title: 'Thời trang', desc: 'Quản lý màu, size, mã vạch, đổi trả và tồn kho.' },
      { slug: 'dien-thoai-dien-may', title: 'Điện thoại & điện máy', desc: 'Theo dõi IMEI/serial, bảo hành, tồn kho và công nợ.' },
      { slug: 'tap-hoa-sieu-thi', title: 'Tạp hóa & siêu thị', desc: 'Quét mã nhanh, giá bán linh hoạt, kiểm kho định kỳ.' },
      { slug: 'my-pham', title: 'Mỹ phẩm', desc: 'Quản lý lô hàng, hạn dùng, combo và khách hàng thân thiết.' },
      { slug: 'vat-lieu-noi-that', title: 'Vật liệu & nội thất', desc: 'Báo giá, đơn vị tính, đơn hàng lớn và công nợ.' },
      { slug: 'nha-thuoc', title: 'Nhà thuốc', desc: 'Danh mục lớn, đơn vị quy đổi, tồn kho và hóa đơn.' },
    ],
  },
  {
    title: 'Ăn uống, giải trí',
    items: [
      { slug: 'nha-hang', title: 'Nhà hàng', desc: 'Sơ đồ bàn, gọi món, in bếp/bar và thanh toán.' },
      { slug: 'cafe-tra-sua', title: 'Cafe, trà sữa', desc: 'Order nhanh, topping, combo và báo cáo món bán chạy.' },
      { slug: 'quan-an', title: 'Quán ăn', desc: 'Bán nhanh, in bếp, tách/gộp bàn và chốt ca.' },
      { slug: 'karaoke-bida', title: 'Karaoke, bida', desc: 'Quản lý phòng, thời gian sử dụng và thanh toán dịch vụ.' },
      { slug: 'bar-pub-club', title: 'Bar, pub & club', desc: 'Ca bán, tồn kho đồ uống, nhân viên và doanh thu.' },
      { slug: 'canteen-tram-dung', title: 'Canteen, trạm dừng', desc: 'Nhiều quầy, bán nhanh, in bill và báo cáo ca.' },
    ],
  },
  {
    title: 'Dịch vụ, lưu trú, làm đẹp',
    items: [
      { slug: 'spa-massage', title: 'Beauty spa & massage', desc: 'Dịch vụ, lịch hẹn, gói liệu trình và khách hàng.' },
      { slug: 'salon-nails', title: 'Hair salon & nails', desc: 'Nhân viên, hoa hồng, lịch hẹn và bán sản phẩm.' },
      { slug: 'khach-san-nha-nghi', title: 'Khách sạn & nhà nghỉ', desc: 'Phòng, đặt lịch, phụ thu và thanh toán.' },
      { slug: 'homestay-resort', title: 'Homestay, villa, resort', desc: 'Đặt phòng, dịch vụ đi kèm và báo cáo doanh thu.' },
      { slug: 'fitness-yoga', title: 'Fitness & yoga', desc: 'Hội viên, gói tập, lịch lớp và gia hạn.' },
      { slug: 'phong-kham', title: 'Phòng khám', desc: 'Hồ sơ, lịch hẹn, dịch vụ và thu phí.' },
    ],
  },
]

export const industrySolutions = industryGroups.flatMap((group) =>
  group.items.map((item) => ({
    ...item,
    group: group.title,
    hero: `Phần mềm quản lý ${item.title.toLowerCase()} iOrder`,
    lead: `iOrder được cấu hình theo đặc thù ngành ${item.title.toLowerCase()}, giúp quản lý bán hàng, tồn kho, nhân viên, khách hàng và báo cáo trên cùng một nền tảng.`,
    benefits: [
      'Thao tác bán hàng nhanh, dễ đào tạo nhân viên mới',
      'Dữ liệu sản phẩm, đơn hàng, tồn kho và doanh thu tập trung',
      'Báo cáo rõ theo ngày, ca, nhân viên và chi nhánh',
      'Hỗ trợ thiết bị bán hàng, máy in, mã vạch và quy trình triển khai thực tế',
    ],
    features: buildIndustryFeatures(item.slug),
  }))
)

function buildIndustryFeatures(slug) {
  const bySlug = {
    'thoi-trang': ['Quản lý biến thể màu, size, chất liệu', 'Đổi trả, khuyến mãi và thẻ khách hàng', 'Quét mã vạch, kiểm kho nhanh', 'Theo dõi sản phẩm bán chạy, tồn chậm'],
    'dien-thoai-dien-may': ['Quản lý IMEI/serial theo từng sản phẩm', 'Theo dõi bảo hành, bảo trì', 'Kiểm kho theo chi nhánh', 'Quản lý công nợ và thanh toán'],
    'tap-hoa-sieu-thi': ['Bán hàng bằng mã vạch', 'Quản lý nhiều nhóm hàng và giá bán', 'Cảnh báo tồn thấp', 'Chốt ca và báo cáo nhanh'],
    'my-pham': ['Quản lý lô hàng và hạn dùng', 'Combo, khuyến mãi và tích điểm', 'Theo dõi khách hàng thân thiết', 'Báo cáo hàng bán chạy'],
    'vat-lieu-noi-that': ['Báo giá và đơn hàng lớn', 'Đơn vị tính linh hoạt', 'Theo dõi công nợ khách hàng', 'Quản lý tồn kho theo kho/chi nhánh'],
    'nha-thuoc': ['Danh mục sản phẩm lớn', 'Đơn vị quy đổi', 'Tìm kiếm nhanh bằng mã vạch', 'Báo cáo nhập xuất tồn'],
    'nha-hang': ['Sơ đồ bàn/phòng', 'Order tại bàn', 'In bếp/bar', 'Tách/gộp/chuyển bàn'],
    'cafe-tra-sua': ['Topping, size, combo', 'Order nhanh tại quầy', 'In tem, in bill', 'Báo cáo món bán chạy'],
    'quan-an': ['Gọi món nhanh', 'In bếp', 'Thanh toán nhiều phương thức', 'Quản lý ca bán'],
    'karaoke-bida': ['Quản lý phòng/bàn', 'Tính giờ sử dụng', 'Bán thêm dịch vụ', 'Báo cáo doanh thu theo phòng'],
    'bar-pub-club': ['Quản lý ca và nhân viên', 'Theo dõi tồn kho đồ uống', 'Thanh toán nhanh', 'Báo cáo theo khung giờ'],
    'canteen-tram-dung': ['Nhiều quầy bán', 'Bán nhanh giờ cao điểm', 'In hóa đơn', 'Tổng hợp doanh thu theo ca'],
    'spa-massage': ['Lịch hẹn và dịch vụ', 'Gói liệu trình', 'Hồ sơ khách hàng', 'Hoa hồng nhân viên'],
    'salon-nails': ['Lịch hẹn', 'Dịch vụ và combo', 'Hoa hồng kỹ thuật viên', 'Bán sản phẩm tại quầy'],
    'khach-san-nha-nghi': ['Quản lý phòng', 'Đặt lịch', 'Dịch vụ phát sinh', 'Thanh toán và báo cáo'],
    'homestay-resort': ['Đặt phòng', 'Dịch vụ đi kèm', 'Theo dõi tình trạng phòng', 'Báo cáo doanh thu lưu trú'],
    'fitness-yoga': ['Quản lý hội viên', 'Gói tập', 'Lịch lớp', 'Gia hạn và thanh toán'],
    'phong-kham': ['Hồ sơ khách hàng', 'Lịch hẹn', 'Dịch vụ khám', 'Thu phí và báo cáo'],
  }

  return bySlug[slug] ?? ['Cấu hình theo ngành', 'Quản lý bán hàng', 'Theo dõi tồn kho', 'Báo cáo vận hành']
}

export function findIndustrySolution(slug) {
  return industrySolutions.find((item) => item.slug === slug)
}
