import { resolve } from 'node:path'
import { config } from 'dotenv'
import { eq } from 'drizzle-orm'

import { createDatabase } from './client.js'
import { contentPages } from './schema/index.js'

config({ path: resolve(import.meta.dirname, '../../../.env') })

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to seed content pages')
}

const FAQ_BODY = `
<h3>iOrder có dùng thử miễn phí không?</h3>
<p>Có. iOrder cung cấp 14 ngày dùng thử đầy đủ tính năng, không cần thẻ tín dụng và không ràng buộc hợp đồng. Bạn có thể đăng ký trực tiếp trên website hoặc liên hệ đội ngũ tư vấn để được hỗ trợ khởi tạo tài khoản trong ngày.</p>

<h3>Tôi cần chuẩn bị gì để nhập dữ liệu ban đầu (menu, sản phẩm, giá)?</h3>
<p>Bạn chỉ cần cung cấp danh sách sản phẩm/món, đơn giá và nhóm hàng theo mẫu Excel do iOrder cung cấp. Đội ngũ triển khai sẽ hỗ trợ nhập liệu, cấu hình danh mục và kiểm tra lại toàn bộ dữ liệu trước khi cửa hàng vận hành chính thức.</p>

<h3>iOrder có quản lý được nhiều chi nhánh cùng lúc không?</h3>
<p>Có. Với gói Chuyên nghiệp và Doanh nghiệp, bạn có thể quản lý nhiều chi nhánh trên cùng một tài khoản, xem báo cáo tổng hợp hoặc tách riêng theo từng điểm bán. Menu, giá bán và khuyến mãi có thể đồng bộ tập trung hoặc tùy chỉnh riêng cho từng chi nhánh.</p>

<h3>Nếu cửa hàng mất mạng hoặc mất Internet thì có bán hàng được không?</h3>
<p>Được. iOrder hỗ trợ chế độ bán hàng offline — hệ thống vẫn ghi nhận đơn hàng, in hóa đơn và trừ tồn kho bình thường khi mất kết nối Internet. Toàn bộ dữ liệu sẽ tự động đồng bộ lại với máy chủ ngay khi mạng được khôi phục, không lo thất thoát hoặc trùng lặp đơn.</p>

<h3>iOrder có hỗ trợ in phiếu bếp và kết nối máy in bếp không?</h3>
<p>Có. iOrder hỗ trợ kết nối nhiều máy in bếp/bar cùng lúc theo khu vực chế biến (bếp chính, bar, khu nướng...). Khi nhân viên gọi món, phiếu bếp sẽ tự động in ngay tại đúng khu vực phụ trách, giúp rút ngắn thời gian phục vụ và hạn chế sai sót giữa các bộ phận.</p>

<h3>iOrder có phân quyền cho từng nhân viên không?</h3>
<p>Có. Bạn có thể phân quyền chi tiết theo vai trò như thu ngân, phục vụ, quản lý ca hoặc quản trị viên — mỗi vai trò chỉ được thao tác đúng phạm vi được cấp phép. Mọi thay đổi quan trọng đều được ghi nhận lịch sử, giúp chủ cửa hàng dễ dàng kiểm soát và truy vết khi cần.</p>
`.trim()

const VIDEO_BODY = '<p>Nội dung đang được cập nhật.</p>'

async function upsertIfMissing(
  db: ReturnType<typeof createDatabase>['db'],
  input: {
    slug: string
    title: string
    lead: string | null
    body: string
    status: 'draft' | 'published'
  },
) {
  const rows = await db
    .select({ id: contentPages.id })
    .from(contentPages)
    .where(eq(contentPages.slug, input.slug))
    .limit(1)
  if (rows[0]) {
    console.log(`[seed-content-pages] slug "${input.slug}" already exists — skipping`)
    return
  }

  await db.insert(contentPages).values({
    slug: input.slug,
    title: input.title,
    lead: input.lead,
    body: input.body,
    status: input.status,
    publishedAt: input.status === 'published' ? new Date() : null,
  })
  console.log(`[seed-content-pages] inserted slug "${input.slug}"`)
}

async function main() {
  const database = createDatabase(databaseUrl!)
  try {
    await upsertIfMissing(database.db, {
      slug: 'ho-tro/faq',
      title: 'Câu hỏi thường gặp',
      lead: 'Tổng hợp các câu hỏi phổ biến khi bắt đầu sử dụng iOrder.',
      body: FAQ_BODY,
      status: 'published',
    })

    await upsertIfMissing(database.db, {
      slug: 'ho-tro/video',
      title: 'Video hướng dẫn',
      lead: 'Khu vực tổng hợp video hướng dẫn thao tác bán hàng, quản lý kho, báo cáo và cấu hình thiết bị.',
      body: VIDEO_BODY,
      status: 'draft',
    })
  } finally {
    await database.close()
  }
}

await main()
