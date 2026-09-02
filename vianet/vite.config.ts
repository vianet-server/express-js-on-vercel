import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import type { ProxyOptions } from 'vite'

const proxyTarget = 'http://localhost:3000'

const proxyBypass: ProxyOptions['bypass'] = (req) => {
  // FIX 1: Prevent static assets (like .js and .css) from being proxied to the backend.
  // If the proxy sends a .js request to your backend, and your backend doesn't find it, 
  // it might return a 404 HTML page, causing the exact MIME type error you are seeing.
  if (req.url && req.url.match(/\.(js|css|svg|png|jpg|jpeg|gif|ico|woff|woff2)$/)) {
    return req.url; // Returns the asset locally instead of proxying
  }

  if (req.headers.accept?.includes('text/html')) {
    return '/index.html'
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  
  // FIX 2: Set the base path explicitly. 
  // If you are deploying to a subfolder or shared hosting (like cPanel), change this to './'
  base: '/', 

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

  // FIX 3: If you are using `npm run preview` to test your production build, 
  // Vite ignores the `server` block. You MUST copy your proxies to a `preview` block.
  preview: {
    proxy: {
      '/admin': { target: proxyTarget, changeOrigin: true, bypass: proxyBypass },
      '/api': { target: proxyTarget, changeOrigin: true, bypass: proxyBypass },
      '/partner': { target: proxyTarget, changeOrigin: true, bypass: proxyBypass },
      '/employee': { target: proxyTarget, changeOrigin: true, bypass: proxyBypass },
    }
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
})