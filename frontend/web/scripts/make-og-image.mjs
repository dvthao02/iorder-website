// Tạo ảnh chia sẻ mạng xã hội (Open Graph) 1200x630 cho iOrder.
// Chạy lại khi đổi logo/tagline: `pnpm add -D -w sharp && pnpm make-og-image && pnpm remove -w sharp`
// (sharp chỉ cần khi tạo ảnh, gỡ sau để không phá build Railway — binary theo nền tảng.)
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const logoPath = resolve(root, 'src/assets/header/logo.png')
const outPath = resolve(root, 'public/og-image.png')

const W = 1200,
  H = 630
// Khung trắng giữa chứa logo
const cardW = 560,
  cardH = 230
const cardX = (W - cardW) / 2,
  cardY = 150

const bg = Buffer.from(`
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1588e3"/>
      <stop offset="100%" stop-color="#12b9a7"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
  <rect x="${cardX}" y="${cardY}" width="${cardW}" height="${cardH}" rx="28" fill="#ffffff"/>
  <text x="${W / 2}" y="470" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-size="40" font-weight="800">Phần mềm quản lý bán hàng toàn diện</text>
  <text x="${W / 2}" y="528" text-anchor="middle" fill="#e7f6ff" font-family="Arial, sans-serif" font-size="26">POS · Kho · Nhân viên · Báo cáo · Đa chi nhánh</text>
</svg>`)

const logoW = 400
const logo = await sharp(logoPath).resize({ width: logoW }).toBuffer()
const logoMeta = await sharp(logo).metadata()
const logoTop = Math.round(cardY + (cardH - logoMeta.height) / 2)
const logoLeft = Math.round((W - logoW) / 2)

await sharp(bg)
  .composite([{ input: logo, top: logoTop, left: logoLeft }])
  .png()
  .toFile(outPath)

console.log(`OG image tạo xong: public/og-image.png (${W}x${H})`)
