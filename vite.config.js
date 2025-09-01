import { defineConfig } from 'vite';
import legacy from '@vitejs/plugin-legacy';
import { VitePWA } from 'vite-plugin-pwa';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    legacy({
      targets: ['defaults', 'not IE 11']
    }),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Mahart Linked Notes',
        short_name: 'LinkedNotes',
        description: 'Advanced client-side knowledge management platform',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['localforage', 'marked', 'dompurify'],
          charts: ['chart.js'],
          graph: ['d3'],
          monaco: ['monaco-editor']
        }
      }
    },
    sourcemap: true,
    minify: 'terser'
  },
  worker: {
    format: 'es'
  },
  optimizeDeps: {
    include: ['localforage', 'marked', 'dompurify']
  },
  server: {
    port: 8000,
    host: true,
    open: true
  }
});
