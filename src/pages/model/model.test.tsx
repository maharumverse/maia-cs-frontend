import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/api/errors'
import type { SettingsOut } from '@/api/types'
import ModelPage from '@/pages/model'

const get = vi.fn()
const post = vi.fn()
const put = vi.fn()
vi.mock('@/api/client', () => ({ getHttp: () => ({ get, post, put, patch: vi.fn(), delete: vi.fn() }) }))

const limits = {
  web: { max_message_chars: 1000, max_turns: 30, per_minute: 10, per_day: 100, limit_message: 'Batas web' },
  whatsapp: { max_message_chars: 800, max_turns: 20, per_minute: 5, per_day: 50, limit_message: 'Batas wa' },
  daily_cost_limit: '5.000000',
}

function settingsOut(version = 7, overrides: Record<string, unknown> = {}): SettingsOut {
  return {
    version,
    data: {
      bot: { system_prompt: 'p' },
      model: {
        primary: 'claude-sonnet-5-5',
        fallback: 'claude-haiku-4-5',
        allowed_models: ['claude-sonnet-5-5', 'claude-haiku-4-5', 'claude-sonnet-4-5'],
        temperature: 0.2,
        max_tokens: 1024,
        timeout_seconds: 30,
        max_retries: 2,
        ...overrides,
      },
      limits,
      whatsapp: { provider: 'meta' },
      web: { allowed_origins: [] },
    },
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
        <ModelPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

async function loaded() {
  await screen.findByLabelText('Model Utama')
}

const saveButton = () => screen.getByRole('button', { name: 'Simpan Perubahan' })

describe('Halaman Model', () => {
  beforeEach(() => {
    get.mockReset()
    post.mockReset()
    put.mockReset()
    get.mockResolvedValue({ data: settingsOut() })
  })

  it('mengisi form dari pengaturan aktif', async () => {
    renderPage()
    await loaded()
    expect(screen.getByLabelText('Model Utama')).toHaveValue('claude-sonnet-5-5')
    expect(screen.getByLabelText('Model Cadangan')).toHaveValue('claude-haiku-4-5')
    expect(screen.getByLabelText('Maksimum Token')).toHaveValue(1024)
    expect(screen.getByLabelText('Batas Waktu (Detik)')).toHaveValue(30)
    expect(screen.getByLabelText('Percobaan Ulang Maksimum')).toHaveValue(2)
    expect(screen.getByLabelText('Temperature')).toHaveValue(0.2)
    expect(saveButton()).toBeDisabled()
  })

  it('memakai batas dari backend sebagai atribut input', async () => {
    renderPage()
    await loaded()
    expect(screen.getByLabelText('Maksimum Token')).toHaveAttribute('min', '100')
    expect(screen.getByLabelText('Maksimum Token')).toHaveAttribute('max', '8192')
    expect(screen.getByLabelText('Batas Waktu (Detik)')).toHaveAttribute('min', '5')
    expect(screen.getByLabelText('Batas Waktu (Detik)')).toHaveAttribute('max', '120')
    expect(screen.getByLabelText('Percobaan Ulang Maksimum')).toHaveAttribute('max', '5')
    expect(screen.getByLabelText('Temperature')).toHaveAttribute('max', '1')
  })

  it('mengubah field menandai halaman kotor', async () => {
    const user = userEvent.setup()
    renderPage()
    await loaded()
    const input = screen.getByLabelText('Maksimum Token')
    await user.clear(input)
    await user.type(input, '2048')
    expect(saveButton()).toBeEnabled()
  })

  it('menyimpan seluruh pengaturan dengan hanya potongan model yang berubah', async () => {
    const user = userEvent.setup()
    put.mockResolvedValue({ data: settingsOut(8, { max_tokens: 2048 }) })
    renderPage()
    await loaded()
    const input = screen.getByLabelText('Maksimum Token')
    await user.clear(input)
    await user.type(input, '2048')
    await user.click(saveButton())
    await waitFor(() => expect(put).toHaveBeenCalledTimes(1))
    const expected = settingsOut(7, { max_tokens: 2048 }).data
    expect(put).toHaveBeenCalledWith('settings', { base_version: 7, data: expected, change_note: null })
  })

  it('pilihan utama dan cadangan berasal dari daftar yang diizinkan', async () => {
    renderPage()
    await loaded()
    const primary = screen.getByLabelText('Model Utama')
    expect(within(primary).getAllByRole('option').map((o) => o.textContent)).toEqual([
      'claude-sonnet-5-5',
      'claude-haiku-4-5',
      'claude-sonnet-4-5',
    ])
    const fallback = screen.getByLabelText('Model Cadangan')
    expect(within(fallback).getAllByRole('option').map((o) => o.textContent)).toEqual([
      'Tanpa model cadangan',
      'claude-sonnet-5-5',
      'claude-haiku-4-5',
      'claude-sonnet-4-5',
    ])
  })

  it('model cadangan bisa dikosongkan dan dikirim sebagai null', async () => {
    const user = userEvent.setup()
    put.mockResolvedValue({ data: settingsOut(8, { fallback: null }) })
    renderPage()
    await loaded()
    await user.selectOptions(screen.getByLabelText('Model Cadangan'), 'Tanpa model cadangan')
    await user.click(saveButton())
    await waitFor(() => expect(put).toHaveBeenCalled())
    const body = put.mock.calls[0]?.[1] as { data: { model: { fallback: unknown } } }
    expect(body.data.model.fallback).toBeNull()
  })

  it('tidak bisa menghapus model yang sedang dipilih dan menampilkan alasannya', async () => {
    const user = userEvent.setup()
    renderPage()
    await loaded()
    await user.click(screen.getByRole('button', { name: 'Hapus claude-sonnet-5-5' }))
    expect(screen.getByRole('alert')).toHaveTextContent('claude-sonnet-5-5 sedang dipilih sebagai model utama')
    expect(within(screen.getByLabelText('Model Utama')).getByRole('option', { name: 'claude-sonnet-5-5' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Hapus claude-haiku-4-5' }))
    expect(screen.getByRole('alert')).toHaveTextContent('claude-haiku-4-5 sedang dipilih sebagai model cadangan')
    expect(saveButton()).toBeDisabled()
  })

  it('menghapus model yang tidak dipilih mengubah daftar dan pilihan', async () => {
    const user = userEvent.setup()
    renderPage()
    await loaded()
    await user.click(screen.getByRole('button', { name: 'Hapus claude-sonnet-4-5' }))
    expect(screen.queryByRole('button', { name: 'Hapus claude-sonnet-4-5' })).not.toBeInTheDocument()
    expect(within(screen.getByLabelText('Model Utama')).queryByRole('option', { name: 'claude-sonnet-4-5' })).not.toBeInTheDocument()
    expect(saveButton()).toBeEnabled()
  })

  it('menambah model baru, menolak duplikat dan nama kosong', async () => {
    const user = userEvent.setup()
    renderPage()
    await loaded()
    const input = screen.getByLabelText('Nama Model Baru')
    const add = screen.getByRole('button', { name: 'Tambah Model' })

    await user.click(add)
    expect(screen.getByRole('alert')).toHaveTextContent('Nama model tidak boleh kosong')

    await user.type(input, '  claude-haiku-4-5 ')
    await user.click(add)
    expect(screen.getByRole('alert')).toHaveTextContent('sudah ada di daftar')
    expect(saveButton()).toBeDisabled()

    await user.clear(input)
    await user.type(input, 'claude-opus-4-5')
    await user.click(add)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Hapus claude-opus-4-5' })).toBeInTheDocument()
    expect(within(screen.getByLabelText('Model Utama')).getByRole('option', { name: 'claude-opus-4-5' })).toBeInTheDocument()
    expect(input).toHaveValue('')
    expect(saveButton()).toBeEnabled()
  })

  it('temperature ditandai tidak berpengaruh untuk model generasi 5', async () => {
    const user = userEvent.setup()
    renderPage()
    await loaded()
    const hint = 'Tidak berpengaruh pada model generasi 5 (mis. claude-sonnet-5-5), yang hanya menerima nilai bawaan.'
    expect(screen.getByLabelText('Temperature')).toHaveAccessibleDescription(expect.stringContaining(hint))
    await user.selectOptions(screen.getByLabelText('Model Utama'), 'claude-sonnet-4-5')
    expect(screen.getByLabelText('Temperature')).not.toHaveAccessibleDescription(expect.stringContaining(hint))
  })

  it('tes model utama memanggil endpoint dengan nama terpilih dan menampilkan latensi dan biaya', async () => {
    const user = userEvent.setup()
    post.mockResolvedValue({ data: { ok: true, model: 'claude-sonnet-4-5', latency_ms: 812, cost: '0.0012' } })
    renderPage()
    await loaded()
    // Pilihan belum disimpan tetap yang dites.
    await user.selectOptions(screen.getByLabelText('Model Utama'), 'claude-sonnet-4-5')
    const group = screen.getByRole('group', { name: 'Tes model utama' })
    await user.click(within(group).getByRole('button', { name: 'Tes Model' }))
    await waitFor(() => expect(post).toHaveBeenCalledWith('settings/model-test', { model: 'claude-sonnet-4-5' }))
    expect(await within(group).findByText('Berhasil')).toBeInTheDocument()
    expect(within(group).getByText(/812 ms/)).toBeInTheDocument()
    expect(within(group).getByText(/\$0\.0012/)).toBeInTheDocument()
    expect(put).not.toHaveBeenCalled()
    expect(screen.getByText(/menimbulkan biaya sangat kecil/)).toBeInTheDocument()
  })

  it('tes model cadangan hanya ada bila cadangan dipilih dan melaporkan kegagalan', async () => {
    const user = userEvent.setup()
    post.mockResolvedValue({ data: { ok: false, model: 'claude-haiku-4-5', latency_ms: 20000, cost: null } })
    renderPage()
    await loaded()
    const group = screen.getByRole('group', { name: 'Tes model cadangan' })
    await user.click(within(group).getByRole('button', { name: 'Tes Model' }))
    await waitFor(() => expect(post).toHaveBeenCalledWith('settings/model-test', { model: 'claude-haiku-4-5' }))
    expect(await within(group).findByText('Gagal')).toBeInTheDocument()
    expect(within(group).getByText(/20\.000 ms/)).toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('Model Cadangan'), 'Tanpa model cadangan')
    expect(screen.queryByRole('group', { name: 'Tes model cadangan' })).not.toBeInTheDocument()
  })

  it('galat permintaan tes ditampilkan sebagai gagal', async () => {
    const user = userEvent.setup()
    post.mockRejectedValue(new ApiError(502, 'LLM_ERROR', 'Layanan model tidak menjawab'))
    renderPage()
    await loaded()
    const group = screen.getByRole('group', { name: 'Tes model utama' })
    await user.click(within(group).getByRole('button', { name: 'Tes Model' }))
    expect(await within(group).findByRole('alert')).toHaveTextContent('Server sedang bermasalah')
  })

  it('konflik versi menampilkan pesan muat ulang', async () => {
    const user = userEvent.setup()
    put.mockRejectedValue(new ApiError(409, 'SETTINGS_CONFLICT', 'konflik'))
    renderPage()
    await loaded()
    const input = screen.getByLabelText('Maksimum Token')
    await user.clear(input)
    await user.type(input, '500')
    await user.click(saveButton())
    expect(await screen.findByText(/Muat ulang untuk melihat versi terbaru/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Muat Ulang' })).toBeInTheDocument()
  })

  it('galat validasi 422 dari backend ditampilkan', async () => {
    const user = userEvent.setup()
    put.mockRejectedValue(new ApiError(422, 'VALIDATION_ERROR', 'Data tidak valid: max_tokens'))
    renderPage()
    await loaded()
    const input = screen.getByLabelText('Maksimum Token')
    await user.clear(input)
    await user.type(input, '500')
    await user.click(saveButton())
    expect(await screen.findByText('Data tidak valid: max_tokens')).toBeInTheDocument()
  })

  it('nilai di luar batas ditandai dan tidak dikirim', async () => {
    const user = userEvent.setup()
    renderPage()
    await loaded()
    const input = screen.getByLabelText('Maksimum Token')
    await user.clear(input)
    await user.type(input, '50')
    expect(input).toBeInvalid()
    await user.click(saveButton())
    expect(put).not.toHaveBeenCalled()
    expect(screen.getByText(/antara 100 dan 8\.192/)).toBeInTheDocument()
  })

  it('galat memuat tampil sebagai galat, bukan form kosong', async () => {
    get.mockRejectedValue(new ApiError(500, 'X', 'x'))
    renderPage()
    expect(await screen.findByText('Server sedang bermasalah. Coba lagi sebentar lagi.')).toBeInTheDocument()
    expect(screen.queryByLabelText('Model Utama')).not.toBeInTheDocument()
  })

  it('hanya ada satu tombol utama', async () => {
    renderPage()
    await loaded()
    expect(document.querySelectorAll('.btn.pri')).toHaveLength(1)
  })
})
