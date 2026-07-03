import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Installable-PWA build. This is what makes OpenPDF installable across platforms:
// desktop/Android/iOS home-screen, and — crucially — the Meta Quest Browser, which
// runs WebXR on top of an OpenXR runtime. Capacitor (see capacitor.config.ts) reuses
// this same `dist/` output to produce native iOS / Android / Google TV shells.
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'OpenPDF',
        short_name: 'OpenPDF',
        description: 'An immersive PDF reading experience.',
        theme_color: '#0d0c0a',
        background_color: '#0d0c0a',
        display: 'standalone',
        orientation: 'any',
        categories: ['productivity', 'books', 'utilities'],
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
