import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// WHY: Proxy /api to backend to avoid CORS issues in development.
// In production, nginx handles the reverse proxy instead.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
