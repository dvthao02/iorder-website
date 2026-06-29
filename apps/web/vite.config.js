import { sentryVitePlugin } from '@sentry/vite-plugin'
import { defineConfig } from 'vite'

const shouldUploadSourcemaps = Boolean(process.env.SENTRY_AUTH_TOKEN && process.env.SENTRY_ORG && process.env.SENTRY_PROJECT)
const sentryPlugins = shouldUploadSourcemaps
  ? [sentryVitePlugin({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      telemetry: false,
      ...(process.env.SENTRY_RELEASE ? { release: { name: process.env.SENTRY_RELEASE } } : {}),
    })]
  : []

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
  plugins: [adminTrailingSlash, ...sentryPlugins],
  build: {
    sourcemap: shouldUploadSourcemaps,
  },
  server: {
    host: '0.0.0.0',
    proxy: {
      // xfwd: chuyển tiếp X-Forwarded-For để API lấy IP thật (đếm lượt xem chính xác khi bật TRUST_PROXY).
      '/api': { target: 'http://127.0.0.1:4000', xfwd: true },
      '/media': { target: 'http://127.0.0.1:4000', xfwd: true },
      '/sitemap.xml': 'http://127.0.0.1:4000',
      '/robots.txt': 'http://127.0.0.1:4000',
      '/admin': {
        target: 'http://127.0.0.1:5174',
        changeOrigin: true,
        ws: true,
      },
    },
  },
})
