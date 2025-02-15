import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // is this only for dev server?
  // https://vitejs.dev/config/#server-options
  server: {
    host: '0.0.0.0',
    port: 7010,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        // rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
