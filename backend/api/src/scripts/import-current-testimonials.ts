import { createDatabase, testimonials } from '@iorder/database'
import { config } from 'dotenv'
import { eq } from 'drizzle-orm'
import { resolve } from 'node:path'

import { readEnv } from '../env.js'

config({ path: resolve(import.meta.dirname, '../../../../.env') })

const env = readEnv()
const database = createDatabase(env.DATABASE_URL)

const testimonialSeeds = [
  {
    authorName: 'Anh Minh',
    authorRole: 'Chuỗi 3 quán cafe tại TP.HCM',
    company: null,
    quote:
      'iOrder giúp tôi theo dõi doanh thu từng ca, từng nhân viên mà không cần ngồi đối chiếu sổ sách. Mỗi tháng tiết kiệm được gần chục giờ đồng hồ.',
    rating: 5,
    sortOrder: 0,
  },
  {
    authorName: 'Chị Hà',
    authorRole: 'Quản lý chuỗi trà sữa 5 chi nhánh',
    company: null,
    quote:
      'Trước đây kho hay bị thất thoát mà không biết lý do. Từ khi dùng iOrder, mỗi lần xuất kho đều có ghi nhận, cuối tháng so khớp rất nhanh.',
    rating: 5,
    sortOrder: 1,
  },
  {
    authorName: 'Anh Tuấn',
    authorRole: 'Chủ cửa hàng bán lẻ tại Hà Nội',
    company: null,
    quote:
      'Nhân viên mới chỉ cần học 30 phút là dùng được. Triển khai xong trong 1 ngày, hôm sau mở cửa bán hàng bình thường.',
    rating: 5,
    sortOrder: 2,
  },
] as const

try {
  let created = 0
  let skipped = 0

  for (const seed of testimonialSeeds) {
    const [existing] = await database.db
      .select({ id: testimonials.id })
      .from(testimonials)
      .where(eq(testimonials.authorName, seed.authorName))
      .limit(1)

    if (existing) {
      skipped += 1
      continue
    }

    await database.db.insert(testimonials).values({
      ...seed,
      avatarMediaId: null,
      isEnabled: true,
    })
    created += 1
  }

  process.stdout.write(`Imported testimonials: ${created} created, ${skipped} skipped.\n`)
} finally {
  await database.close()
}
