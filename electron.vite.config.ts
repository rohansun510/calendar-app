import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    build: {
      rollupOptions: {
        external: ['electron', 'sql.js', 'node-cron', 'uuid', 'fs', 'path'],
      },
    },
  },
  preload: {
    build: {
      rollupOptions: {
        external: ['electron'],
      },
    },
  },
  renderer: {
    resolve: {
      alias: {
        '@': resolve('src/renderer'),
      },
    },
    plugins: [react()],
    css: {
      postcss: './postcss.config.js',
    },
  },
})
