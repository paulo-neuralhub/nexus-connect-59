import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('three') || id.includes('globe.gl') || id.includes('react-globe.gl')) {
            return 'three'
          }
          if (id.includes('gsap')) {
            return 'gsap'
          }
          if (id.includes('lucide-react')) {
            return 'ui'
          }
        }
      }
    },
    sourcemap: false,
  }
})
