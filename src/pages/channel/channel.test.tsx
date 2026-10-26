import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/api/errors'
import ChannelPage from '@/pages/channel'

const get = vi.fn()
const post = vi.fn()
const put = vi.fn()
const del = vi.fn()
vi.mock('@/api/client', () => ({ getHttp: () => ({ get, post, put, patch: vi.fn(), delete: del }) }))

// Modul QR dipalsukan: matriks 3x3 dengan diagonal gelap, dan teks yang dikodekan dicatat.
const createQr = vi.hoisted(() => vi.fn())
vi.mock('qrcode', () => ({ default: { create: createQr } }))

const STATUS_URL = 'channels/whatsapp/status'
const QR_URL = 'channels/whatsapp/baileys/qr'

function settingsOut(overrides: { whatsapp?: Record<string, unknown>; web?: Record<string, unknown> } = {}) {
  return {
    version: 7,
    data: {
      bot: { name: 'Maia' },
      model: { primary: 'a' },
      limits: { daily_cost_limit: null },
      whatsapp: {
        provider: 'meta',
        bot_enabled: true,
        test_mode: false,
        allowlist: ['628111111111'],
        blocklist: ['628222222222'],
        operating_hours: {
          enabled: true,
          timezone: 'Asia/Jakarta',
          start: '08:00',
          end: '17:00',
          days: [1, 2, 3, 4, 5],
          outside_hours_message: 'Kami sedang tutup.',
        },
        show_sources: true,
        session_timeout_hours: 24,
        merge_delay_seconds: 3,
        non_text_reply: 'Maaf, saya hanya bisa membaca teks.',
        ignore_groups: true,
        phone_number_id: '1234567890',
        waba_id: '9876543210',
        graph_api_version: 'v21.0',
        ...overrides.whatsapp,
      },
      web: { allowed_origins: ['https://maharum.example'], ...overrides.web },
    },
    changed_by_nip: null,
    change_note: null,
    restored_from_version: null,
    created_at: null,
  }
}

function statusOut(overrides: Record<string, unknown> = {}) {
  return {
    provider: 'meta',
    baileys: { configured: true, state: null, last_error: null, updated_at: null },
    bot_enabled: true,
    test_mode: false,
    phone_number_id_set: true,
    waba_id_set: false,
    secrets: { meta_access_token: true, meta_app_secret: false, meta_verify_token: true },
    ...overrides,
  }
}

const baileysStatus = (state: string | null, extra: Record<string, unknown> = {}) =>
  statusOut({
    provider: 'baileys',
    baileys: { configured: true, state, last_error: null, updated_at: '2026-10-24T03:00:00+00:00' },
    ...extra,
  })

interface Fixture {
  settings?: ReturnType<typeof settingsOut>
  status?: Record<string, unknown>
  qr?: string | null
}

function mockApi({ settings = settingsOut(), status = statusOut(), qr = null }: Fixture = {}) {
  get.mockImplementation((path: string) => {
    if (path === 'settings') return Promise.resolve({ data: settings })
    if (path === STATUS_URL) return Promise.resolve({ data: status })
    if (path === QR_URL) return Promise.resolve({ data: { qr } })
    return Promise.reject(new Error(`GET tak terduga: ${path}`))
  })
}

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <ChannelPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

const callsTo = (url: string) => get.mock.calls.filter(([path]) => path === url).length

async function ready() {
  await screen.findByRole('heading', { name: 'Web Widget' })
}

const statusCard = () => screen.getByRole('region', { name: 'Status Sambungan' })

beforeEach(() => {
  get.mockReset()
  post.mockReset()
  put.mockReset()
  del.mockReset()
  createQr.mockReset()
  createQr.mockImplementation(() => ({ modules: { size: 3, get: (row: number, col: number) => (row === col ? 1 : 0) } }))
})

afterEach(() => {
  vi.useRealTimers()
})

describe('Halaman Channel: memuat', () => {
  it('menampilkan skeleton saat muat pertama', () => {
    get.mockReturnValue(new Promise(() => undefined))
    renderPage()
    expect(screen.getByText('Memuat pengaturan channel...')).toBeInTheDocument()
  })

  it('galat muat tampil dengan Coba Lagi yang memuat ulang', async () => {
    const user = userEvent.setup()
    get.mockImplementation((path: string) =>
      path === 'settings' ? Promise.reject(new ApiError(500, 'X', 'x')) : Promise.resolve({ data: statusOut() }),
    )
    renderPage()
    expect(await screen.findByRole('alert')).toHaveTextContent('Server sedang bermasalah')
    mockApi()
    await user.click(screen.getByRole('button', { name: 'Coba Lagi' }))
    await ready()
  })
})

describe('Halaman Channel: pengaturan', () => {
  it('mengisi form dari pengaturan aktif', async () => {
    mockApi()
    renderPage()
    await ready()
    expect(screen.getByText('https://maharum.example')).toBeInTheDocument()
    expect(screen.getByLabelText('Provider')).toHaveValue('meta')
    expect(screen.getByRole('switch', { name: 'Bot Aktif' })).toBeChecked()
    expect(screen.getByRole('switch', { name: 'Mode Uji' })).not.toBeChecked()
    expect(screen.getByText('628111111111')).toBeInTheDocument()
    expect(screen.getByText('628222222222')).toBeInTheDocument()
    expect(screen.getByLabelText('Zona Waktu')).toHaveValue('Asia/Jakarta')
    expect(screen.getByLabelText('Mulai')).toHaveValue('08:00')
    expect(screen.getByLabelText('Selesai')).toHaveValue('17:00')
    expect(screen.getByRole('checkbox', { name: 'Senin' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Sabtu' })).not.toBeChecked()
    expect(screen.getByLabelText('Pesan di Luar Jam Operasional')).toHaveValue('Kami sedang tutup.')
    expect(screen.getByLabelText('Batas Sesi (Jam)')).toHaveValue(24)
    expect(screen.getByLabelText('Jeda Gabung Pesan (Detik)')).toHaveValue(3)
    expect(screen.getByLabelText('Phone Number ID')).toHaveValue('1234567890')
    expect(screen.getByLabelText('WABA ID')).toHaveValue('9876543210')
    expect(screen.getByLabelText('Versi Graph API')).toHaveValue('v21.0')
    expect(screen.getByRole('button', { name: 'Simpan Perubahan' })).toBeDisabled()
  })

  it('menyimpan hanya web dan whatsapp dengan base_version yang benar', async () => {
    const user = userEvent.setup()
    const original = settingsOut()
    mockApi({ settings: original })
    put.mockResolvedValue({ data: { ...original, version: 8 } })
    renderPage()
    await ready()

    await user.type(screen.getByLabelText('Domain yang Diizinkan'), 'https://toko.example/')
    await user.click(screen.getByRole('button', { name: 'Tambah Domain' }))
    await user.click(screen.getByRole('switch', { name: 'Mode Uji' }))
    await user.click(screen.getByRole('button', { name: 'Simpan Perubahan' }))

    await waitFor(() => expect(put).toHaveBeenCalledTimes(1))
    const [url, body] = put.mock.calls[0] as [string, { base_version: number; data: Record<string, unknown> }]
    expect(url).toBe('settings')
    expect(body.base_version).toBe(7)
    expect(body.data.bot).toEqual(original.data.bot)
    expect(body.data.model).toEqual(original.data.model)
    expect(body.data.limits).toEqual(original.data.limits)
    expect(body.data.web).toEqual({ allowed_origins: ['https://maharum.example', 'https://toko.example'] })
    expect(body.data.whatsapp).toEqual({ ...original.data.whatsapp, test_mode: true })
    expect(await screen.findByText(/Pengaturan tersimpan/)).toBeInTheDocument()
  })

  it('menolak origin yang bukan http(s)://host tanpa path atau wildcard', async () => {
    const user = userEvent.setup()
    mockApi()
    renderPage()
    await ready()
    const input = screen.getByLabelText('Domain yang Diizinkan')
    for (const bad of ['https://toko.example/path', 'https://*.example', 'ftp://toko.example', 'toko.example']) {
      await user.clear(input)
      await user.type(input, bad)
      await user.click(screen.getByRole('button', { name: 'Tambah Domain' }))
      expect(await screen.findByText(/Origin harus berbentuk/)).toBeInTheDocument()
      expect(screen.queryByText(bad)).not.toBeInTheDocument()
    }
    expect(screen.getByRole('button', { name: 'Simpan Perubahan' })).toBeDisabled()
  })

  it('menolak origin ganda dan bisa menghapus origin', async () => {
    const user = userEvent.setup()
    mockApi()
    renderPage()
    await ready()
    await user.type(screen.getByLabelText('Domain yang Diizinkan'), 'https://maharum.example{Enter}')
    expect(await screen.findByText('Entri ini sudah ada di daftar.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Hapus https://maharum.example' }))
    expect(screen.queryByText('https://maharum.example')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Simpan Perubahan' })).toBeEnabled()
  })

  it('menjelaskan bahwa cuplikan widget dibangun di milestone 8', async () => {
    mockApi()
    renderPage()
    await ready()
    expect(screen.getByText(/milestone 8/)).toBeInTheDocument()
  })

  it('nomor allowlist dinormalkan ke digit dan divalidasi 8 sampai 15 digit', async () => {
    const user = userEvent.setup()
    mockApi()
    renderPage()
    await ready()
    const input = screen.getByLabelText('Allowlist')
    await user.type(input, '12345')
    await user.click(screen.getByRole('button', { name: 'Tambah ke Allowlist' }))
    expect(await screen.findByText('Nomor harus 8 sampai 15 digit dengan kode negara.')).toBeInTheDocument()

    await user.clear(input)
    await user.type(input, '+62 812-3456-7890')
    await user.click(screen.getByRole('button', { name: 'Tambah ke Allowlist' }))
    expect(await screen.findByText('6281234567890')).toBeInTheDocument()
    expect(screen.queryByText('Nomor harus 8 sampai 15 digit dengan kode negara.')).not.toBeInTheDocument()

    await user.type(screen.getByLabelText('Blocklist'), '1234567890123456')
    await user.click(screen.getByRole('button', { name: 'Tambah ke Blocklist' }))
    expect(await screen.findByText('Nomor harus 8 sampai 15 digit dengan kode negara.')).toBeInTheDocument()
  })

  it('peringatan Baileys hanya muncul saat provider baileys', async () => {
    const user = userEvent.setup()
    mockApi()
    renderPage()
    await ready()
    expect(screen.queryByText(/library tidak resmi/)).not.toBeInTheDocument()
    await user.selectOptions(screen.getByLabelText('Provider'), 'baileys')
    const warning = screen.getByText(/library tidak resmi/)
    expect(warning.closest('.notice')).toHaveClass('warn')
    expect(warning).toHaveTextContent(/diblokir WhatsApp/)
    expect(warning).toHaveTextContent(/Meta disarankan/)
    await user.selectOptions(screen.getByLabelText('Provider'), 'meta')
    expect(screen.queryByText(/library tidak resmi/)).not.toBeInTheDocument()
  })

  it('catatan allowlist tampil hanya saat mode uji aktif', async () => {
    const user = userEvent.setup()
    mockApi()
    renderPage()
    await ready()
    expect(screen.queryByText('Bot hanya menjawab nomor di allowlist.')).not.toBeInTheDocument()
    await user.click(screen.getByRole('switch', { name: 'Mode Uji' }))
    expect(screen.getByText('Bot hanya menjawab nomor di allowlist.')).toBeInTheDocument()
  })

  it('hari operasional memakai angka 1 sampai 7 dan tersimpan terurut', async () => {
    const user = userEvent.setup()
    const original = settingsOut()
    mockApi({ settings: original })
    put.mockResolvedValue({ data: { ...original, version: 8 } })
    renderPage()
    await ready()
    await user.click(screen.getByRole('checkbox', { name: 'Minggu' }))
    await user.click(screen.getByRole('checkbox', { name: 'Selasa' }))
    await user.click(screen.getByRole('button', { name: 'Simpan Perubahan' }))
    await waitFor(() => expect(put).toHaveBeenCalled())
    const body = put.mock.calls[0]?.[1] as { data: { whatsapp: { operating_hours: { days: number[] } } } }
    expect(body.data.whatsapp.operating_hours.days).toEqual([1, 3, 4, 5, 7])
  })

  it('nilai di luar batas menahan simpan dan menampilkan galat', async () => {
    const user = userEvent.setup()
    mockApi()
    renderPage()
    await ready()
    const field = screen.getByLabelText('Batas Sesi (Jam)')
    await user.clear(field)
    await user.type(field, '1000')
    await user.click(screen.getByRole('button', { name: 'Simpan Perubahan' }))
    expect(put).not.toHaveBeenCalled()
    expect(await screen.findByText('Batas sesi harus bilangan bulat 1 sampai 720.')).toBeInTheDocument()
  })

  it('format versi Graph API dan jam divalidasi sebelum simpan', async () => {
    const user = userEvent.setup()
    mockApi()
    renderPage()
    await ready()
    const version = screen.getByLabelText('Versi Graph API')
    await user.clear(version)
    await user.type(version, '21')
    await user.click(screen.getByRole('button', { name: 'Simpan Perubahan' }))
    expect(put).not.toHaveBeenCalled()
    expect(await screen.findByText('Versi Graph API harus berbentuk v21.0.')).toBeInTheDocument()
  })

  it('Batalkan Perubahan mengembalikan nilai awal', async () => {
    const user = userEvent.setup()
    mockApi()
    renderPage()
    await ready()
    await user.click(screen.getByRole('switch', { name: 'Bot Aktif' }))
    expect(screen.getByRole('switch', { name: 'Bot Aktif' })).not.toBeChecked()
    await user.click(screen.getByRole('button', { name: 'Batalkan Perubahan' }))
    expect(screen.getByRole('switch', { name: 'Bot Aktif' })).toBeChecked()
  })

  it('hanya satu tombol utama di halaman', async () => {
    mockApi({ status: baileysStatus('connected') })
    const { container } = renderPage()
    await ready()
    await screen.findByRole('heading', { name: 'Koneksi Baileys' })
    expect(container.querySelectorAll('.btn.pri')).toHaveLength(1)
  })
})

describe('Halaman Channel: status sambungan', () => {
  it('menampilkan provider, bot, mode uji, dan secret sebagai terisi atau belum tanpa nilai', async () => {
    mockApi({ status: statusOut({ test_mode: true, rogue: 'RAHASIA-123', secrets: { meta_access_token: true, meta_app_secret: false, meta_verify_token: true, token_value: 'RAHASIA-456' } }) })
    renderPage()
    await ready()
    const card = within(await screen.findByRole('region', { name: 'Status Sambungan' }))
    await card.findByText('Meta')
    expect(card.getByText('Hidup')).toBeInTheDocument()
    expect(card.getByText('Aktif')).toBeInTheDocument()
    const token = card.getByText('Token Akses Meta').closest('li')
    expect(token).toHaveTextContent('Terisi')
    expect(card.getByText('App Secret Meta').closest('li')).toHaveTextContent('Belum diisi')
    expect(card.getByText('Verify Token Meta').closest('li')).toHaveTextContent('Terisi')
    expect(card.getByText('Phone Number ID').closest('li')).toHaveTextContent('Terisi')
    expect(card.getByText('WABA ID').closest('li')).toHaveTextContent('Belum diisi')
    expect(document.body.textContent).not.toContain('RAHASIA')
  })

  it('bot mati tampil sebagai Mati', async () => {
    mockApi({ status: statusOut({ bot_enabled: false }) })
    renderPage()
    await ready()
    const card = within(await screen.findByRole('region', { name: 'Status Sambungan' }))
    expect(await card.findByText('Mati')).toBeInTheDocument()
  })

  it('Muat Ulang mengambil status lagi', async () => {
    const user = userEvent.setup()
    mockApi()
    renderPage()
    await ready()
    await within(await screen.findByRole('region', { name: 'Status Sambungan' })).findByText('Meta')
    expect(callsTo(STATUS_URL)).toBe(1)
    await user.click(within(statusCard()).getByRole('button', { name: 'Muat Ulang' }))
    await waitFor(() => expect(callsTo(STATUS_URL)).toBe(2))
  })

  it('galat status tampil dengan Coba Lagi dan tidak menghalangi form', async () => {
    const user = userEvent.setup()
    mockApi()
    get.mockImplementation((path: string) => {
      if (path === 'settings') return Promise.resolve({ data: settingsOut() })
      return Promise.reject(new ApiError(500, 'X', 'x'))
    })
    renderPage()
    await ready()
    const card = within(await screen.findByRole('region', { name: 'Status Sambungan' }))
    expect(await card.findByRole('alert')).toHaveTextContent('Server sedang bermasalah')
    mockApi()
    await user.click(card.getByRole('button', { name: 'Coba Lagi' }))
    expect(await card.findByText('Meta')).toBeInTheDocument()
  })

  it('refetch otomatis tiap 5 detik saat baileys belum terhubung dan berhenti saat unmount', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'] })
    mockApi({ status: baileysStatus('disconnected') })
    const { unmount } = renderPage()
    await act(() => vi.advanceTimersByTimeAsync(50))
    expect(callsTo(STATUS_URL)).toBe(1)
    await act(() => vi.advanceTimersByTimeAsync(5000))
    expect(callsTo(STATUS_URL)).toBe(2)
    await act(() => vi.advanceTimersByTimeAsync(5000))
    expect(callsTo(STATUS_URL)).toBe(3)
    unmount()
    await act(() => vi.advanceTimersByTimeAsync(20000))
    expect(callsTo(STATUS_URL)).toBe(3)
  })

  it('tidak refetch otomatis saat baileys sudah terhubung atau provider meta', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'] })
    mockApi({ status: baileysStatus('connected') })
    renderPage()
    await act(() => vi.advanceTimersByTimeAsync(50))
    await act(() => vi.advanceTimersByTimeAsync(15000))
    expect(callsTo(STATUS_URL)).toBe(1)
  })

  it('setelah simpan, status dimuat ulang', async () => {
    const user = userEvent.setup()
    const original = settingsOut()
    mockApi({ settings: original })
    put.mockResolvedValue({ data: { ...original, version: 8 } })
    renderPage()
    await ready()
    await within(await screen.findByRole('region', { name: 'Status Sambungan' })).findByText('Meta')
    await user.click(screen.getByRole('switch', { name: 'Bot Aktif' }))
    await user.click(screen.getByRole('button', { name: 'Simpan Perubahan' }))
    await waitFor(() => expect(callsTo(STATUS_URL)).toBe(2))
  })
})

describe('Halaman Channel: panel Meta', () => {
  it('tampil untuk meta dan tidak menampilkan panel Baileys', async () => {
    mockApi()
    renderPage()
    expect(await screen.findByRole('heading', { name: 'Koneksi Meta' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Koneksi Baileys' })).not.toBeInTheDocument()
  })

  it('Tes Koneksi menampilkan nama terverifikasi dan nomor tampilan', async () => {
    const user = userEvent.setup()
    mockApi()
    post.mockResolvedValue({ data: { ok: true, verified_name: 'Maharum Group', display_phone_number: '+62 811-1111-1111' } })
    renderPage()
    await user.click(await screen.findByRole('button', { name: 'Tes Koneksi' }))
    expect(post).toHaveBeenCalledWith('channels/whatsapp/meta/test')
    const result = await screen.findByRole('status')
    expect(result).toHaveTextContent('Maharum Group')
    expect(result).toHaveTextContent('+62 811-1111-1111')
  })

  it('Tes Koneksi gagal menampilkan status dan kode saja', async () => {
    const user = userEvent.setup()
    mockApi()
    post.mockResolvedValue({ data: { ok: false, status: 401, code: 190 } })
    renderPage()
    await user.click(await screen.findByRole('button', { name: 'Tes Koneksi' }))
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('401')
    expect(alert).toHaveTextContent('190')
  })

  it('galat permintaan tes ditampilkan sebagai galat', async () => {
    const user = userEvent.setup()
    mockApi()
    post.mockRejectedValue(new ApiError(500, 'X', 'x'))
    renderPage()
    await user.click(await screen.findByRole('button', { name: 'Tes Koneksi' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Server sedang bermasalah')
  })
})

describe('Halaman Channel: panel Baileys', () => {
  async function openBaileys(state: string | null = 'disconnected', extra: Record<string, unknown> = {}, qr: string | null = null) {
    mockApi({ status: baileysStatus(state, extra), qr })
    const view = renderPage()
    await screen.findByRole('heading', { name: 'Koneksi Baileys' })
    return view
  }

  it('tampil untuk baileys dan tidak menampilkan panel Meta', async () => {
    await openBaileys()
    expect(screen.queryByRole('heading', { name: 'Koneksi Meta' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Tes Koneksi' })).not.toBeInTheDocument()
  })

  it.each([
    ['connected', 'Terhubung', 't-ok'],
    ['disconnected', 'Terputus', 't-warn'],
    ['error', 'Galat', 't-bad'],
    [null, 'Belum ada laporan', 't-mut'],
  ])('status koneksi %s tampil sebagai %s', async (state, label, cls) => {
    await openBaileys(state)
    const panel = screen.getByRole('region', { name: 'Koneksi Baileys' })
    expect(within(panel).getByText(label)).toHaveClass(cls)
  })

  it('menampilkan last_error', async () => {
    await openBaileys('error', { baileys: { configured: true, state: 'error', last_error: 'socket ditutup', updated_at: null } })
    expect(screen.getByText(/socket ditutup/)).toBeInTheDocument()
  })

  it('petunjuk BAILEYS_URL bila belum dikonfigurasi dan aksi dinonaktifkan', async () => {
    await openBaileys(null, { baileys: { configured: false, state: null, last_error: null, updated_at: null } })
    expect(screen.getByText(/BAILEYS_URL/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tampilkan QR' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Sambung Ulang' })).toBeDisabled()
  })

  it('QR dirender dari string dan polling berhenti saat ditutup', async () => {
    await openBaileys('disconnected', {}, 'QR-STRING-1')
    await within(await screen.findByRole('region', { name: 'Status Sambungan' })).findByText('Baileys')
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'] })

    fireEvent.click(screen.getByRole('button', { name: 'Tampilkan QR' }))
    await act(() => vi.advanceTimersByTimeAsync(0))
    expect(callsTo(QR_URL)).toBe(1)
    expect(createQr).toHaveBeenCalledWith('QR-STRING-1', expect.anything())
    const image = screen.getByRole('img', { name: 'Kode QR untuk menautkan WhatsApp' })
    expect(image).toBeInTheDocument()
    expect(screen.getByText(/Perangkat tertaut/)).toBeInTheDocument()

    await act(() => vi.advanceTimersByTimeAsync(3000))
    expect(callsTo(QR_URL)).toBe(2)
    await act(() => vi.advanceTimersByTimeAsync(3000))
    expect(callsTo(QR_URL)).toBe(3)

    fireEvent.click(screen.getByRole('button', { name: 'Tutup QR' }))
    expect(screen.queryByRole('img', { name: 'Kode QR untuk menautkan WhatsApp' })).not.toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(12000))
    expect(callsTo(QR_URL)).toBe(3)
  })

  it('polling QR berhenti saat halaman dilepas', async () => {
    const { unmount } = await openBaileys('disconnected', {}, 'QR-STRING-1')
    await within(await screen.findByRole('region', { name: 'Status Sambungan' })).findByText('Baileys')
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'] })
    fireEvent.click(screen.getByRole('button', { name: 'Tampilkan QR' }))
    await act(() => vi.advanceTimersByTimeAsync(0))
    expect(callsTo(QR_URL)).toBe(1)
    unmount()
    await act(() => vi.advanceTimersByTimeAsync(12000))
    expect(callsTo(QR_URL)).toBe(1)
  })

  it('tanpa QR menampilkan penjelasan', async () => {
    const user = userEvent.setup()
    await openBaileys('connected', {}, null)
    await user.click(screen.getByRole('button', { name: 'Tampilkan QR' }))
    expect(await screen.findByText('Tidak ada QR. Sudah terhubung atau menunggu sambungan.')).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: 'Kode QR untuk menautkan WhatsApp' })).not.toBeInTheDocument()
  })

  it('galat mengambil QR ditampilkan', async () => {
    const user = userEvent.setup()
    mockApi({ status: baileysStatus('disconnected') })
    get.mockImplementation((path: string) => {
      if (path === QR_URL) return Promise.reject(new ApiError(503, 'X', 'x'))
      if (path === STATUS_URL) return Promise.resolve({ data: baileysStatus('disconnected') })
      return Promise.resolve({ data: settingsOut() })
    })
    renderPage()
    await user.click(await screen.findByRole('button', { name: 'Tampilkan QR' }))
    expect(await screen.findByText('Server sedang bermasalah. Coba lagi sebentar lagi.')).toBeInTheDocument()
  })

  it('kode pairing butuh nomor berupa digit, lalu tampil dengan peringatan dan hilang saat ditutup', async () => {
    const user = userEvent.setup()
    await openBaileys()
    post.mockResolvedValue({ data: { code: 'ABCD-1234' } })
    await user.click(screen.getByRole('button', { name: 'Pakai Kode Pairing' }))

    const input = screen.getByLabelText('Nomor WhatsApp')
    await user.type(input, 'abc')
    await user.click(screen.getByRole('button', { name: 'Buat Kode' }))
    expect(post).not.toHaveBeenCalled()
    expect(await screen.findByText('Nomor harus 6 sampai 20 digit dengan kode negara.')).toBeInTheDocument()

    await user.clear(input)
    await user.type(input, '+62 811-1111-1111')
    await user.click(screen.getByRole('button', { name: 'Buat Kode' }))
    await waitFor(() => expect(post).toHaveBeenCalledWith('channels/whatsapp/baileys/pairing-code', { phone: '6281111111111' }))
    expect(await screen.findByText('ABCD-1234')).toBeInTheDocument()
    expect(screen.getByText(/jangan bagikan/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Tutup Kode Pairing' }))
    expect(screen.queryByText('ABCD-1234')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Pakai Kode Pairing' }))
    expect(screen.queryByText('ABCD-1234')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Nomor WhatsApp')).toHaveValue('')
  })

  it('galat membuat kode pairing ditampilkan', async () => {
    const user = userEvent.setup()
    await openBaileys()
    post.mockRejectedValue(new ApiError(502, 'BAILEYS_ERROR', 'Service Baileys menolak atau tidak bisa dihubungi'))
    await user.click(screen.getByRole('button', { name: 'Pakai Kode Pairing' }))
    await user.type(screen.getByLabelText('Nomor WhatsApp'), '628111111111')
    await user.click(screen.getByRole('button', { name: 'Buat Kode' }))
    expect(await screen.findByText('Service Baileys menolak atau tidak bisa dihubungi')).toBeInTheDocument()
  })

  it('Sambung Ulang butuh konfirmasi lalu memanggil endpoint reconnect', async () => {
    const user = userEvent.setup()
    await openBaileys()
    post.mockResolvedValue({ data: { status: 'accepted' } })
    await user.click(screen.getByRole('button', { name: 'Sambung Ulang' }))
    expect(post).not.toHaveBeenCalled()
    const dialog = screen.getByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'Sambung Ulang' }))
    await waitFor(() => expect(post).toHaveBeenCalledWith('channels/whatsapp/baileys/reconnect'))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(await screen.findByText(/Permintaan sambung ulang diterima/)).toBeInTheDocument()
  })

  it('Keluarkan Perangkat menjelaskan akibatnya, bisa dibatalkan, dan memanggil logout setelah konfirmasi', async () => {
    const user = userEvent.setup()
    await openBaileys('connected')
    post.mockResolvedValue({ data: { status: 'accepted' } })
    const trigger = screen.getByRole('button', { name: 'Keluarkan Perangkat' })
    expect(trigger).toHaveClass('bad')
    await user.click(trigger)
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveTextContent(/menghapus sesi/)
    expect(dialog).toHaveTextContent(/memindai QR lagi/)
    await user.click(within(dialog).getByRole('button', { name: 'Batal' }))
    expect(post).not.toHaveBeenCalled()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Keluarkan Perangkat' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Keluarkan Perangkat' }))
    await waitFor(() => expect(post).toHaveBeenCalledWith('channels/whatsapp/baileys/logout'))
    expect(await screen.findByText(/Perangkat dikeluarkan/)).toBeInTheDocument()
  })

  it('galat logout ditampilkan di dialog dan dialog tetap terbuka', async () => {
    const user = userEvent.setup()
    await openBaileys('connected')
    post.mockRejectedValue(new ApiError(502, 'BAILEYS_ERROR', 'Service Baileys menolak atau tidak bisa dihubungi'))
    await user.click(screen.getByRole('button', { name: 'Keluarkan Perangkat' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Keluarkan Perangkat' }))
    const dialog = screen.getByRole('dialog')
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('Service Baileys menolak')
  })
})
