import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // cho phép truy cập qua network hoặc domain
    allowedHosts: ['.ngrok-free.app'], // cho phép tất cả domain ngrok
  }
})
