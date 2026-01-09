import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import svgr from 'vite-plugin-svgr'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), svgr()],
  // Base path - use root for Firebase Hosting (standalone site), /admin/ for traditional deployment
  base: process.env.VITE_BASE_PATH || '/',
  server: {
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      '72.60.36.42',
      'ceec-msme.com',
      '.ceec-msme.com'
    ]
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
})
