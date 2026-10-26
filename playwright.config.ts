import { defineConfig, devices } from '@playwright/test'

const PORT = 5199

// Smoke test dashboard. API selalu di-mock lewat page.route, jadi tidak butuh backend dan
// tidak membaca berkas env. Nilai VITE_* di bawah hanya untuk server dev milik test ini.
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npm run dev -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    env: {
      VITE_API_BASE_URL: 'https://api.test.local',
      VITE_AUTH_MODE: 'stopgap',
      VITE_SSO_LOGIN_URL: '',
    },
  },
})
