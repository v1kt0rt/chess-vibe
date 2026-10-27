import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Build timestamp in UTC, e.g. "2026-10-27 21:30 UTC"
const buildTime = new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  define: {
    __BUILD_TIME__: JSON.stringify(buildTime),
  },
})
