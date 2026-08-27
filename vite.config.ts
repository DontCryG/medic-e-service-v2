import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  build: {
    sourcemap: false,
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) return 'vendor-react';
            if (id.includes('@supabase')) return 'vendor-supabase';
            if (id.includes('lucide') || id.includes('framer-motion') || id.includes('sweetalert2') || id.includes('react-hot-toast')) return 'vendor-ui';
            if (id.includes('date-fns') || id.includes('zod') || id.includes('react-hook-form') || id.includes('zustand') || id.includes('@tanstack')) return 'vendor-utils';
            return 'vendor-core';
          }
        }
      }
    }
  },
})