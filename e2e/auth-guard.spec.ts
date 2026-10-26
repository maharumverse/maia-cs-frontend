import { expect, test, type Page, type Route } from '@playwright/test'

const API = 'https://api.test.local'
const ORIGIN = 'http://localhost:5199'
const NIP = '20230101'
const PASSWORD = 'kata-sandi-uji'

const cors = {
  'Access-Control-Allow-Origin': ORIGIN,
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Headers': 'content-type',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
}

function json(route: Route, status: number, body: unknown) {
  return route.fulfill({ status, headers: cors, contentType: 'application/json', body: JSON.stringify(body) })
}

const unauthenticated = { error: { code: 'UNAUTHENTICATED', message: 'Anda belum masuk', detail: null } }
const invalidCredentials = {
  error: { code: 'INVALID_CREDENTIALS', message: 'NIP atau kata sandi salah', detail: null },
}

// Meniru backend AUTH_MODE=stopgap tanpa server: sesi dianggap ada setelah login berhasil.
async function mockApi(page: Page, options: { signedIn?: boolean } = {}) {
  let signedIn = options.signedIn ?? false

  await page.route(`${API}/**`, async (route) => {
    const request = route.request()
    const path = new URL(request.url()).pathname

    if (request.method() === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: cors })
    }
    if (path === '/api/v1/auth/me') {
      return signedIn
        ? json(route, 200, { nip: NIP, groups: ['admin'], is_admin: true })
        : json(route, 401, unauthenticated)
    }
    if (path === '/api/v1/auth/login') {
      const body = request.postDataJSON() as { nip: string; password: string }
      if (body.nip === NIP && body.password === PASSWORD) {
        signedIn = true
        return json(route, 200, { nip: NIP, groups: ['admin'], is_admin: true })
      }
      return json(route, 401, invalidCredentials)
    }
    if (path === '/api/v1/auth/logout') {
      signedIn = false
      return route.fulfill({ status: 204, headers: cors })
    }
    return json(route, 404, { error: { code: 'NOT_FOUND', message: 'Data tidak ditemukan', detail: null } })
  })
}

async function signIn(page: Page, password: string) {
  await page.getByLabel('NIP').fill(NIP)
  await page.getByLabel('Kata Sandi', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Masuk' }).click()
}

test('pengguna anonim dialihkan ke login, lalu kembali ke halaman asal lengkap dengan query', async ({ page }) => {
  await mockApi(page)
  await page.goto('/percakapan?hal=2')

  await expect(page).toHaveURL(`${ORIGIN}/masuk?next=%2Fpercakapan%3Fhal%3D2`)
  await expect(page.getByRole('heading', { name: 'Masuk' })).toBeVisible()
  await expect(page).toHaveTitle('MAIA CS')

  await signIn(page, 'salah')
  await expect(page.getByRole('alert')).toHaveText('NIP atau kata sandi salah. Periksa lagi, lalu coba masuk.')
  await expect(page.getByLabel('Kata Sandi', { exact: true })).toHaveValue('')

  await signIn(page, PASSWORD)
  await expect(page).toHaveURL(`${ORIGIN}/percakapan?hal=2`)
  await expect(page.getByRole('heading', { level: 1, name: 'Percakapan' })).toBeVisible()
  await expect(page).toHaveTitle('MAIA CS')
})

test('sidebar memuat delapan bagian dan refresh tetap di halaman yang sama', async ({ page }) => {
  await mockApi(page, { signedIn: true })
  await page.goto('/limit')

  const nav = page.getByRole('navigation', { name: 'Navigasi utama' })
  for (const name of ['Ringkasan', 'Knowledge', 'Percakapan', 'Pengaturan', 'Playground']) {
    await expect(nav.getByText(name, { exact: true })).toBeVisible()
  }
  // Limit adalah anak grup Pengaturan, jadi grupnya terbuka karena rute aktif.
  for (const name of ['Pengaturan Bot', 'Model', 'Limit', 'Channel']) {
    await expect(nav.getByRole('link', { name })).toBeVisible()
  }
  await expect(nav.getByRole('link', { name: 'Limit' })).toHaveAttribute('aria-current', 'page')

  await page.reload()
  await expect(page).toHaveURL(`${ORIGIN}/limit`)
  await expect(page.getByRole('heading', { level: 1, name: 'Limit' })).toBeVisible()
})

test('keluar mengembalikan pengguna ke halaman login', async ({ page }) => {
  await mockApi(page, { signedIn: true })
  await page.goto('/')
  await page.getByRole('button', { name: 'Keluar' }).click()
  await expect(page.getByRole('heading', { name: 'Masuk' })).toBeVisible()
})

test('parameter next ke situs lain diabaikan sesudah login', async ({ page }) => {
  await mockApi(page)
  await page.goto('/masuk?next=%2F%2Fevil.example')
  await signIn(page, PASSWORD)
  await expect(page).toHaveURL(`${ORIGIN}/`)
})

test('alamat yang tidak dikenal menampilkan halaman tidak ditemukan, bukan pengalihan diam-diam', async ({ page }) => {
  await mockApi(page, { signedIn: true })
  await page.goto('/tidak-ada')
  await expect(page).toHaveURL(`${ORIGIN}/tidak-ada`)
  await expect(page.getByRole('heading', { name: 'Halaman Tidak Ditemukan' })).toBeVisible()
})
