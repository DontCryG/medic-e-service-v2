import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  build: {
    sourcemap: false, // ปิดการสร้าง Source Map เพื่อป้องกันการถูกแกะ Source Code
    cssCodeSplit: false, // บังคับรวม CSS ทั้งหมดเป็นไฟล์เดียว ป้องกัน UI พังเวลาทำ Lazy Load
  },
})
