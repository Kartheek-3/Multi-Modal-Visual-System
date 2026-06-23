import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/search': 'http://localhost:8000',
      '/upload': 'http://localhost:8000',
      '/auth': 'http://localhost:8000',
      '/ai': 'http://localhost:8000',
      '/recommend': 'http://localhost:8000',
      '/images': 'http://localhost:8000',
      '/analytics': 'http://localhost:8000',
      '/history': 'http://localhost:8000',
      '/favorites': 'http://localhost:8000',
      '/click': 'http://localhost:8000',
      '/static': 'http://localhost:8000',
      '/health': 'http://localhost:8000',
    },
  },
})
