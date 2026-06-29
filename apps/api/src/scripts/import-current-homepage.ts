import { copyFile, mkdir } from 'node:fs/promises'
import { dirname, extname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createDatabase } from '@iorder/database'
import { auditLogs, mediaAssets, pageBlocks, pageRevisions, pages } from '@iorder/database'
import { config } from 'dotenv'
import { eq, max } from 'drizzle-orm'
import { imageSize } from 'image-size'
import { readFile } from 'node:fs/promises'

import { readEnv } from '../env.js'

const here = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(here, '../../../../')
config({ path: resolve(repositoryRoot, '.env') })
const env = readEnv()
const database = createDatabase(env.DATABASE_URL)
const storageRoot = resolve(repositoryRoot, 'apps/api', env.MEDIA_STORAGE_PATH)

const assets = [
  ['hero-1', 'apps/web/src/assets/products/hero-img.png'], ['hero-2', 'apps/web/src/assets/products/hero-img2.png'], ['hero-3', 'apps/web/src/assets/products/hero-img3.jpg'],
  ['deployment-phone', 'apps/web/src/assets/products/mh-phone-iot.png'], ['deployment-computer', 'apps/web/src/assets/products/mh-mt-iot.png'], ['deployment-pos', 'apps/web/src/assets/products/mh-pos-iot.png'],
  ['ttc', 'apps/web/src/assets/partners/ttc.png'], ['shopeefood', 'apps/web/src/assets/partners/shopeefood.png'], ['grabfood', 'apps/web/src/assets/partners/grabfood.png'],
  ['taxnet', 'apps/web/src/assets/partners/taxnet.png'], ['crm-online', 'apps/web/src/assets/partners/crm_online.png'], ['huit', 'apps/web/src/assets/partners/huit.png'],
  ['tan-an-phat', 'apps/web/src/assets/partners/tan_an_phat.png'], ['cmc', 'apps/web/src/assets/partners/cmc.png'], ['etelecom', 'apps/web/src/assets/partners/etelecom.png'],
  ['lac-viet', 'apps/web/src/assets/partners/lac_viet.png'], ['base', 'apps/web/src/assets/partners/base.png'], ['incard', 'apps/web/src/assets/partners/in_card.png'],
  ['mobifone', 'apps/web/src/assets/partners/mobifone.png'], ['bni', 'apps/web/src/assets/partners/bni.png'], ['vietnix', 'apps/web/src/assets/partners/vietnix.png'], ['vietsunco', 'apps/web/src/assets/partners/vietsunco.png'],
] as const

const partnerNames = ['TTC', 'ShopeeFood', 'GrabFood', 'TaxNet', 'CRM Online', 'HUIT', 'Tân An Phát', 'CMC Telecom', 'eTelecom', 'Lạc Việt', 'Base.vn', 'InCard', 'Mobifone', 'BNI', 'Vietnix', 'Vietsunco']
const partnerAssetOffset = 6
const ids = new Map<string, string>()

try {
  for (const [key, relativeSource] of assets) {
    const source = resolve(repositoryRoot, relativeSource)
    const extension = extname(source).toLowerCase()
    const storageKey = `seed/home/${key}${extension}`
    const destination = resolve(storageRoot, storageKey)
    const buffer = await readFile(source)
    const dimensions = imageSize(buffer)
    const mimeType = extension === '.jpg' || extension === '.jpeg' ? 'image/jpeg' : 'image/png'
    await mkdir(dirname(destination), { recursive: true })
    await copyFile(source, destination)
    const [asset] = await database.db.insert(mediaAssets).values({
      storageKey,
      publicUrl: `${env.MEDIA_PUBLIC_BASE_URL.replace(/\/$/, '')}/${storageKey}`,
      originalName: relativeSource.split('/').at(-1)!, mimeType, fileSize: buffer.length,
      width: dimensions.width ?? null, height: dimensions.height ?? null, altText: key,
    }).onConflictDoUpdate({ target: mediaAssets.storageKey, set: { fileSize: buffer.length, width: dimensions.width ?? null, height: dimensions.height ?? null, updatedAt: new Date() } }).returning({ id: mediaAssets.id })
    if (!asset) throw new Error(`Could not import ${key}`)
    ids.set(key, asset.id)
  }

  const blocks = [
    { type: 'hero', isEnabled: true, data: { eyebrow: 'Tìm kiếm giải pháp quản lý bán hàng?', title: 'Phần mềm quản lý hiệu quả cho mô hình kinh doanh của bạn', description: 'Nền tảng tích hợp hệ thống POS, quản lý kho, nhân viên và báo cáo chi tiết - tối ưu cho nhà hàng, quán café, bán lẻ và chuỗi cửa hàng.', imageMediaId: ids.get('hero-1'), primaryLabel: 'Dùng thử miễn phí', primaryUrl: 'https://app.iorder.vn/register-trial', secondaryLabel: 'Xem demo', secondaryUrl: '/ho-tro/video', points: ['Triển khai nhanh', 'Hỗ trợ 24/7', 'Dễ sử dụng', 'An toàn'], slides: [
      { title: 'Hệ sinh thái bán hàng iOrder', description: 'Đồng bộ phần mềm POS, thiết bị tại quầy, điện thoại và báo cáo kinh doanh trên một nền tảng.', imageMediaId: ids.get('hero-1') },
      { title: 'Order bằng điện thoại, in bill tức thì', description: 'Phù hợp cửa hàng nhỏ, quầy lưu động và mô hình cần kết nối máy in hóa đơn nhanh qua iOrder.', imageMediaId: ids.get('hero-2') },
      { title: 'Máy POS chuyên nghiệp tại quầy', description: 'Màn hình bán hàng lớn, thao tác nhanh, hỗ trợ kết nối thiết bị và vận hành ổn định 24/7.', imageMediaId: ids.get('hero-3') },
    ] } },
    { type: 'rich_text', isEnabled: true, data: { eyebrow: 'GIỚI THIỆU', heading: 'iOrder là hệ sinh thái phần mềm, giải pháp và dịch vụ cho vận hành cửa hàng.', body: 'iOrder hỗ trợ từ bán hàng tại quầy, order tại bàn, in bếp/bar, quản lý kho, nhân viên, khách hàng đến báo cáo doanh thu. Mục tiêu là giúp chủ cửa hàng giảm ghi chép thủ công, nhìn rõ dữ liệu và chuẩn hóa quy trình khi mở rộng.', secondaryBody: 'Ngoài phần mềm, iOrder còn đồng hành ở các phần triển khai thực tế: thiết bị bán hàng, máy in, mã vạch, hạ tầng mạng, website, hosting, chữ ký số, hóa đơn điện tử và phát triển phần mềm theo yêu cầu.', chips: ['POS bán hàng', 'Order tại bàn', 'Quản lý kho', 'Báo cáo doanh thu', 'Hạ tầng & thiết bị', 'Dịch vụ CNTT'], cards: [
      { title: 'Phần mềm bán hàng', description: 'POS, order tại bàn, in hóa đơn, in bếp/bar, thanh toán và chốt ca cho bán lẻ, cafe, nhà hàng.' },
      { title: 'Quản trị vận hành', description: 'Tồn kho, nhân viên, phân quyền, khách hàng, chi nhánh và báo cáo doanh thu theo thời gian thực.' },
      { title: 'Giải pháp hạ tầng', description: 'Tư vấn mạng nội bộ, wifi, camera, máy chủ, kiểm soát ra vào và thiết bị bán hàng tại điểm bán.' },
      { title: 'Dịch vụ CNTT', description: 'Hosting, website, bảo trì IT, chữ ký số, hóa đơn điện tử và phát triển phần mềm theo yêu cầu.' },
      { title: 'Phù hợp nhiều mô hình', description: 'Nhà hàng, cafe, trà sữa, mini mart, bán lẻ, tạp hóa, dịch vụ và chuỗi nhiều chi nhánh.' },
      { title: 'Triển khai thực tế', description: 'Khảo sát nhu cầu, nhập dữ liệu, cài thiết bị, đào tạo nhân viên và hỗ trợ sau khi vận hành.' },
    ] } },
    { type: 'partner_list', isEnabled: true, data: { eyebrow: 'Được tin tưởng bởi 150+ doanh nghiệp', heading: 'Danh sách đối tác', intro: 'iOrder đồng hành cùng các đơn vị thanh toán, giao vận, hạ tầng, thiết bị và dịch vụ số để tạo nên hệ sinh thái triển khai trọn vẹn cho cửa hàng.', items: partnerNames.map((name, index) => ({ name, description: 'Đối tác iOrder', mediaId: ids.get(assets[index + partnerAssetOffset]![0]), websiteUrl: null })) } },
    { type: 'industry_grid', isEnabled: true, data: { eyebrow: 'THEO NGÀNH HÀNG', heading: 'Thiết kế phần mềm quản lý bán hàng chuyên biệt cho từng mô hình', intro: 'iOrder có thể cấu hình theo đặc thù bán lẻ, F&B, dịch vụ, lưu trú và làm đẹp để quy trình triển khai sát thực tế hơn.', groups: [
      { title: 'Bán buôn, bán lẻ', iconKey: 'store', items: [
        ['Thời trang', 'Quản lý màu, size, mã vạch, đổi trả và tồn kho.', '/nganh-hang/thoi-trang'], ['Điện thoại & điện máy', 'Theo dõi IMEI/serial, bảo hành, tồn kho và công nợ.', '/nganh-hang/dien-thoai-dien-may'], ['Tạp hóa & siêu thị', 'Quét mã nhanh, giá bán linh hoạt, kiểm kho định kỳ.', '/nganh-hang/tap-hoa-sieu-thi'], ['Mỹ phẩm', 'Quản lý lô hàng, hạn dùng, combo và khách hàng thân thiết.', '/nganh-hang/my-pham'], ['Vật liệu & nội thất', 'Báo giá, đơn vị tính, đơn hàng lớn và công nợ.', '/nganh-hang/vat-lieu-noi-that'], ['Nhà thuốc', 'Danh mục lớn, đơn vị quy đổi, tồn kho và hóa đơn.', '/nganh-hang/nha-thuoc'],
      ].map(([title, description, href]) => ({ title, description, href })) },
      { title: 'Ăn uống, giải trí', iconKey: 'utensils', items: [
        ['Nhà hàng', 'Sơ đồ bàn, gọi món, in bếp/bar và thanh toán.', '/nganh-hang/nha-hang'], ['Cafe, trà sữa', 'Order nhanh, topping, combo và báo cáo món bán chạy.', '/nganh-hang/cafe-tra-sua'], ['Quán ăn', 'Bán nhanh, in bếp, tách/gộp bàn và chốt ca.', '/nganh-hang/quan-an'], ['Karaoke, bida', 'Quản lý phòng, thời gian sử dụng và thanh toán dịch vụ.', '/nganh-hang/karaoke-bida'], ['Bar, pub & club', 'Ca bán, tồn kho đồ uống, nhân viên và doanh thu.', '/nganh-hang/bar-pub-club'], ['Canteen, trạm dừng', 'Nhiều quầy, bán nhanh, in bill và báo cáo ca.', '/nganh-hang/canteen-tram-dung'],
      ].map(([title, description, href]) => ({ title, description, href })) },
      { title: 'Dịch vụ, lưu trú, làm đẹp', iconKey: 'shield', items: [
        ['Beauty spa & massage', 'Dịch vụ, lịch hẹn, gói liệu trình và khách hàng.', '/nganh-hang/spa-massage'], ['Hair salon & nails', 'Nhân viên, hoa hồng, lịch hẹn và bán sản phẩm.', '/nganh-hang/salon-nails'], ['Khách sạn & nhà nghỉ', 'Phòng, đặt lịch, phụ thu và thanh toán.', '/nganh-hang/khach-san-nha-nghi'], ['Homestay, villa, resort', 'Đặt phòng, dịch vụ đi kèm và báo cáo doanh thu.', '/nganh-hang/homestay-resort'], ['Fitness & yoga', 'Hội viên, gói tập, lịch lớp và gia hạn.', '/nganh-hang/fitness-yoga'], ['Phòng khám', 'Hồ sơ, lịch hẹn, dịch vụ và thu phí.', '/nganh-hang/phong-kham'],
      ].map(([title, description, href]) => ({ title, description, href })) },
    ] } },
    { type: 'feature_grid', isEnabled: true, data: { eyebrow: 'TÍNH NĂNG', heading: 'Tính năng toàn diện, đơn giản nhưng mạnh mẽ', intro: null, items: [
      ['Quản lý bán hàng', 'Bán hàng nhanh, hỗ trợ nhiều hình thức thanh toán.'], ['Quản lý kho', 'Theo dõi tồn kho chi tiết, cảnh báo hàng sắp hết.'], ['Quản lý nhân viên', 'Phân quyền, chấm công và theo dõi hiệu suất.'], ['Báo cáo doanh thu', 'Biểu đồ rõ ràng, cập nhật theo thời gian thực.'], ['In hóa đơn, in bếp', 'In bill nhanh, in bếp/bar, in tem và mã vạch.'], ['Ứng dụng di động', 'Quản lý cửa hàng mọi lúc, mọi nơi trên điện thoại.'],
    ].map(([title, description]) => ({ title, description, href: null })) } },
    { type: 'deployment', isEnabled: true, data: { eyebrow: 'TRIỂN KHAI IORDER', heading: 'Từ tư vấn đến vận hành trong một quy trình rõ ràng', intro: 'iOrder không chỉ bàn giao phần mềm. Đội ngũ triển khai sẽ hỗ trợ chuẩn hóa dữ liệu, cấu hình thiết bị, đào tạo nhân viên và kiểm tra ca bán đầu tiên.', buttonLabel: 'Nhận tư vấn triển khai', buttonUrl: '/lien-he', featureMediaId: ids.get('deployment-pos'), steps: [
      { title: 'Tư vấn mô hình', description: 'Xác định bạn dùng iOrder cho bán lẻ, cafe, nhà hàng hay chuỗi nhiều chi nhánh.' },
      { title: 'Chuẩn hóa dữ liệu', description: 'Nhập danh mục sản phẩm, menu, giá bán, nhân viên và tồn kho ban đầu.' },
      { title: 'Cài đặt thiết bị', description: 'Kết nối máy in hóa đơn, in bếp/bar, máy quét mã vạch và thiết bị bán hàng.' },
      { title: 'Đào tạo vận hành', description: 'Hướng dẫn nhân viên bán hàng, gọi món, chốt ca và xem báo cáo quản lý.' },
    ], models: [
      { title: 'Mô hình 1 thiết bị', description: 'Phù hợp cửa hàng nhỏ, quầy bán lưu động hoặc quán cafe cần bán hàng nhanh bằng điện thoại.', mediaId: ids.get('deployment-phone') },
      { title: 'Mô hình máy tính + IoT', description: 'Quản lý bán hàng trên máy tính, kết nối máy in bill, tem món, máy quét mã vạch và order từ xa.', mediaId: ids.get('deployment-computer') },
      { title: 'Mô hình máy POS + IoT', description: 'Bộ vận hành chuyên nghiệp cho quầy bán hàng có POS, máy in, máy quét và dữ liệu đồng bộ iOrder.', mediaId: ids.get('deployment-pos') },
    ] } },
    { type: 'ecosystem', isEnabled: true, data: { eyebrow: 'HỆ SINH THÁI', heading: 'Phần mềm, giải pháp và dịch vụ triển khai', intro: 'Những nhóm nội dung bên dưới được đồng bộ với menu chính để khách truy cập đi từ trang chủ đến đúng danh mục cần tìm.', groups: [
      { iconKey: 'smartphone', label: 'Sản phẩm', title: 'Phần mềm', description: 'Các nền tảng iOrder phục vụ vận hành, đồng bộ dữ liệu và nghiệp vụ chuyên biệt.', href: '/phan-mem', items: [
        { title: 'Phần mềm quản lý bán hàng - iOrder', href: '/phan-mem/quan-ly-ban-hang-iorder' }, { title: 'Phần mềm quản lý trường mầm non - MimiEdu', href: '/phan-mem/quan-ly-truong-mam-non-mimiedu' }, { title: 'Phần mềm đồng bộ dữ liệu iOrder RPA', href: '/phan-mem/dong-bo-du-lieu-iorder-rpa' },
      ] },
      { iconKey: 'server', label: 'Hạ tầng', title: 'Giải pháp hạ tầng mạng', description: 'Thiết kế hệ thống mạng, máy chủ, bảo mật và thiết bị nền tảng cho vận hành ổn định.', href: '/giai-phap/ha-tang', items: [
        { title: 'Hạ tầng mạng, Wifi và Camera', href: '/giai-phap/ha-tang/mang-wifi-camera' }, { title: 'Cân bằng tải Internet, HA và bảo mật', href: '/giai-phap/ha-tang/can-bang-tai-ha-bao-mat' }, { title: 'Data center cho doanh nghiệp', href: '/giai-phap/ha-tang/data-center' },
      ] },
      { iconKey: 'headphones', label: 'Triển khai', title: 'Dịch vụ CNTT', description: 'Đội ngũ kỹ thuật hỗ trợ thi công, bảo trì, phần mềm, hóa đơn điện tử và chuyển đổi số.', href: '/giai-phap/dich-vu-cntt', items: [
        { title: 'Thi công mạng, Wifi, Camera', href: '/dich-vu/dich-vu-cntt/thi-cong-mang-wifi-camera' }, { title: 'Bảo trì và xử lý sự cố IT', href: '/dich-vu/dich-vu-cntt/bao-tri-it' }, { title: 'Tên miền, hosting, thiết kế website', href: '/dich-vu/dich-vu-cntt/hosting-website' },
      ] },
    ] } },
    { type: 'article_list', isEnabled: true, data: { eyebrow: 'TIN TỨC IORDER', heading: 'Bài viết nổi bật về vận hành cửa hàng', intro: 'Các hướng dẫn ngắn giúp chủ cửa hàng hiểu rõ hơn cách iOrder hỗ trợ bán hàng, order tại bàn, quản lý kho và báo cáo doanh thu.', postType: 'all', limit: 3, allLabel: 'Xem tất cả bài viết', allUrl: '/tin-tuc' } },
    { type: 'cta', isEnabled: true, data: { title: 'Sẵn sàng tăng cường bán hàng?', description: 'Hãy trải nghiệm miễn phí trong 14 ngày. Không cần thẻ tín dụng, hủy bất cứ lúc nào.', buttonLabel: 'Bắt đầu dùng thử', buttonUrl: 'https://app.iorder.vn/register-trial' } },
  ] as const

  let [page] = await database.db.select().from(pages).where(eq(pages.slug, 'home')).limit(1)
  if (!page) [page] = await database.db.insert(pages).values({ title: 'Trang chủ', slug: 'home', template: 'home', status: 'published', seoTitle: 'iOrder - Trang chủ', seoDescription: 'iOrder hỗ trợ POS bán hàng, order tại bàn, quản lý kho, nhân viên và báo cáo doanh thu.', canonicalUrl: 'https://iorder.vn/', publishedAt: new Date() }).returning()
  else [page] = await database.db.update(pages).set({ status: 'published', publishedAt: new Date(), updatedAt: new Date() }).where(eq(pages.id, page.id)).returning()
  if (!page) throw new Error('Homepage record unavailable')
  await database.db.delete(pageBlocks).where(eq(pageBlocks.pageId, page.id))
  await database.db.insert(pageBlocks).values(blocks.map((block, index) => ({ pageId: page.id, type: block.type, sortOrder: index, isEnabled: block.isEnabled, data: block.data })))
  const [version] = await database.db.select({ value: max(pageRevisions.versionNumber) }).from(pageRevisions).where(eq(pageRevisions.pageId, page.id))
  const snapshot = { id: page.id, title: page.title, seoTitle: page.seoTitle, seoDescription: page.seoDescription, canonicalUrl: page.canonicalUrl, status: 'published', publishedAt: page.publishedAt?.toISOString() ?? null, updatedAt: page.updatedAt.toISOString(), blocks }
  await database.db.insert(pageRevisions).values({ pageId: page.id, versionNumber: (version?.value ?? 0) + 1, contentSnapshot: snapshot, changeNote: 'Imported current homepage', isPublished: true })
  await database.db.insert(auditLogs).values({ action: 'homepage.import', entityType: 'page', entityId: page.id, afterData: snapshot })
  process.stdout.write(`Imported homepage with ${blocks.length} blocks and ${assets.length} media assets.\n`)
} finally { await database.close() }
