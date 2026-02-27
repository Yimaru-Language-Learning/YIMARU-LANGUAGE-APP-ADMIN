import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'child_process'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __BUILD_HASH__: JSON.stringify(
      (() => {
        try {
          return execSync('git rev-parse --short HEAD').toString().trim()
        } catch {
          return 'unknown'
        }
      })()
    ),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
})

