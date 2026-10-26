import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/api/errors'
import type { Schemas, SettingsOut } from '@/api/types'
import PlaygroundPage from './index'

const get = vi.fn()
const post = vi.fn()
vi.mock('@/api/client', () => ({ getHttp: () => ({ get, post, put: vi.fn(), patch: vi.fn(), delete: vi.fn() }) }))

type Reply = Schemas['PlaygroundResponse']

const settings = {
  version: 7,
  data: {
    bot: {
      system_prompt: 'Kamu adalah Maia.',
      persona: { name: 'Maia', role: 'CS', address_term: 'Kak', speaking_style: 'santai' },
      greeting: { web: 'Halo', whatsapp: 'Halo' },
      fallback_message: { web: 'Maaf', whatsapp: 'Maaf' },
      context_mode: 'auto',
      retrieval_top_k: 10,
      retrieval_threshold: 0.2,
    },
    model: { primary: 'claude-a', allowed_models: ['claude-a', 'claude-b'], max_tokens: 1024 },
    limits: { web: {}, whatsapp: {}, daily_cost_limit: null },
    whatsapp: {},
    web: {},
  },
} as unknown as SettingsOut

const reply = (over: Partial<Reply> = {}): Reply => ({
  text: 'Maharum menjual brand A dan B.',
  fallback_reason: null,
  sources: [
    { ref_no: 3, document_title: 'Katalog Brand', heading_path: 'Brand > Daftar', body: 'Brand A\nBrand B <b>tebal</b>' },
  ],
  mode: 'full_context',
  model: 'claude-a',
  usage: { input: 1200, output: 80, cache_read: 900, cache_write: 15 },
  cost: '0.0123',
  settings: 'active',
  ...over,
})

function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const user = userEvent.setup()
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <PlaygroundPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
  return user
}

async function ask(user: ReturnType<typeof userEvent.setup>, text: string) {
  await user.type(screen.getByLabelText('Pesan Uji'), text)
  await user.click(screen.getByRole('button', { name: 'Kirim' }))
}

describe('Halaman Playground', () => {
  beforeEach(() => {
    get.mockReset()
    post.mockReset()
    get.mockResolvedValue({ data: settings })
    post.mockResolvedValue({ data: reply() })
  })

  it('menampilkan keadaan awal dengan catatan biaya dan contoh pertanyaan yang mengisi input', async () => {
    const user = setup()
    expect(screen.getByText(/tidak masuk riwayat percakapan/i)).toBeInTheDocument()
    expect(screen.getByText(/menimbulkan biaya/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Brand apa saja yang dijual Maharum?' }))
    expect(screen.getByLabelText('Pesan Uji')).toHaveValue('Brand apa saja yang dijual Maharum?')
    expect(post).not.toHaveBeenCalled()
  })

  it('mengirim pesan dengan channel dan riwayat kosong lalu menampilkan balasan sebagai teks biasa', async () => {
    const user = setup()
    await ask(user, 'Brand apa saja?')
    expect(await screen.findByText('Maharum menjual brand A dan B.')).toBeInTheDocument()
    expect(post).toHaveBeenCalledTimes(1)
    expect(post).toHaveBeenCalledWith('playground/chat', { message: 'Brand apa saja?', channel: 'web', history: [] })
    expect(screen.getByLabelText('Pesan Uji')).toHaveValue('')
    expect(screen.getByText('Brand apa saja?')).toBeInTheDocument()
  })

  it('mengirim channel WhatsApp bila dipilih', async () => {
    const user = setup()
    await user.click(screen.getByRole('radio', { name: 'WhatsApp' }))
    await ask(user, 'Halo')
    await screen.findByText('Maharum menjual brand A dan B.')
    expect(post).toHaveBeenCalledWith('playground/chat', expect.objectContaining({ channel: 'whatsapp' }))
  })

  it('mengirim giliran sebelumnya sebagai riwayat pada pesan berikutnya', async () => {
    const user = setup()
    await ask(user, 'Pertanyaan satu')
    await screen.findByText('Maharum menjual brand A dan B.')
    post.mockResolvedValue({ data: reply({ text: 'Jawaban kedua' }) })
    await ask(user, 'Pertanyaan dua')
    await screen.findByText('Jawaban kedua')
    expect(post).toHaveBeenLastCalledWith('playground/chat', {
      message: 'Pertanyaan dua',
      channel: 'web',
      history: [
        { role: 'user', text: 'Pertanyaan satu' },
        { role: 'assistant', text: 'Maharum menjual brand A dan B.' },
      ],
    })
  })

  it('menampilkan indikator mengetik dan menonaktifkan Kirim selama menunggu', async () => {
    let resolve: (value: unknown) => void = () => undefined
    post.mockReturnValue(new Promise((r) => (resolve = r)))
    const user = setup()
    await ask(user, 'Halo')
    expect(screen.getByRole('status')).toHaveTextContent('Bot sedang mengetik...')
    expect(screen.getByRole('button', { name: /Kirim/ })).toBeDisabled()
    resolve({ data: reply({ text: 'Selesai' }) })
    expect(await screen.findByText('Selesai')).toBeInTheDocument()
    expect(screen.queryByText('Bot sedang mengetik...')).not.toBeInTheDocument()
  })

  it('mengirim dengan Enter dan membuat baris baru dengan Shift+Enter', async () => {
    const user = setup()
    const box = screen.getByLabelText('Pesan Uji')
    await user.type(box, 'baris satu{Shift>}{Enter}{/Shift}baris dua')
    expect(box).toHaveValue('baris satu\nbaris dua')
    expect(post).not.toHaveBeenCalled()
    await user.type(box, '{Enter}')
    await waitFor(() => expect(post).toHaveBeenCalledTimes(1))
    expect(post).toHaveBeenCalledWith('playground/chat', expect.objectContaining({ message: 'baris satu\nbaris dua' }))
  })

  it('menghitung sisa karakter dan menahan masukan di 2000 karakter', async () => {
    const user = setup()
    const box = screen.getByLabelText('Pesan Uji')
    expect(screen.getByText('Sisa 2.000 karakter')).toBeInTheDocument()
    fireEvent.change(box, { target: { value: 'a'.repeat(1990) } })
    expect(screen.getByText('Sisa 10 karakter')).toBeInTheDocument()
    await user.type(box, 'b'.repeat(15))
    expect((box as HTMLTextAreaElement).value).toHaveLength(2000)
    expect(screen.getByText('Sisa 0 karakter')).toBeInTheDocument()
  })

  it('tidak mengirim pesan kosong', () => {
    setup()
    expect(screen.getByRole('button', { name: 'Kirim' })).toBeDisabled()
  })

  it('mode tersimpan tidak mengirim settings', async () => {
    const user = setup()
    await ask(user, 'Halo')
    await screen.findByText('Maharum menjual brand A dan B.')
    const body = post.mock.calls[0]?.[1] as Record<string, unknown>
    expect('settings' in body).toBe(false)
    expect(screen.queryByText('Draf — tidak disimpan')).not.toBeInTheDocument()
  })

  it('mode draf mengirim seluruh pengaturan aktif dengan field yang ditimpa dan memberi lencana draf', async () => {
    post.mockResolvedValue({ data: reply({ settings: 'draft' }) })
    const user = setup()
    await user.click(await screen.findByRole('radio', { name: 'Draf (belum disimpan)' }))
    const prompt = await screen.findByLabelText('System Prompt')
    expect(prompt).toHaveValue('Kamu adalah Maia.')
    await user.clear(prompt)
    await user.type(prompt, 'Prompt baru')
    await user.clear(screen.getByLabelText('Nama Persona'))
    await user.type(screen.getByLabelText('Nama Persona'), 'Nara')
    await user.selectOptions(screen.getByLabelText('Mode Konteks'), 'retrieval')
    await user.selectOptions(screen.getByLabelText('Model Utama'), 'claude-b')
    fireEvent.change(screen.getByLabelText('Ambang Kemiripan'), { target: { value: '0.5' } })
    fireEvent.change(screen.getByLabelText('Jumlah Hasil Teratas'), { target: { value: '4' } })
    await ask(user, 'Halo')
    const badges = await screen.findAllByText('Draf — tidak disimpan')
    expect(badges.length).toBeGreaterThan(0)
    const body = post.mock.calls[0]?.[1] as { settings: typeof settings.data }
    expect(body.settings.bot.system_prompt).toBe('Prompt baru')
    expect(body.settings.bot.persona?.name).toBe('Nara')
    expect(body.settings.bot.persona?.role).toBe('CS')
    expect(body.settings.bot.context_mode).toBe('retrieval')
    expect(body.settings.bot.retrieval_threshold).toBe(0.5)
    expect(body.settings.bot.retrieval_top_k).toBe(4)
    expect(body.settings.model.primary).toBe('claude-b')
    expect(body.settings.model.allowed_models).toEqual(['claude-a', 'claude-b'])
    expect(body.settings.bot.greeting).toEqual(settings.data.bot.greeting)
  })

  it('Reset Draf mengembalikan editor ke salinan pengaturan aktif', async () => {
    const user = setup()
    await user.click(await screen.findByRole('radio', { name: 'Draf (belum disimpan)' }))
    const prompt = await screen.findByLabelText('System Prompt')
    await user.clear(prompt)
    await user.type(prompt, 'Berubah')
    await user.click(screen.getByRole('button', { name: 'Reset Draf' }))
    expect(screen.getByLabelText('System Prompt')).toHaveValue('Kamu adalah Maia.')
  })

  it('Dasar Jawaban menampilkan sumber yang bisa dibuka, mode, model, token, biaya, dan jenis pengaturan', async () => {
    const user = setup()
    await ask(user, 'Brand apa saja?')
    await screen.findByText('Maharum menjual brand A dan B.')
    const panel = screen.getByRole('region', { name: 'Dasar Jawaban' })
    expect(within(panel).getByText(/Katalog Brand › Brand > Daftar/)).toBeInTheDocument()
    expect(within(panel).getByText(/Ref 3/)).toBeInTheDocument()
    expect(within(panel).getByText(/Brand B <b>tebal<\/b>/)).toBeInTheDocument()
    expect(panel.querySelector('details')).not.toBeNull()
    expect(within(panel).getByText('Seluruh dokumen')).toBeInTheDocument()
    expect(within(panel).getByText('claude-a')).toBeInTheDocument()
    expect(within(panel).getByText('1.200')).toBeInTheDocument()
    expect(within(panel).getByText('80')).toBeInTheDocument()
    expect(within(panel).getByText('900')).toBeInTheDocument()
    expect(within(panel).getByText('15')).toBeInTheDocument()
    expect(within(panel).getByText('$0.0123')).toBeInTheDocument()
    expect(within(panel).getByText('Tersimpan')).toBeInTheDocument()
  })

  it('menjelaskan alasan fallback dengan label Indonesia dan menandai penolakan dari sisi sistem', async () => {
    post.mockResolvedValue({
      data: reply({ text: 'Maaf, saya belum bisa.', fallback_reason: 'low_score', sources: [], usage: null, cost: null, model: null }),
    })
    const user = setup()
    await ask(user, 'Berapa harga produk X?')
    await screen.findByText('Maaf, saya belum bisa.')
    const panel = screen.getByRole('region', { name: 'Dasar Jawaban' })
    expect(within(panel).getByText('Kemiripan terlalu rendah')).toBeInTheDocument()
    expect(within(panel).getByText(/penolakan dari sisi sistem/i)).toBeInTheDocument()
    expect(within(panel).queryByText(/Balasan tanpa sumber dokumen/)).not.toBeInTheDocument()
  })

  it('fallback not_in_document memakai label tanpa penjelasan sisi sistem', async () => {
    post.mockResolvedValue({ data: reply({ fallback_reason: 'not_in_document', sources: [] }) })
    const user = setup()
    await ask(user, 'x')
    await screen.findByText('Maharum menjual brand A dan B.')
    const panel = screen.getByRole('region', { name: 'Dasar Jawaban' })
    expect(within(panel).getByText('Tidak ada di dokumen')).toBeInTheDocument()
    expect(within(panel).queryByText(/penolakan dari sisi sistem/i)).not.toBeInTheDocument()
  })

  it('balasan tanpa sumber dan bukan fallback dijelaskan sebagai basa-basi', async () => {
    post.mockResolvedValue({ data: reply({ text: 'Halo juga!', sources: [], fallback_reason: null }) })
    const user = setup()
    await ask(user, 'Halo')
    await screen.findByText('Halo juga!')
    expect(screen.getByText('Balasan tanpa sumber dokumen (sapaan atau basa-basi)')).toBeInTheDocument()
  })

  it('klik balasan lain mengganti isi Dasar Jawaban', async () => {
    const user = setup()
    await ask(user, 'Satu')
    await screen.findByText('Maharum menjual brand A dan B.')
    post.mockResolvedValue({
      data: reply({ text: 'Balasan dua', sources: [{ ref_no: 9, document_title: 'Dokumen Dua', heading_path: 'Bab', body: 'isi' }], model: 'claude-b' }),
    })
    await ask(user, 'Dua')
    await screen.findByText('Balasan dua')
    const panel = screen.getByRole('region', { name: 'Dasar Jawaban' })
    expect(within(panel).getByText(/Dokumen Dua/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Maharum menjual brand A dan B\./ }))
    expect(within(panel).getByText(/Katalog Brand/)).toBeInTheDocument()
    expect(within(panel).queryByText(/Dokumen Dua/)).not.toBeInTheDocument()
  })

  it('galat mempertahankan pesan pelanggan dan Coba Lagi mengirim ulang', async () => {
    post.mockRejectedValueOnce(new ApiError(500, 'INTERNAL', 'boom'))
    const user = setup()
    await ask(user, 'Pesan yang gagal')
    expect(await screen.findByRole('alert')).toHaveTextContent('Server sedang bermasalah')
    expect(screen.getByText('Pesan yang gagal')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Coba Lagi' }))
    expect(await screen.findByText('Maharum menjual brand A dan B.')).toBeInTheDocument()
    expect(post).toHaveBeenCalledTimes(2)
    expect(post).toHaveBeenLastCalledWith('playground/chat', { message: 'Pesan yang gagal', channel: 'web', history: [] })
    expect(screen.getAllByText('Pesan yang gagal')).toHaveLength(1)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('Percakapan Baru mengosongkan percakapan dan riwayat', async () => {
    const user = setup()
    await ask(user, 'Satu')
    await screen.findByText('Maharum menjual brand A dan B.')
    await user.click(screen.getByRole('button', { name: 'Percakapan Baru' }))
    expect(screen.queryByText('Maharum menjual brand A dan B.')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Brand apa saja yang dijual Maharum?' })).toBeInTheDocument()
    await ask(user, 'Dua')
    await screen.findByText('Maharum menjual brand A dan B.')
    expect(post).toHaveBeenLastCalledWith('playground/chat', { message: 'Dua', channel: 'web', history: [] })
  })

  it('hanya satu tombol primer di halaman', async () => {
    setup()
    await screen.findByRole('radio', { name: 'Draf (belum disimpan)' })
    expect(document.querySelectorAll('.btn.pri')).toHaveLength(1)
  })
})
