import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/api/errors'
import type { SettingsOut } from '@/api/types'
import LimitPage from '@/pages/limit'

const get = vi.fn()
const put = vi.fn()
vi.mock('@/api/client', () => ({ getHttp: () => ({ get, put, post: vi.fn(), patch: vi.fn(), delete: vi.fn() }) }))

const model = {
  primary: 'claude-sonnet-5-5',
  fallback: null,
  allowed_models: ['claude-sonnet-5-5'],
  temperature: 0.2,
  max_tokens: 1024,
  timeout_seconds: 30,
  max_retries: 2,
}

function limitsOf(overrides: Record<string, unknown> = {}) {
  return {
    web: { max_message_chars: 1000, max_turns: 30, per_minute: 10, per_day: 100, limit_message: 'Batas web' },
    whatsapp: { max_message_chars: 800, max_turns: 20, per_minute: 5, per_day: 50, limit_message: 'Batas wa' },
    daily_cost_limit: '5.000000',
    ...overrides,
  }
}

function settingsOut(version = 4, limits = limitsOf()): SettingsOut {
  return {
    version,
    data: { bot: { system_prompt: 'p' }, model, limits, whatsapp: { provider: 'meta' }, web: { allowed_origins: [] } },
    changed_by_nip: null,
    change_note: null,
    restored_from_version: null,
    created_at: null,
  } as unknown as SettingsOut
}

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <LimitPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

const web = () => screen.getByRole('region', { name: 'Channel Web' })
const wa = () => screen.getByRole('region', { name: 'Channel WhatsApp' })
const saveButton = () => screen.getByRole('button', { name: 'Simpan Perubahan' })

async function loaded() {
  await screen.findByRole('region', { name: 'Channel Web' })
}

async function setNumber(scope: HTMLElement, label: string, value: string) {
  const user = userEvent.setup()
  const input = within(scope).getByLabelText(label)
  await user.clear(input)
  if (value) await user.type(input, value)
}

describe('Halaman Limit', () => {
  beforeEach(() => {
    get.mockReset()
    put.mockReset()
    get.mockResolvedValue({ data: settingsOut() })
  })

  it('mengisi dua kartu channel dan batas biaya dari pengaturan', async () => {
    renderPage()
    await loaded()
    expect(within(web()).getByLabelText('Maksimum Karakter per Pesan')).toHaveValue(1000)
    expect(within(web()).getByLabelText('Maksimum Giliran')).toHaveValue(30)
    expect(within(web()).getByLabelText('Batas per Menit')).toHaveValue(10)
    expect(within(web()).getByLabelText('Batas per Hari')).toHaveValue(100)
    expect(within(web()).getByLabelText('Pesan Saat Batas Tercapai')).toHaveValue('Batas web')
    expect(within(wa()).getByLabelText('Maksimum Karakter per Pesan')).toHaveValue(800)
    expect(within(wa()).getByLabelText('Pesan Saat Batas Tercapai')).toHaveValue('Batas wa')
    expect(screen.getByLabelText('Batas Biaya Harian (USD)')).toHaveValue('5.000000')
    expect(screen.getByText(/bot berhenti menjawab dengan pesan fallback/)).toBeInTheDocument()
    expect(saveButton()).toBeDisabled()
  })

  it('memakai batas dari backend sebagai atribut input', async () => {
    renderPage()
    await loaded()
    const chars = within(web()).getByLabelText('Maksimum Karakter per Pesan')
    expect(chars).toHaveAttribute('min', '1')
    expect(chars).toHaveAttribute('max', '10000')
    expect(within(web()).getByLabelText('Maksimum Giliran')).toHaveAttribute('max', '500')
    expect(within(web()).getByLabelText('Batas per Menit')).toHaveAttribute('max', '1000')
    expect(within(web()).getByLabelText('Batas per Hari')).toHaveAttribute('max', '100000')
    expect(within(web()).getByLabelText('Pesan Saat Batas Tercapai')).toHaveAttribute('maxlength', '2000')
  })

  it('mengubah field menandai halaman kotor', async () => {
    renderPage()
    await loaded()
    await setNumber(web(), 'Batas per Menit', '12')
    expect(saveButton()).toBeEnabled()
  })

  it('dua channel diedit independen dan hanya potongan limits yang berubah saat disimpan', async () => {
    const user = userEvent.setup()
    put.mockResolvedValue({ data: settingsOut(5) })
    renderPage()
    await loaded()
    await setNumber(web(), 'Batas per Menit', '12')
    expect(within(wa()).getByLabelText('Batas per Menit')).toHaveValue(5)
    await user.clear(within(wa()).getByLabelText('Pesan Saat Batas Tercapai'))
    await user.type(within(wa()).getByLabelText('Pesan Saat Batas Tercapai'), 'Sudah batas')
    expect(within(web()).getByLabelText('Pesan Saat Batas Tercapai')).toHaveValue('Batas web')

    await user.click(saveButton())
    await waitFor(() => expect(put).toHaveBeenCalledTimes(1))
    const expectedLimits = limitsOf()
    expectedLimits.web.per_minute = 12
    expectedLimits.whatsapp.limit_message = 'Sudah batas'
    expect(put).toHaveBeenCalledWith('settings', {
      base_version: 4,
      data: settingsOut(4, expectedLimits).data,
      change_note: null,
    })
  })

  it('batas biaya kosong dikirim sebagai null', async () => {
    const user = userEvent.setup()
    put.mockResolvedValue({ data: settingsOut(5, limitsOf({ daily_cost_limit: null })) })
    renderPage()
    await loaded()
    await user.clear(screen.getByLabelText('Batas Biaya Harian (USD)'))
    await user.click(saveButton())
    await waitFor(() => expect(put).toHaveBeenCalled())
    const body = put.mock.calls[0]?.[1] as { data: { limits: { daily_cost_limit: unknown } } }
    expect(body.data.limits.daily_cost_limit).toBeNull()
  })

  it('batas biaya desimal dikirim apa adanya', async () => {
    const user = userEvent.setup()
    put.mockResolvedValue({ data: settingsOut(5) })
    renderPage()
    await loaded()
    const input = screen.getByLabelText('Batas Biaya Harian (USD)')
    await user.clear(input)
    await user.type(input, '2.5')
    await user.click(saveButton())
    await waitFor(() => expect(put).toHaveBeenCalled())
    const body = put.mock.calls[0]?.[1] as { data: { limits: { daily_cost_limit: unknown } } }
    expect(body.data.limits.daily_cost_limit).toBe('2.5')
  })

  it('batas biaya negatif ditolak dan tidak dikirim', async () => {
    const user = userEvent.setup()
    renderPage()
    await loaded()
    const input = screen.getByLabelText('Batas Biaya Harian (USD)')
    await user.clear(input)
    await user.type(input, '-1')
    expect(screen.getByText('Tidak boleh negatif.')).toBeInTheDocument()
    expect(input).toBeInvalid()
    await user.click(saveButton())
    expect(put).not.toHaveBeenCalled()
  })

  it('batas biaya bukan angka ditolak', async () => {
    const user = userEvent.setup()
    renderPage()
    await loaded()
    const input = screen.getByLabelText('Batas Biaya Harian (USD)')
    await user.clear(input)
    await user.type(input, 'abc')
    expect(screen.getByText(/angka desimal/)).toBeInTheDocument()
    await user.click(saveButton())
    expect(put).not.toHaveBeenCalled()
  })

  it('nilai di luar batas ditandai dan tidak dikirim', async () => {
    const user = userEvent.setup()
    renderPage()
    await loaded()
    await setNumber(web(), 'Maksimum Giliran', '501')
    expect(within(web()).getByLabelText('Maksimum Giliran')).toBeInvalid()
    expect(within(web()).getByText(/antara 1 dan 500/)).toBeInTheDocument()
    expect(within(wa()).queryByText(/antara 1 dan 500/)).not.toBeInTheDocument()
    await user.click(saveButton())
    expect(put).not.toHaveBeenCalled()
  })

  it('konflik versi menampilkan pesan muat ulang', async () => {
    const user = userEvent.setup()
    put.mockRejectedValue(new ApiError(409, 'SETTINGS_CONFLICT', 'konflik'))
    renderPage()
    await loaded()
    await setNumber(web(), 'Batas per Menit', '12')
    await user.click(saveButton())
    expect(await screen.findByText(/Muat ulang untuk melihat versi terbaru/)).toBeInTheDocument()
  })

  it('galat validasi 422 dari backend ditampilkan', async () => {
    const user = userEvent.setup()
    put.mockRejectedValue(new ApiError(422, 'VALIDATION_ERROR', 'Data tidak valid: per_minute'))
    renderPage()
    await loaded()
    await setNumber(web(), 'Batas per Menit', '12')
    await user.click(saveButton())
    expect(await screen.findByText('Data tidak valid: per_minute')).toBeInTheDocument()
  })

  it('galat memuat tampil sebagai galat, bukan form kosong', async () => {
    get.mockRejectedValue(new ApiError(500, 'X', 'x'))
    renderPage()
    expect(await screen.findByText('Server sedang bermasalah. Coba lagi sebentar lagi.')).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Channel Web' })).not.toBeInTheDocument()
  })

  it('hanya ada satu tombol utama', async () => {
    renderPage()
    await loaded()
    expect(document.querySelectorAll('.btn.pri')).toHaveLength(1)
  })
})
