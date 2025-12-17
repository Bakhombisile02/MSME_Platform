import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import svgr from 'vite-plugin-svgr'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), svgr()],
  // Base path for production deployment under /admin
  base: process.env.NODE_ENV === 'production' ? '/admin/' : '/',
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
