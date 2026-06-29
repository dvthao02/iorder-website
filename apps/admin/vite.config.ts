import { sentryVitePlugin } from '@sentry/vite-plugin'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const shouldUploadSourcemaps = Boolean(process.env.SENTRY_AUTH_TOKEN && process.env.SENTRY_ORG && process.env.SENTRY_PROJECT)
const sentryPlugins = shouldUploadSourcemaps
  ? [sentryVitePlugin({
      org: process.env.SENTRY_ORG!,
      project: process.env.SENTRY_PROJECT!,
      authToken: process.env.SENTRY_AUTH_TOKEN!,
      telemetry: false,
      ...(process.env.SENTRY_RELEASE ? { release: { name: process.env.SENTRY_RELEASE } } : {}),
    })]
  : []

export default defineConfig({
  plugins: [react(), ...sentryPlugins],
  build: {
    sourcemap: shouldUploadSourcemaps,
  },
  // Dấu '/' cuối là bắt buộc để Vite dev prefix đúng /admin/ cho các module
  // (vd /admin/src/main.tsx) — cần thiết khi chạy sau proxy tại 5173/admin.
  base: '/admin/',
})
