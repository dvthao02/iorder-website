import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  // CMS có hostname riêng, nên assets luôn được nạp từ gốc của cms.iorder.com.vn.
  base: '/',
  server: {
    host: '0.0.0.0',
    port: 5174,
  },
})
