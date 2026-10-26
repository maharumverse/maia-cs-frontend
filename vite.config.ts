import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import { parseConfig } from './src/config.ts'
import { APP_DESCRIPTION, APP_NAME, BACKGROUND_COLOR, THEME_COLOR } from './src/constants.ts'

// Menaruh nama dan deskripsi dari src/constants.ts ke index.html, supaya nama aplikasi
// hanya ditulis di satu tempat dan tidak dibaca dari env.
function htmlConstants(): Plugin {
  const values: Record<string, string> = {
    APP_NAME,
    APP_DESCRIPTION,
    THEME_COLOR,
  }
  return {
    name: 'html-constants',
    transformIndexHtml: {
      order: 'pre',
      handler: (html) => html.replace(/%(APP_NAME|APP_DESCRIPTION|THEME_COLOR)%/g, (_, key: string) => values[key] ?? ''),
    },
  }
}

export default defineConfig(({ command, mode }) => {
  // Build produksi gagal bila env tidak valid. Nilai kosong atau salah akan tertanam di bundle
  // dan hanya bisa diperbaiki dengan build ulang (deploy.rules.md).
  if (command === 'build') {
    parseConfig(loadEnv(mode, process.cwd(), 'VITE_'))
  }

  return {
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
    plugins: [
      react(),
      htmlConstants(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['maharum-circle.png', 'apple-touch-icon.png'],
        manifest: {
          name: APP_NAME,
          short_name: APP_NAME,
          description: APP_DESCRIPTION,
          lang: 'id',
          start_url: '/',
          scope: '/',
          display: 'standalone',
          theme_color: THEME_COLOR,
          background_color: BACKGROUND_COLOR,
          icons: [
            { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
            { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
            { src: 'pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          // App shell saja yang di-precache. Respons API tidak pernah masuk cache.
          globPatterns: ['**/*.{js,css,html,woff2,png,webmanifest}'],
          navigateFallback: 'index.html',
          navigateFallbackDenylist: [/^\/api\//],
          runtimeCaching: [
            {
              urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
              handler: 'NetworkOnly',
            },
          ],
        },
      }),
    ],
  }
})
