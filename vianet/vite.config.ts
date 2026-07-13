import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        admin: resolve(__dirname, 'admin.html'),
        employ: resolve(__dirname, 'employ.html'),
        app: resolve(__dirname, 'app.html'),
      },
    },
  },
})
