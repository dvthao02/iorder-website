import { resolve } from 'node:path'
import { config } from 'dotenv'
import { and, eq } from 'drizzle-orm'

import { createDatabase } from './client.js'
import { offerings } from './schema/index.js'

config({ path: resolve(import.meta.dirname, '../../../.env') })

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to seed industries')
}

// Nguồn: frontend/web/src/data/industrySolutions.js — đổ vào CMS để admin quản lý.
// Sau khi seed + kiểm tra parity, file tĩnh chỉ còn là fallback chờ xóa.
const BENEFITS = [
  'Thao tác bán hàng nhanh, dễ đào tạo nhân viên mới',
  'Dữ liệu sản phẩm, đơn hàng, tồn kho và doanh thu tập trung',
  'Báo cáo rõ theo ngày, ca, nhân viên và chi nhánh',
  'Hỗ trợ thiết bị bán hàng, máy in, mã vạch và quy trình triển khai thực tế',
]

type SeedIndustry = {
  slug: string
  title: string
  desc: string
  group: string
  features: string[]
}

const INDUSTRIES: SeedIndustry[] = [
  // ── Bán buôn, bán lẻ ──
  {
    slug: 'thoi-trang',
    title: 'Thời trang',
    desc: 'Quản lý màu, size, mã vạch, đổi trả và tồn kho.',
    group: 'Bán buôn, bán lẻ',
    features: [
      'Quản lý biến thể màu, size, chất liệu',
      'Đổi trả, khuyến mãi và thẻ khách hàng',
      'Quét mã vạch, kiểm kho nhanh',
      'Theo dõi sản phẩm bán chạy, tồn chậm',
    ],
  },
  {
    slug: 'dien-thoai-dien-may',
    title: 'Điện thoại & điện máy',
    desc: 'Theo dõi IMEI/serial, bảo hành, tồn kho và công nợ.',
    group: 'Bán buôn, bán lẻ',
    features: [
      'Quản lý IMEI/serial theo từng sản phẩm',
      'Theo dõi bảo hành, bảo trì',
      'Kiểm kho theo chi nhánh',
      'Quản lý công nợ và thanh toán',
    ],
  },
  {
    slug: 'tap-hoa-sieu-thi',
    title: 'Tạp hóa & siêu thị',
    desc: 'Quét mã nhanh, giá bán linh hoạt, kiểm kho định kỳ.',
    group: 'Bán buôn, bán lẻ',
    features: [
      'Bán hàng bằng mã vạch',
      'Quản lý nhiều nhóm hàng và giá bán',
      'Cảnh báo tồn thấp',
      'Chốt ca và báo cáo nhanh',
    ],
  },
  {
    slug: 'my-pham',
    title: 'Mỹ phẩm',
    desc: 'Quản lý lô hàng, hạn dùng, combo và khách hàng thân thiết.',
    group: 'Bán buôn, bán lẻ',
    features: [
      'Quản lý lô hàng và hạn dùng',
      'Combo, khuyến mãi và tích điểm',
      'Theo dõi khách hàng thân thiết',
      'Báo cáo hàng bán chạy',
    ],
  },
  {
    slug: 'vat-lieu-noi-that',
    title: 'Vật liệu & nội thất',
    desc: 'Báo giá, đơn vị tính, đơn hàng lớn và công nợ.',
    group: 'Bán buôn, bán lẻ',
    features: [
      'Báo giá và đơn hàng lớn',
      'Đơn vị tính linh hoạt',
      'Theo dõi công nợ khách hàng',
      'Quản lý tồn kho theo kho/chi nhánh',
    ],
  },
  {
    slug: 'nha-thuoc',
    title: 'Nhà thuốc',
    desc: 'Danh mục lớn, đơn vị quy đổi, tồn kho và hóa đơn.',
    group: 'Bán buôn, bán lẻ',
    features: ['Danh mục sản phẩm lớn', 'Đơn vị quy đổi', 'Tìm kiếm nhanh bằng mã vạch', 'Báo cáo nhập xuất tồn'],
  },
  // ── Ăn uống, giải trí ──
  {
    slug: 'nha-hang',
    title: 'Nhà hàng',
    desc: 'Sơ đồ bàn, gọi món, in bếp/bar và thanh toán.',
    group: 'Ăn uống, giải trí',
    features: ['Sơ đồ bàn/phòng', 'Order tại bàn', 'In bếp/bar', 'Tách/gộp/chuyển bàn'],
  },
  {
    slug: 'cafe-tra-sua',
    title: 'Cafe, trà sữa',
    desc: 'Order nhanh, topping, combo và báo cáo món bán chạy.',
    group: 'Ăn uống, giải trí',
    features: ['Topping, size, combo', 'Order nhanh tại quầy', 'In tem, in bill', 'Báo cáo món bán chạy'],
  },
  {
    slug: 'quan-an',
    title: 'Quán ăn',
    desc: 'Bán nhanh, in bếp, tách/gộp bàn và chốt ca.',
    group: 'Ăn uống, giải trí',
    features: ['Gọi món nhanh', 'In bếp', 'Thanh toán nhiều phương thức', 'Quản lý ca bán'],
  },
  {
    slug: 'karaoke-bida',
    title: 'Karaoke, bida',
    desc: 'Quản lý phòng, thời gian sử dụng và thanh toán dịch vụ.',
    group: 'Ăn uống, giải trí',
    features: ['Quản lý phòng/bàn', 'Tính giờ sử dụng', 'Bán thêm dịch vụ', 'Báo cáo doanh thu theo phòng'],
  },
  {
    slug: 'bar-pub-club',
    title: 'Bar, pub & club',
    desc: 'Ca bán, tồn kho đồ uống, nhân viên và doanh thu.',
    group: 'Ăn uống, giải trí',
    features: ['Quản lý ca và nhân viên', 'Theo dõi tồn kho đồ uống', 'Thanh toán nhanh', 'Báo cáo theo khung giờ'],
  },
  {
    slug: 'canteen-tram-dung',
    title: 'Canteen, trạm dừng',
    desc: 'Nhiều quầy, bán nhanh, in bill và báo cáo ca.',
    group: 'Ăn uống, giải trí',
    features: ['Nhiều quầy bán', 'Bán nhanh giờ cao điểm', 'In hóa đơn', 'Tổng hợp doanh thu theo ca'],
  },
  // ── Dịch vụ, lưu trú, làm đẹp ──
  {
    slug: 'spa-massage',
    title: 'Beauty spa & massage',
    desc: 'Dịch vụ, lịch hẹn, gói liệu trình và khách hàng.',
    group: 'Dịch vụ, lưu trú, làm đẹp',
    features: ['Lịch hẹn và dịch vụ', 'Gói liệu trình', 'Hồ sơ khách hàng', 'Hoa hồng nhân viên'],
  },
  {
    slug: 'salon-nails',
    title: 'Hair salon & nails',
    desc: 'Nhân viên, hoa hồng, lịch hẹn và bán sản phẩm.',
    group: 'Dịch vụ, lưu trú, làm đẹp',
    features: ['Lịch hẹn', 'Dịch vụ và combo', 'Hoa hồng kỹ thuật viên', 'Bán sản phẩm tại quầy'],
  },
  {
    slug: 'khach-san-nha-nghi',
    title: 'Khách sạn & nhà nghỉ',
    desc: 'Phòng, đặt lịch, phụ thu và thanh toán.',
    group: 'Dịch vụ, lưu trú, làm đẹp',
    features: ['Quản lý phòng', 'Đặt lịch', 'Dịch vụ phát sinh', 'Thanh toán và báo cáo'],
  },
  {
    slug: 'homestay-resort',
    title: 'Homestay, villa, resort',
    desc: 'Đặt phòng, dịch vụ đi kèm và báo cáo doanh thu.',
    group: 'Dịch vụ, lưu trú, làm đẹp',
    features: ['Đặt phòng', 'Dịch vụ đi kèm', 'Theo dõi tình trạng phòng', 'Báo cáo doanh thu lưu trú'],
  },
  {
    slug: 'fitness-yoga',
    title: 'Fitness & yoga',
    desc: 'Hội viên, gói tập, lịch lớp và gia hạn.',
    group: 'Dịch vụ, lưu trú, làm đẹp',
    features: ['Quản lý hội viên', 'Gói tập', 'Lịch lớp', 'Gia hạn và thanh toán'],
  },
  {
    slug: 'phong-kham',
    title: 'Phòng khám',
    desc: 'Hồ sơ, lịch hẹn, dịch vụ và thu phí.',
    group: 'Dịch vụ, lưu trú, làm đẹp',
    features: ['Hồ sơ khách hàng', 'Lịch hẹn', 'Dịch vụ khám', 'Thu phí và báo cáo'],
  },
]

async function main() {
  const database = createDatabase(databaseUrl!)
  const { db } = database
  let inserted = 0
  let skipped = 0

  try {
    for (const [index, item] of INDUSTRIES.entries()) {
      const [existing] = await db
        .select({ id: offerings.id })
        .from(offerings)
        .where(and(eq(offerings.type, 'industry'), eq(offerings.slug, item.slug)))
        .limit(1)

      if (existing) {
        skipped += 1
        continue
      }

      const lead = `iOrder được cấu hình theo đặc thù ngành ${item.title.toLowerCase()}, giúp quản lý bán hàng, tồn kho, nhân viên, khách hàng và báo cáo trên cùng một nền tảng.`

      await db.insert(offerings).values({
        type: 'industry',
        title: item.title,
        slug: item.slug,
        summary: item.desc,
        contentJson: {
          description: lead,
          category: item.group,
          features: item.features,
          benefits: BENEFITS,
          tags: [],
          metrics: [],
          faq: [],
          items: [],
        },
        status: 'published',
        publishedAt: new Date(),
        sortOrder: index,
        seoTitle: `Phần mềm quản lý ${item.title.toLowerCase()}`.slice(0, 70),
        seoDescription: item.desc.slice(0, 180),
      })
      inserted += 1
    }

    console.log(`Seed industries: inserted=${inserted}, skipped(existing)=${skipped}`)
  } finally {
    await database.close()
  }
}

await main()
