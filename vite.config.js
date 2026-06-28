import { defineConfig } from 'vite'

// Tự redirect /admin → /admin/ (Vite admin base là '/admin/', thiếu '/' cuối sẽ báo lỗi).
// Middleware thêm trực tiếp trong configureServer chạy TRƯỚC proxy.
const adminTrailingSlash = {
  name: 'admin-trailing-slash',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (req.url === '/admin') {
        res.statusCode = 301
        res.setHeader('Location', '/admin/')
        res.end()
        return
      }
      next()
    })
  },
}

// Dev: gom site chính + CMS + API về chung origin 127.0.0.1:5173 (giống production).
//  - 127.0.0.1:5173/          → site chính (vite dev server này)
//  - 127.0.0.1:5173/admin/... → CMS (proxy sang vite dev server của admin, cổng 5174)
//  - 127.0.0.1:5173/api,/media→ API Fastify (cổng 4000)
// Chỉ ảnh hưởng `vite dev`, không đổi hành vi `vite build`.
export default defineConfig({
  plugins: [adminTrailingSlash],
  server: {
    host: '0.0.0.0',
    proxy: {
      // xfwd: chuyển tiếp X-Forwarded-For để API lấy IP thật (đếm lượt xem chính xác khi bật TRUST_PROXY).
      '/api': { target: 'http://127.0.0.1:4000', xfwd: true },
      '/media': { target: 'http://127.0.0.1:4000', xfwd: true },
      '/admin': {
        target: 'http://127.0.0.1:5174',
        changeOrigin: true,
        ws: true,
      },
    },
  },
})
