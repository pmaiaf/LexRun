import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Proxy opcional: se VITE_API_URL não for definido, encaminha para a API local
      '/api': {
        target: 'http://localhost:3333',
        changeOrigin: true,
      }
    }
  }
})
