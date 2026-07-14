import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import type { ProxyOptions } from 'vite'

const proxyTarget = 'http://localhost:3000'

const proxyBypass: ProxyOptions['bypass'] = (req) => {
  if (req.headers.accept?.includes('text/html')) {
    return '/index.html'
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/admin': {
        target: proxyTarget,
        changeOrigin: true,
        bypass: proxyBypass,
      },
      '/api': {
        target: proxyTarget,
        changeOrigin: true,
        bypass: proxyBypass,
      },
      '/partner': {
        target: proxyTarget,
        changeOrigin: true,
        bypass: proxyBypass,
      },
      '/employee': {
        target: proxyTarget,
        changeOrigin: true,
        bypass: proxyBypass,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
})
