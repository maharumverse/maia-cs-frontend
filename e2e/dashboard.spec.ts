import { expect, test, type Page, type Route } from '@playwright/test'
import settingsFixture from './fixtures/settings.json' with { type: 'json' }

const API = 'https://api.test.local'
const ORIGIN = 'http://localhost:5199'

const cors = {
  'Access-Control-Allow-Origin': ORIGIN,
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Headers': 'content-type',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
}

function json(route: Route, status: number, body: unknown) {
  return route.fulfill({ status, headers: cors, contentType: 'application/json', body: JSON.stringify(body) })
}

const conversation = (id: string, number: string, channel: 'web' | 'whatsapp', fallback = 0) => ({
  id,
  channel,
  provider: channel === 'web' ? null : 'meta',
  number_masked: number,
  started_at: '2026-10-23T03:00:00Z',
  last_activity_at: '2026-10-23T03:10:00Z',
  message_count: 2,
  fallback_count: fallback,
  feedback_up: 1,
  feedback_down: 0,
  cost: '0.004',
})

const summary = {
  range: { dari: '2026-09-25', sampai: '2026-10-24' },
  conversations: 42,
  by_channel: { web: 30, whatsapp: 12 },
  messages_in: 120,
  answers: 118,
  answered: 100,
  fallback: { total: 18, rate: 18 / 118, by_reason: { not_in_document: 12, forbidden_topic: 6 } },
  feedback: { up: 9, down: 1, rate_up: 0.9 },
  cost: { total: '1.2345', today: '0.0500', daily_limit: '10', warning: false },
  tokens: { input: 1, output: 1, cache_read: 1, cache_write: 1 },
}

const timeseries = {
  range: summary.range,
  items: [
    { date: '2026-10-23', conversations: 4, user_messages: 9, fallbacks: 1, cost: '0.1', feedback_up: 2, feedback_down: 0 },
    { date: '2026-10-24', conversations: 6, user_messages: 12, fallbacks: 2, cost: '0.2', feedback_up: 3, feedback_down: 1 },
  ],
}

interface Calls {
  settingsPut: unknown[]
  conversationQueries: string[]
  playground: unknown[]
  reveal: string[]
}

// Meniru backend tanpa server. Semua rute admin dijawab dari data tetap di atas.
async function mockApi(page: Page): Promise<Calls> {
  const calls: Calls = { settingsPut: [], conversationQueries: [], playground: [], reveal: [] }
  let settings = structuredClone(settingsFixture)

  await page.route(`${API}/**`, async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const path = url.pathname.replace('/api/v1/', '')
    const method = request.method()

    if (method === 'OPTIONS') return route.fulfill({ status: 204, headers: cors })
    if (path === 'auth/me') return json(route, 200, { nip: '20230101', groups: ['admin'], is_admin: true })
    if (path === 'dashboard/summary') return json(route, 200, summary)
    if (path === 'dashboard/timeseries') return json(route, 200, timeseries)
    if (path === 'settings' && method === 'GET') return json(route, 200, settings)
    if (path === 'settings' && method === 'PUT') {
      const body = request.postDataJSON() as { data: typeof settings.data; base_version: number }
      calls.settingsPut.push(body)
      settings = { ...settings, version: settings.version + 1, data: body.data }
      return json(route, 200, settings)
    }
    if (path === 'settings/versions') {
      return json(route, 200, { items: [], total: 0, limit: 20, offset: 0 })
    }
    if (path === 'knowledge/summary') {
      return json(route, 200, { active_documents: 1, active_tokens: 3000, mode: 'full_context', processing_documents: 0, full_context_max_tokens: 50000 })
    }
    if (path === 'knowledge/documents') {
      return json(route, 200, { items: [], total: 0, limit: 20, offset: 0 })
    }
    if (path === 'conversations' && method === 'GET') {
      calls.conversationQueries.push(url.search)
      const only = url.searchParams.get('channel')
      const all = [conversation('c1', '6281******89', 'web'), conversation('c2', '6282******22', 'whatsapp', 1)]
      const items = only ? all.filter((c) => c.channel === only) : all
      return json(route, 200, { items, total: items.length, limit: 20, offset: 0 })
    }
    if (path === 'conversations/c2') {
      return json(route, 200, {
        id: 'c2',
        channel: 'whatsapp',
        provider: 'meta',
        number_masked: '6282******22',
        contact_name: 'Budi',
        started_at: '2026-10-23T03:00:00Z',
        last_activity_at: '2026-10-23T03:10:00Z',
        messages: [
          { id: 'm1', role: 'user', text: 'berapa harga produk x?', created_at: '2026-10-23T03:00:00Z', fallback_reason: null, sources: [], feedback: null, model: null, cost: null, input_tokens: null, output_tokens: null, delivery_status: null, kind: 'text' },
          { id: 'm2', role: 'assistant', text: 'Soal harga, tanya sales ya Kak.', created_at: '2026-10-23T03:00:03Z', fallback_reason: 'forbidden_topic', sources: [], feedback: 'down', model: 'claude-sonnet-5-5', cost: '0.003', input_tokens: 100, output_tokens: 20, delivery_status: 'sent', kind: 'text' },
        ],
      })
    }
    if (path === 'conversations/c2/reveal-number') {
      calls.reveal.push(path)
      return json(route, 200, { number: '628222222222' })
    }
    if (path === 'playground/chat') {
      calls.playground.push(request.postDataJSON())
      return json(route, 200, {
        text: 'Pakai jerigen 30 liter ya Kak.',
        fallback_reason: null,
        sources: [{ ref_no: 1, document_title: 'faq.md', heading_path: 'FAQ > Kemasan', body: 'Pesanan 25 kg pakai jerigen 30 liter.' }],
        mode: 'full_context',
        model: 'claude-sonnet-5-5',
        usage: { input: 100, output: 20, cache_read: 500, cache_write: 0 },
        cost: '0.0031',
        settings: 'active',
      })
    }
    return json(route, 404, { error: { code: 'NOT_FOUND', message: 'Data tidak ditemukan', detail: null } })
  })
  return calls
}

test('Ringkasan menampilkan angka dari backend dan grafik', async ({ page }) => {
  await mockApi(page)
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1, name: 'Ringkasan' })).toBeVisible()
  await expect(page.getByText('42', { exact: true }).first()).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Aktivitas Harian' })).toBeVisible()
  await expect(page.locator('canvas').first()).toBeVisible()
  await page.getByRole('button', { name: 'Tampilan Tabel' }).first().click()
  await expect(page.getByRole('table').first()).toBeVisible()
})

test('Percakapan: filter ada di URL dan bertahan setelah refresh, lalu buka rincian dan nomor lengkap', async ({ page }) => {
  const calls = await mockApi(page)
  await page.goto('/percakapan')
  await expect(page.getByText('6282******22')).toBeVisible()

  await page.getByLabel('Channel').selectOption('whatsapp')
  await expect(page).toHaveURL(/channel=whatsapp/)
  await expect(page.getByText('6281******89')).toHaveCount(0)

  await page.reload()
  await expect(page.getByLabel('Channel')).toHaveValue('whatsapp')
  await expect(page.getByText('6282******22')).toBeVisible()
  expect(calls.conversationQueries.at(-1)).toContain('channel=whatsapp')

  await page.getByRole('link', { name: 'Lihat' }).click()
  await expect(page).toHaveURL(/percakapan\/c2/)
  await expect(page.getByText('Soal harga, tanya sales ya Kak.')).toBeVisible()
  await expect(page.getByText('Topik terlarang')).toBeVisible()

  await page.getByRole('button', { name: 'Tampilkan Nomor Lengkap' }).click()
  await page.getByRole('dialog').getByRole('button', { name: /Tampilkan/ }).click()
  await expect(page.getByText('628222222222')).toBeVisible()
  expect(calls.reveal).toHaveLength(1)
})

test('Model: mengubah parameter lalu menyimpan mengirim seluruh pengaturan dengan versi dasar', async ({ page }) => {
  const calls = await mockApi(page)
  await page.goto('/model')
  const tokens = page.getByLabel('Maksimum Token')
  await tokens.fill('2048')
  await page.getByRole('button', { name: 'Simpan Perubahan' }).click()
  await expect(page.getByText(/tersimpan sebagai versi baru/i)).toBeVisible()

  expect(calls.settingsPut).toHaveLength(1)
  const body = calls.settingsPut[0] as { base_version: number; data: { model: { max_tokens: number }; bot: unknown; limits: unknown } }
  expect(body.base_version).toBe(3)
  expect(body.data.model.max_tokens).toBe(2048)
  expect(body.data.bot).toBeDefined()
  expect(body.data.limits).toBeDefined()
})

test('Playground: mengirim pertanyaan menampilkan jawaban dan dasar jawabannya', async ({ page }) => {
  const calls = await mockApi(page)
  await page.goto('/playground')
  await page.getByRole('textbox').last().fill('kemasan 25 kg apa?')
  await page.getByRole('button', { name: 'Kirim' }).click()
  await expect(page.getByText('Pakai jerigen 30 liter ya Kak.')).toBeVisible()
  await expect(page.getByText(/FAQ › Kemasan|FAQ > Kemasan/)).toBeVisible()
  expect(calls.playground).toHaveLength(1)
  expect(calls.playground[0]).toMatchObject({ message: 'kemasan 25 kg apa?', channel: 'web' })
  expect(calls.playground[0]).not.toHaveProperty('settings')
})

test('Knowledge dan Channel terbuka tanpa galat konsol', async ({ page }) => {
  await mockApi(page)
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  for (const [path, heading] of [
    ['/knowledge', 'Knowledge'],
    ['/channel', 'Channel'],
    ['/limit', 'Limit'],
    ['/pengaturan-bot', 'Pengaturan Bot'],
  ] as const) {
    await page.goto(path)
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible()
  }
  expect(errors).toEqual([])
})
