import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [uni()],
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      buffer: 'buffer',
      stream: 'stream-browserify',
      events: 'events',
      util: 'util',
      url: 'url'
    }
  },
  optimizeDeps: {
    include: ['buffer', 'events', 'util', 'url', 'stream-browserify', 'mqtt']
  }
})