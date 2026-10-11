import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import securityHeaders from './security-headers.js'

export default defineConfig({
  plugins: [react(), tailwindcss(), securityHeaders()],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
  // Production build only (the dev server is unaffected): no source maps, and nothing in file names or code that
  // spells out the source structure. This hides structure, not secrets: everything shipped to the browser is public.
  build: {
    sourcemap: false,
    rolldownOptions: {
      output: {
        // Hash-only names: "assets/Settings-9jdYi99r.js" told anyone which features exist. Hashes keep caching right.
        entryFileNames: 'assets/[hash].js',
        chunkFileNames: 'assets/[hash].js',
        assetFileNames: 'assets/[hash][extname]',
        // Oxc minifier (Rolldown 1.0): also drop console.* calls and debugger statements
        minify: { compress: { dropConsole: true, dropDebugger: true } },
      },
    },
  },
})
