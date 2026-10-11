import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'version-built-assets',
      transformIndexHtml: {
        order: 'post',
        handler(html) {
          const buildId = Date.now().toString(36)
          return html.replace(/(\/assets\/[^"?]+)(?=")/g, `$1?v=${buildId}`)
        },
      },
    },
  ],
  server: { proxy: { '/api': 'http://localhost:5000' } }
})
