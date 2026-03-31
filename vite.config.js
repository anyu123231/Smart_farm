import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import path from 'path'

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
      url: 'url',
      mqtt: path.resolve(__dirname, 'node_modules/mqtt/dist/mqtt.js')
    }
  },
  optimizeDeps: {
    include: ['buffer', 'events', 'util', 'url', 'stream-browserify']
  }
})
