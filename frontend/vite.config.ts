import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

// WHY: Single source of truth for version. Checks multiple paths because
// in Docker the VERSION file is copied into the build context, while
// locally it lives one directory up.
function loadVersion(): string {
  for (const p of ['VERSION', '../VERSION']) {
    const abs = resolve(__dirname, p)
    if (existsSync(abs)) return readFileSync(abs, 'utf-8').trim()
  }
  return 'dev'
}

// WHY: Proxy /api to backend to avoid CORS issues in development.
// In production, nginx handles the reverse proxy instead.
export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(loadVersion()),
  },
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
