import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // API functions run locally via dev-api.mjs (started by `npm run dev`)
    proxy: { '/api': 'http://localhost:5001' },
  },
})
