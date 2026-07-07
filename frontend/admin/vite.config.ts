import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  // Dấu '/' cuối là bắt buộc để Vite dev prefix đúng /admin/ cho các module
  // (vd /admin/src/main.tsx) — cần thiết khi chạy sau proxy tại 5173/admin.
  base: '/admin/',
  server: {
    host: '0.0.0.0',
    port: 5174,
  },
})
