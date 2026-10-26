import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// Terpisah dari vite.config.ts: test tidak butuh plugin PWA dan tidak memvalidasi env build.
export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['src/test/setup.ts'],
    restoreMocks: true,
  },
})
