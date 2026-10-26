import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/api/errors'
import PercakapanDetail from '@/pages/percakapan/detail'

const get = vi.fn()
const post = vi.fn()
vi.mock('@/api/client', () => ({ getHttp: () => ({ get, post }) }))

const ID = '0b9a6f0e-1111-4c1d-9c5b-aaaaaaaaaaaa'
const FULL = '628123456789'

const message = (over: Record<string, unknown> = {}) => ({
  id: 'm-1',
  role: 'user',
  text: 'Halo, berapa MOQ?',
  created_at: '2026-10-20T03:00:00Z',
  fallback_reason: null,
  sources: [],
  feedback: null,
  model: null,
  cost: null,
  input_tokens: null,
  output_tokens: null,
  delivery_status: null,
  kind: 'text',
  ...over,
})

const detail = (over: Record<string, unknown> = {}) => ({
  id: ID,
  channel: 'whatsapp',
  provider: 'meta',
  number_masked: '6281****789',
  contact_name: 'Budi Santoso',
  started_at: '2026-10-20T03:00:00Z',
  last_activity_at: '2026-10-20T04:30:00Z',
  messages: [
    message(),
    message({
      id: 'm-2',
      role: 'assistant',
      text: 'MOQ 1 kg.\nSilakan lihat daftar harga.',
      created_at: '2026-10-20T03:00:30Z',
      sources: [{ ref_no: 1, document_title: 'FAQ Produk', heading_path: 'Pemesanan > MOQ' }],
      feedback: 'up',
      model: 'claude-sonnet-5-5',
      cost: '0.00123',
      input_tokens: 800,
      output_tokens: 40,
      delivery_status: 'read',
    }),
    message({
      id: 'm-3',
      role: 'assistant',
      text: 'Maaf, itu di luar dokumen.',
      created_at: '2026-10-20T04:00:00Z',
      fallback_reason: 'forbidden_topic',
      feedback: 'down',
    }),
    message({ id: 'm-4', text: '[gambar]', kind: 'non_text', created_at: '2026-10-20T04:10:00Z' }),
    message({ id: 'm-5', text: '<img src=x onerror=alert(1)>', created_at: '2026-10-20T04:20:00Z' }),
  ],
  ...over,
})

function renderDetail(initial: unknown = { pathname: `/percakapan/${ID}`, state: { search: '?channel=whatsapp&hal=2' } }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const view = render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[initial as string]}>
        <Routes>
          <Route path="/percakapan" element={<p>DAFTAR</p>} />
          <Route path="/percakapan/:id" element={<PercakapanDetail />} />
          <Route path="/lain" element={<p>HALAMAN LAIN</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
  return { client, ...view }
}

describe('Percakapan (rincian)', () => {
  beforeEach(() => {
    get.mockReset()
    post.mockReset()
    get.mockResolvedValue({ data: detail() })
    post.mockResolvedValue({ data: { number: FULL } })
  })

  it('menampilkan header: channel, provider, nomor tersamar, nama kontak, dan waktu', async () => {
    renderDetail()
    expect(await screen.findByText('6281****789')).toBeInTheDocument()
    expect(get).toHaveBeenCalledWith(`conversations/${ID}`)
    expect(screen.getByText('WhatsApp')).toBeInTheDocument()
    expect(screen.getByText('Meta')).toBeInTheDocument()
    expect(screen.getByText('Budi Santoso')).toBeInTheDocument()
    expect(screen.getByText('Mulai')).toBeInTheDocument()
    expect(screen.getByText('Terakhir Aktif')).toBeInTheDocument()
    expect(document.body.textContent).not.toContain(ID)
  })

  it('transkrip: pelanggan dan bot berurutan dengan sumber, alasan fallback, feedback, model, biaya, token', async () => {
    renderDetail()
    const list = await screen.findByRole('list', { name: 'Transkrip percakapan' })
    const items = within(list).getAllByRole('listitem').filter((li) => li.classList.contains('cv-msg'))
    expect(items).toHaveLength(5)
    expect(items[0]).toHaveClass('cv-user')
    expect(within(items[0]!).getByText('Pelanggan')).toBeInTheDocument()

    const answer = items[1]!
    expect(answer).toHaveClass('cv-bot')
    expect(within(answer).getByText('Bot')).toBeInTheDocument()
    expect(answer.querySelector('.cv-text')?.textContent).toBe('MOQ 1 kg.\nSilakan lihat daftar harga.')
    expect(within(answer).getByText('Sumber')).toBeInTheDocument()
    expect(within(answer).getByText(/FAQ Produk › Pemesanan > MOQ/)).toBeInTheDocument()
    expect(within(answer).getByText('Jempol naik')).toBeInTheDocument()
    expect(within(answer).getByText(/claude-sonnet-5-5/)).toBeInTheDocument()
    expect(within(answer).getByText(/\$0\.0012/)).toBeInTheDocument()
    expect(within(answer).getByText(/800/)).toBeInTheDocument()
    expect(within(answer).getByText(/Dibaca/)).toBeInTheDocument()

    const fallback = items[2]!
    expect(within(fallback).getByText('Topik terlarang')).toHaveClass('t-warn')
    expect(within(fallback).getByText('Jempol turun')).toBeInTheDocument()
    expect(within(fallback).queryByText('Sumber')).not.toBeInTheDocument()

    expect(within(items[3]!).getByText('Pesan non-teks')).toBeInTheDocument()
  })

  it('merender isi pesan sebagai teks biasa, bukan HTML', async () => {
    const { container } = renderDetail()
    expect(await screen.findByText('<img src=x onerror=alert(1)>')).toBeInTheDocument()
    expect(container.querySelector('img')).toBeNull()
  })

  it('tombol Kembali ke Daftar membawa query string daftar sebelumnya', async () => {
    renderDetail()
    const link = await screen.findByRole('link', { name: 'Kembali ke Daftar' })
    expect(link).toHaveAttribute('href', '/percakapan?channel=whatsapp&hal=2')
  })

  it('tanpa state, Kembali ke Daftar menuju daftar polos', async () => {
    renderDetail(`/percakapan/${ID}`)
    expect(await screen.findByRole('link', { name: 'Kembali ke Daftar' })).toHaveAttribute('href', '/percakapan')
  })

  it('Tampilkan Nomor Lengkap meminta konfirmasi dulu, baru memanggil reveal-number', async () => {
    renderDetail()
    await screen.findByText('6281****789')
    await userEvent.click(screen.getByRole('button', { name: 'Tampilkan Nomor Lengkap' }))
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveTextContent(/audit/i)
    expect(post).not.toHaveBeenCalled()
    await userEvent.click(within(dialog).getByRole('button', { name: 'Tampilkan Nomor' }))
    expect(await screen.findByText(FULL)).toBeInTheDocument()
    expect(post).toHaveBeenCalledWith(`conversations/${ID}/reveal-number`)
    expect(screen.queryByText('6281****789')).not.toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('batal tidak memanggil reveal-number', async () => {
    renderDetail()
    await screen.findByText('6281****789')
    await userEvent.click(screen.getByRole('button', { name: 'Tampilkan Nomor Lengkap' }))
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Batal' }))
    expect(post).not.toHaveBeenCalled()
    expect(screen.getByText('6281****789')).toBeInTheDocument()
  })

  it('galat reveal-number tampil di dialog dan nomor tetap tersamar', async () => {
    post.mockRejectedValue(new ApiError(500, 'INTERNAL_ERROR', 'x'))
    renderDetail()
    await screen.findByText('6281****789')
    await userEvent.click(screen.getByRole('button', { name: 'Tampilkan Nomor Lengkap' }))
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Tampilkan Nomor' }))
    expect(await within(screen.getByRole('dialog')).findByRole('alert')).toHaveTextContent('Server sedang bermasalah')
    expect(screen.queryByText(FULL)).not.toBeInTheDocument()
  })

  it('nomor penuh tidak masuk cache query dan hilang saat berpindah halaman', async () => {
    const { client } = renderDetail()
    await screen.findByText('6281****789')
    await userEvent.click(screen.getByRole('button', { name: 'Tampilkan Nomor Lengkap' }))
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Tampilkan Nomor' }))
    await screen.findByText(FULL)
    expect(JSON.stringify(client.getQueryCache().getAll().map((q) => q.state.data))).not.toContain(FULL)
    expect(client.getMutationCache().getAll()).toHaveLength(0)
    expect(window.location.href).not.toContain(FULL)
  })

  it('percakapan tanpa nomor tidak menawarkan tombol tampilkan nomor', async () => {
    get.mockResolvedValue({ data: detail({ channel: 'web', provider: null, number_masked: null, contact_name: null }) })
    renderDetail()
    await screen.findByText('Web')
    expect(screen.queryByRole('button', { name: 'Tampilkan Nomor Lengkap' })).not.toBeInTheDocument()
  })

  it('404: EmptyState dengan tautan kembali', async () => {
    get.mockRejectedValue(new ApiError(404, 'NOT_FOUND', 'Percakapan tidak ditemukan'))
    renderDetail()
    expect(await screen.findByText('Percakapan tidak ditemukan.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Kembali ke Daftar' })).toHaveAttribute('href', '/percakapan?channel=whatsapp&hal=2')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('galat lain: pemberitahuan dengan Coba Lagi', async () => {
    get.mockRejectedValueOnce(new ApiError(500, 'INTERNAL_ERROR', 'x'))
    renderDetail()
    expect(await screen.findByRole('alert')).toHaveTextContent('Server sedang bermasalah')
    await userEvent.click(screen.getByRole('button', { name: 'Coba Lagi' }))
    expect(await screen.findByText('6281****789')).toBeInTheDocument()
  })

  it('memuat: skeleton dengan status untuk pembaca layar', async () => {
    get.mockReturnValue(new Promise(() => undefined))
    renderDetail()
    expect(screen.getByRole('status')).toHaveTextContent('Memuat percakapan...')
    await waitFor(() => expect(get).toHaveBeenCalled())
  })
})
