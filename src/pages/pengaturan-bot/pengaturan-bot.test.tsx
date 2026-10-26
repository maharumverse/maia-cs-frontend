import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/api/errors'
import type { BotSettings, Schemas, SettingsOut } from '@/api/types'
import PengaturanBotPage from './index'

const get = vi.fn()
const post = vi.fn()
const put = vi.fn()
vi.mock('@/api/client', () => ({ getHttp: () => ({ get, post, put, patch: vi.fn(), delete: vi.fn() }) }))

const bot: BotSettings['bot'] = {
  system_prompt: 'Jawab hanya dari dokumen.',
  persona: {
    name: 'Maia',
    role: 'Customer Service Maharum Group',
    address_term: 'Kak',
    traits: ['ramah', 'sabar'],
    speaking_style: 'Santai dan sopan.',
    emoji: 'sparing',
  },
  greeting: { web: 'Halo dari web', whatsapp: 'Halo dari WA' },
  fallback_message: { web: 'Maaf web', whatsapp: 'Maaf WA' },
  forbidden_topics: ['harga', 'formula'],
  context_mode: 'auto',
  full_context_max_tokens: 50000,
  retrieval_top_k: 10,
  retrieval_threshold: 0.2,
  history_turns: 6,
  history_max_chars: 6000,
  max_upload_bytes: 5000000,
  chunk_max_chars: 1500,
  chunk_overlap_chars: 150,
}

const data = {
  bot,
  model: { primary: 'm1', allowed_models: ['m1'] },
  limits: { daily_cost_limit: null },
  whatsapp: { bot_enabled: false },
  web: { allowed_origins: [] },
} as unknown as BotSettings

const settings = (version = 3): SettingsOut => ({
  version,
  data,
  changed_by_nip: '1234',
  change_note: null,
  restored_from_version: null,
  created_at: '2026-10-20T03:00:00Z',
})

const versionPage: Schemas['VersionPage'] = {
  total: 3,
  limit: 20,
  offset: 0,
  items: [
    { version: 3, changed_by_nip: '1111', change_note: 'naikkan top k', restored_from_version: null, created_at: '2026-10-20T03:00:00Z' },
    { version: 2, changed_by_nip: '2222', change_note: 'pulih', restored_from_version: 1, created_at: '2026-10-19T03:00:00Z' },
    { version: 1, changed_by_nip: '3333', change_note: null, restored_from_version: null, created_at: '2026-10-18T03:00:00Z' },
  ],
}

const summary = {
  active_documents: 4,
  inactive_documents: 0,
  processing_documents: 0,
  failed_documents: 0,
  active_tokens: 12000,
  configured_mode: 'auto',
  effective_mode: 'full_context',
  full_context_max_tokens: 50000,
}

function route(overrides: { settings?: () => Promise<unknown>; summary?: () => Promise<unknown> } = {}) {
  get.mockImplementation((path: string) => {
    if (path === 'settings') return overrides.settings ? overrides.settings() : Promise.resolve({ data: settings() })
    if (path === 'settings/versions') return Promise.resolve({ data: versionPage })
    if (path === 'knowledge/summary') return overrides.summary ? overrides.summary() : Promise.resolve({ data: summary })
    return Promise.reject(new Error(`path tak terduga ${path}`))
  })
}

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <PengaturanBotPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

async function loaded() {
  await screen.findByLabelText('Nama')
}

const saveButton = () => screen.getByRole('button', { name: 'Simpan Perubahan' })

describe('Pengaturan Bot', () => {
  beforeEach(() => {
    get.mockReset()
    post.mockReset()
    put.mockReset()
    route()
  })

  it('mengisi form dari pengaturan aktif', async () => {
    renderPage()
    await loaded()
    expect(screen.getByLabelText('Nama')).toHaveValue('Maia')
    expect(screen.getByLabelText('Peran')).toHaveValue('Customer Service Maharum Group')
    expect(screen.getByLabelText('Sebutan Pelanggan')).toHaveValue('Kak')
    expect(screen.getByLabelText('Gaya Bicara')).toHaveValue('Santai dan sopan.')
    expect(screen.getByLabelText('Emoji')).toHaveValue('sparing')
    expect(screen.getByRole('option', { name: 'Tanpa emoji' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Sesekali' })).toBeInTheDocument()
    expect(screen.getByLabelText('System Prompt')).toHaveValue('Jawab hanya dari dokumen.')
    expect(screen.getByLabelText('Pesan Pembuka (Web)')).toHaveValue('Halo dari web')
    expect(screen.getByLabelText('Pesan Pembuka (WhatsApp)')).toHaveValue('Halo dari WA')
    expect(screen.getByLabelText('Pesan Fallback (Web)')).toHaveValue('Maaf web')
    expect(screen.getByLabelText('Pesan Fallback (WhatsApp)')).toHaveValue('Maaf WA')
    expect(screen.getByLabelText('Mode Konteks')).toHaveValue('auto')
    expect(screen.getByLabelText('Ambang Kemiripan')).toHaveValue(0.2)
    expect(screen.getByLabelText('Tumpang Tindih Potongan (karakter)')).toHaveValue(150)
    const traits = screen.getByRole('list', { name: 'Daftar sifat' })
    expect(within(traits).getAllByRole('listitem').map((li) => li.textContent)).toEqual([expect.stringContaining('ramah'), expect.stringContaining('sabar')])
    expect(screen.getByText('Jawab hanya dari dokumen.'.length + ' / 20.000')).toBeInTheDocument()
    expect(saveButton()).toBeDisabled()
  })

  it('memakai batas dari backend sebagai atribut input', async () => {
    renderPage()
    await loaded()
    expect(screen.getByLabelText('Nama')).toHaveAttribute('maxlength', '40')
    expect(screen.getByLabelText('Peran')).toHaveAttribute('maxlength', '100')
    expect(screen.getByLabelText('Sebutan Pelanggan')).toHaveAttribute('maxlength', '20')
    expect(screen.getByLabelText('System Prompt')).toHaveAttribute('maxlength', '20000')
    expect(screen.getByLabelText('Pesan Pembuka (Web)')).toHaveAttribute('maxlength', '2000')
    const threshold = screen.getByLabelText('Ambang Kemiripan')
    expect(threshold).toHaveAttribute('min', '0')
    expect(threshold).toHaveAttribute('max', '1')
    expect(threshold).toHaveAttribute('step', '0.05')
    expect(screen.getByLabelText('Jumlah Potongan Teratas')).toHaveAttribute('max', '50')
  })

  it('mengubah satu field menandai form kotor dan mengaktifkan Simpan', async () => {
    const user = userEvent.setup()
    renderPage()
    await loaded()
    expect(saveButton()).toBeDisabled()
    await user.type(screen.getByLabelText('Nama'), 'x')
    expect(saveButton()).toBeEnabled()
  })

  it('menyimpan seluruh pengaturan dengan hanya bot yang berubah dan base_version yang benar', async () => {
    const user = userEvent.setup()
    put.mockResolvedValue({ data: { ...settings(4) } })
    renderPage()
    await loaded()
    await user.clear(screen.getByLabelText('Nama'))
    await user.type(screen.getByLabelText('Nama'), 'Nadia')
    await user.click(saveButton())
    await waitFor(() => expect(put).toHaveBeenCalledTimes(1))
    expect(put).toHaveBeenCalledWith('settings', {
      base_version: 3,
      data: { ...data, bot: { ...bot, persona: { ...bot.persona, name: 'Nadia' } } },
      change_note: null,
    })
  })

  it('opsi emoji dan mode konteks ikut tersimpan', async () => {
    const user = userEvent.setup()
    put.mockResolvedValue({ data: settings(4) })
    renderPage()
    await loaded()
    await user.selectOptions(screen.getByLabelText('Emoji'), 'none')
    await user.selectOptions(screen.getByLabelText('Mode Konteks'), 'retrieval')
    await user.click(saveButton())
    await waitFor(() => expect(put).toHaveBeenCalled())
    const sent = (put.mock.calls[0]?.[1] as { data: BotSettings }).data.bot
    expect(sent.persona?.emoji).toBe('none')
    expect(sent.context_mode).toBe('retrieval')
  })

  it('menampilkan penjelasan mode konteks yang dipilih', async () => {
    const user = userEvent.setup()
    renderPage()
    await loaded()
    await user.selectOptions(screen.getByLabelText('Mode Konteks'), 'full_context')
    expect(screen.getByText(/seluruh dokumen aktif dikirim/i)).toBeInTheDocument()
    await user.selectOptions(screen.getByLabelText('Mode Konteks'), 'retrieval')
    expect(screen.getByText(/hanya potongan dokumen yang paling mirip/i)).toBeInTheDocument()
  })

  describe('editor daftar', () => {
    it('menambah butir lewat tombol dan Enter, lalu mengosongkan input', async () => {
      const user = userEvent.setup()
      renderPage()
      await loaded()
      const input = screen.getByLabelText('Tambah Sifat')
      await user.type(input, 'detail')
      await user.click(screen.getByRole('button', { name: 'Tambah Sifat Baru' }))
      expect(input).toHaveValue('')
      await user.type(input, 'teliti{Enter}')
      const list = screen.getByRole('list', { name: 'Daftar sifat' })
      expect(within(list).getAllByRole('listitem')).toHaveLength(4)
      expect(within(list).getByText('teliti')).toBeInTheDocument()
      expect(saveButton()).toBeEnabled()
    })

    it('menghapus butir', async () => {
      const user = userEvent.setup()
      put.mockResolvedValue({ data: settings(4) })
      renderPage()
      await loaded()
      await user.click(screen.getByRole('button', { name: 'Hapus sifat: ramah' }))
      const list = screen.getByRole('list', { name: 'Daftar sifat' })
      expect(within(list).queryByText('ramah')).not.toBeInTheDocument()
      await user.click(saveButton())
      await waitFor(() => expect(put).toHaveBeenCalled())
      expect((put.mock.calls[0]?.[1] as { data: BotSettings }).data.bot.persona?.traits).toEqual(['sabar'])
    })

    it('menolak butir lebih dari 200 karakter dengan pesan dan tanpa menambah', async () => {
      renderPage()
      await loaded()
      fireEvent.change(screen.getByLabelText('Tambah Topik Terlarang'), { target: { value: 'a'.repeat(201) } })
      fireEvent.click(screen.getByRole('button', { name: 'Tambah Topik Terlarang Baru' }))
      expect(screen.getByRole('alert')).toHaveTextContent('Maksimal 200 karakter')
      const list = screen.getByRole('list', { name: 'Daftar topik terlarang' })
      expect(within(list).getAllByRole('listitem')).toHaveLength(2)
      expect(saveButton()).toBeDisabled()
    })

    it('menolak butir kosong', async () => {
      const user = userEvent.setup()
      renderPage()
      await loaded()
      await user.type(screen.getByLabelText('Tambah Sifat'), '   ')
      await user.click(screen.getByRole('button', { name: 'Tambah Sifat Baru' }))
      expect(screen.getByRole('alert')).toHaveTextContent('Isi teks lebih dulu')
    })

    it('menolak penambahan melewati batas jumlah', async () => {
      const full = { ...settings(), data: { ...data, bot: { ...bot, persona: { ...bot.persona, traits: Array.from({ length: 10 }, (_, i) => `sifat ${i}`) } } } }
      route({ settings: () => Promise.resolve({ data: full }) })
      renderPage()
      await loaded()
      expect(screen.getByLabelText('Tambah Sifat')).toBeDisabled()
      expect(screen.getByRole('button', { name: 'Tambah Sifat Baru' })).toBeDisabled()
      expect(screen.getByText('10 dari 10 sifat')).toBeInTheDocument()
    })
  })

  it('konflik 409 menampilkan pesan muat ulang dan Muat Ulang mengambil versi terbaru', async () => {
    const user = userEvent.setup()
    put.mockRejectedValue(new ApiError(409, 'SETTINGS_CONFLICT', 'Pengaturan sudah diubah'))
    renderPage()
    await loaded()
    await user.type(screen.getByLabelText('Nama'), 'x')
    await user.click(saveButton())
    expect(await screen.findByText(/Pengaturan sudah diubah orang lain/)).toBeInTheDocument()
    const newer = { ...settings(5), data: { ...data, bot: { ...bot, persona: { ...bot.persona, name: 'Baru' } } } }
    route({ settings: () => Promise.resolve({ data: newer }) })
    await user.click(screen.getByRole('button', { name: 'Muat Ulang' }))
    await waitFor(() => expect(screen.getByLabelText('Nama')).toHaveValue('Baru'))
  })

  it('menampilkan galat 422 dari backend', async () => {
    const user = userEvent.setup()
    put.mockRejectedValue(new ApiError(422, 'VALIDATION_ERROR', 'Sifat tidak boleh kosong'))
    renderPage()
    await loaded()
    await user.type(screen.getByLabelText('Nama'), 'x')
    await user.click(saveButton())
    expect(await screen.findByText('Sifat tidak boleh kosong')).toBeInTheDocument()
  })

  describe('validasi klien', () => {
    it('overlap sama atau lebih besar dari ukuran potongan menampilkan galat dan mencegah simpan', async () => {
      const user = userEvent.setup()
      renderPage()
      await loaded()
      const overlap = screen.getByLabelText('Tumpang Tindih Potongan (karakter)')
      await user.clear(overlap)
      await user.type(overlap, '1500')
      expect(overlap).toHaveAccessibleDescription(/lebih kecil dari ukuran potongan/i)
      expect(screen.getAllByText(/lebih kecil dari ukuran potongan/i).length).toBeGreaterThan(0)
      await user.click(saveButton())
      expect(put).not.toHaveBeenCalled()
    })

    it('overlap yang lebih kecil dari ukuran potongan tidak bergalat', async () => {
      const user = userEvent.setup()
      renderPage()
      await loaded()
      const overlap = screen.getByLabelText('Tumpang Tindih Potongan (karakter)')
      await user.clear(overlap)
      await user.type(overlap, '1499')
      expect(screen.queryByText(/lebih kecil dari ukuran potongan/i)).not.toBeInTheDocument()
    })

    it('nama kosong dan angka di luar rentang mencegah simpan', async () => {
      const user = userEvent.setup()
      renderPage()
      await loaded()
      await user.clear(screen.getByLabelText('Nama'))
      expect(screen.getByText('Nama wajib diisi.')).toBeInTheDocument()
      await user.click(saveButton())
      expect(put).not.toHaveBeenCalled()
      await user.type(screen.getByLabelText('Nama'), 'Maia')
      const top = screen.getByLabelText('Jumlah Potongan Teratas')
      await user.clear(top)
      await user.type(top, '99')
      expect(screen.getByText(/antara 1 dan 50/)).toBeInTheDocument()
      await user.click(saveButton())
      expect(put).not.toHaveBeenCalled()
    })
  })

  describe('mode yang berlaku sekarang', () => {
    it('menampilkan mode efektif dari ringkasan knowledge', async () => {
      renderPage()
      await loaded()
      const status = await screen.findByText(/Mode yang berlaku sekarang/)
      expect(status.closest('[role="status"]')).toHaveTextContent('Seluruh dokumen')
    })

    it('galat ringkasan tidak menghalangi form', async () => {
      route({ summary: () => Promise.reject(new ApiError(500, 'X', 'x')) })
      renderPage()
      await loaded()
      expect(await screen.findByText(/belum bisa dimuat/i)).toBeInTheDocument()
      expect(screen.getByLabelText('Nama')).toBeEnabled()
    })
  })

  describe('muat awal', () => {
    it('menampilkan skeleton lalu form', async () => {
      renderPage()
      expect(screen.getByRole('status')).toHaveTextContent('Memuat pengaturan bot')
      await loaded()
    })

    it('galat muat menampilkan Coba Lagi yang memuat ulang', async () => {
      const user = userEvent.setup()
      route({ settings: () => Promise.reject(new ApiError(500, 'X', 'x')) })
      renderPage()
      expect(await screen.findByRole('alert')).toHaveTextContent('Server sedang bermasalah')
      expect(screen.queryByLabelText('Nama')).not.toBeInTheDocument()
      route()
      await user.click(screen.getByRole('button', { name: 'Coba Lagi' }))
      await loaded()
    })
  })

  describe('riwayat versi', () => {
    it('menampilkan versi, pengubah, catatan, tag pulih, dan menandai yang aktif', async () => {
      renderPage()
      await loaded()
      const table = await screen.findByRole('table', { name: 'Riwayat versi' })
      const rows = within(table).getAllByRole('row').slice(1)
      expect(rows).toHaveLength(3)
      expect(rows[0]).toHaveTextContent('3')
      expect(rows[0]).toHaveTextContent('Aktif')
      expect(rows[0]).toHaveTextContent('1111')
      expect(rows[0]).toHaveTextContent('naikkan top k')
      expect(rows[1]).not.toHaveTextContent('Aktif')
      expect(rows[1]).toHaveTextContent('Dipulihkan dari v1')
      expect(within(rows[0]!).getByRole('button', { name: 'Pulihkan versi 3' })).toBeDisabled()
      expect(within(rows[1]!).getByRole('button', { name: 'Pulihkan versi 2' })).toBeEnabled()
      expect(screen.getByRole('navigation', { name: 'Halaman riwayat versi' })).toHaveTextContent('Menampilkan 1-3 dari 3')
    })

    it('hanya ada satu tombol utama di halaman', async () => {
      renderPage()
      await loaded()
      await screen.findByRole('table', { name: 'Riwayat versi' })
      expect(document.querySelectorAll('.btn.pri')).toHaveLength(1)
    })

    it('pulihkan butuh konfirmasi yang menyebut nomor versi, lalu memanggil POST restore dengan catatan', async () => {
      const user = userEvent.setup()
      post.mockResolvedValue({ data: { ...settings(4), restored_from_version: 2 } })
      renderPage()
      await loaded()
      await user.click(await screen.findByRole('button', { name: 'Pulihkan versi 2' }))
      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveTextContent('Pulihkan ke versi 2?')
      expect(post).not.toHaveBeenCalled()
      await user.type(within(dialog).getByLabelText('Catatan (opsional)'), 'kembali ke yang lama')
      await user.click(within(dialog).getByRole('button', { name: 'Pulihkan' }))
      await waitFor(() => expect(post).toHaveBeenCalledWith('settings/versions/2/restore', { change_note: 'kembali ke yang lama' }))
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
      expect(await screen.findByText(/Versi 2 dipulihkan sebagai versi 4/)).toBeInTheDocument()
    })

    it('batal pada konfirmasi tidak memanggil endpoint', async () => {
      const user = userEvent.setup()
      renderPage()
      await loaded()
      await user.click(await screen.findByRole('button', { name: 'Pulihkan versi 1' }))
      await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Batal' }))
      expect(post).not.toHaveBeenCalled()
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('memperingatkan bahwa perubahan yang belum disimpan akan dibuang bila form kotor', async () => {
      const user = userEvent.setup()
      renderPage()
      await loaded()
      await user.click(await screen.findByRole('button', { name: 'Pulihkan versi 2' }))
      expect(within(screen.getByRole('dialog')).queryByText(/belum disimpan akan dibuang/i)).not.toBeInTheDocument()
      await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Batal' }))
      await user.type(screen.getByLabelText('Nama'), 'x')
      await user.click(screen.getByRole('button', { name: 'Pulihkan versi 2' }))
      expect(within(screen.getByRole('dialog')).getByText(/belum disimpan akan dibuang/i)).toBeInTheDocument()
    })

    it('setelah pulih, form memuat nilai baru', async () => {
      const user = userEvent.setup()
      const restored = { ...settings(4), data: { ...data, bot: { ...bot, persona: { ...bot.persona, name: 'Lama' } } }, restored_from_version: 2 }
      post.mockResolvedValue({ data: restored })
      renderPage()
      await loaded()
      await user.type(screen.getByLabelText('Nama'), 'x')
      await user.click(await screen.findByRole('button', { name: 'Pulihkan versi 2' }))
      await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Pulihkan' }))
      await waitFor(() => expect(screen.getByLabelText('Nama')).toHaveValue('Lama'))
      expect(saveButton()).toBeDisabled()
    })

    it('galat pulih tampil di dalam dialog dan dialog tetap terbuka', async () => {
      const user = userEvent.setup()
      post.mockRejectedValue(new ApiError(404, 'NOT_FOUND', 'Versi tidak ditemukan'))
      renderPage()
      await loaded()
      await user.click(await screen.findByRole('button', { name: 'Pulihkan versi 2' }))
      await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Pulihkan' }))
      expect(await within(screen.getByRole('dialog')).findByRole('alert')).toHaveTextContent('Versi tidak ditemukan')
    })
  })
})
