import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// BASE_PATH diisi otomatis oleh GitHub Actions (mis. /rubik-pintar/) untuk GitHub Pages
export default defineConfig({
  base: process.env.BASE_PATH || '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Rubik Pintar',
        short_name: 'Rubik Pintar',
        description: 'Scan rubikmu, lalu ikuti animasi langkah demi langkah sampai beres. 2x2 sampai 5x5.',
        lang: 'id',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#f2f6ff',
        theme_color: '#f2f6ff',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
    }),
  ],
  worker: { format: 'es' },
  build: { chunkSizeWarningLimit: 1200 },
});
