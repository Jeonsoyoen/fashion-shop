
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/gold-api': {
        target: 'https://api.gold-api.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/gold-api/, ''),
      },
      '/fx-api': {
        target: 'https://api.frankfurter.app',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/fx-api/, ''),
      },
    },
  },
})
