import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/api/errors'
import type { Schemas } from '@/api/types'
import KnowledgePage from '@/pages/knowledge'

const get = vi.fn()
const post = vi.fn()
const patch = vi.fn()
const del = vi.fn()
vi.mock('@/api/client', () => ({ getHttp: () => ({ get, post, put: vi.fn(), patch, delete: del }) }))

type Doc = Schemas['DocumentOut']
type Summary = Schemas['app__api__v1__knowledge__SummaryOut']

const ID1 = '11111111-1111-4111-8111-111111111111'
const ID2 = '22222222-2222-4222-8222-222222222222'
const ID3 = '33333333-3333-4333-8333-333333333333'

const doc = (over: Partial<Doc> = {}): Doc => ({
  id: ID1,
  title: 'Kebijakan Cuti',
  original_filename: 'cuti.md',
  size_bytes: 2048,
  token_count: 1234,
  content_sha256: 'abc',
  version: 1,
  status: 'ready',
  error_message: null,
  section_count: 7,
  is_active: true,
  uploaded_by_nip: '1',
  created_at: '2026-10-01T03:00:00Z',
  updated_at: '2026-10-02T03:00:00Z',
  ...over,
})

const summary = (over: Partial<Summary> = {}): Summary => ({
  active_documents: 3,
  inactive_documents: 1,
  processing_documents: 0,
  failed_documents: 0,
  active_tokens: 45678,
  configured_mode: 'auto',
  effective_mode: 'full_context',
  full_context_max_tokens: 80000,
  ...over,
})

let docs: Doc[] = []
let total = 0

function route(url: string) {
  if (url === 'knowledge/summary') return summary()
  if (url === 'knowledge/documents') return { items: docs, total, limit: 20, offset: 0 }
  if (url === `knowledge/documents/${ID1}`) return doc()
  if (url === `knowledge/documents/${ID1}/content`) return { id: ID1, title: 'Kebijakan Cuti', original_filename: 'cuti.md', content: '# Cuti\n<script>alert(1)</script>\nIsi asli' }
  if (url === `knowledge/documents/${ID1}/sections`)
    return {
      items: [
        { id: 's1', ref_no: 1, position: 0, heading_path: 'Cuti > Tahunan', body: 'Cuti tahunan 12 hari.', token_count: 21 },
        { id: 's2', ref_no: 2, position: 1, heading_path: 'Cuti > Sakit', body: 'Cuti sakit perlu surat.', token_count: 18 },
      ],
      total: 2,
      limit: 20,
      offset: 0,
    }
  throw new Error('url tak terduga: ' + url)
}

function Where() {
  const location = useLocation()
  return <output data-testid="where">{location.search}</output>
}

function renderPage(entry = '/knowledge') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[entry]}>
        <KnowledgePage />
        <Where />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

const listCalls = () => get.mock.calls.filter((call) => call[0] === 'knowledge/documents')

beforeEach(() => {
  docs = [doc(), doc({ id: ID2, title: 'Panduan Gaji', original_filename: 'gaji.txt', status: 'processing', token_count: 99, section_count: 0, is_active: false }), doc({ id: ID3, title: 'Rusak', original_filename: 'rusak.md', status: 'failed', error_message: 'Gagal memecah dokumen', token_count: 0, section_count: 0 })]
  total = 3
  get.mockReset()
  post.mockReset()
  patch.mockReset()
  del.mockReset()
  get.mockImplementation((url: string) => Promise.resolve({ data: route(url) }))
})

afterEach(() => {
  vi.useRealTimers()
})

describe('Knowledge: ringkasan', () => {
  it('menampilkan dokumen aktif, total token, mode konteks beserta penjelasan, dan batas token', async () => {
    renderPage()
    expect(await screen.findByText('Dokumen Aktif')).toBeInTheDocument()
    const active = screen.getByText('Dokumen Aktif').closest('.stat') as HTMLElement
    expect(within(active).getByText('3')).toBeInTheDocument()
    const tokens = screen.getByText('Total Token Aktif').closest('.stat') as HTMLElement
    expect(within(tokens).getByText('45.678')).toBeInTheDocument()
    const mode = screen.getByText('Mode Konteks').closest('.stat') as HTMLElement
    expect(within(mode).getByText('Full Context')).toBeInTheDocument()
    expect(within(mode).getByText(/seluruh dokumen dikirim ke model/i)).toBeInTheDocument()
    const limit = screen.getByText('Batas Token Full Context').closest('.stat') as HTMLElement
    expect(within(limit).getByText('80.000')).toBeInTheDocument()
  })

  it('mode retrieval dijelaskan sebagai hanya bagian yang cocok', async () => {
    get.mockImplementation((url: string) => Promise.resolve({ data: url === 'knowledge/summary' ? summary({ effective_mode: 'retrieval' }) : route(url) }))
    renderPage()
    const mode = (await screen.findByText('Mode Konteks')).closest('.stat') as HTMLElement
    expect(within(mode).getByText('Retrieval')).toBeInTheDocument()
    expect(within(mode).getByText(/hanya bagian yang cocok/i)).toBeInTheDocument()
  })
})

describe('Knowledge: daftar', () => {
  it('menampilkan judul, nama berkas, status, bagian, dan token; status gagal membawa pesan galat', async () => {
    renderPage()
    expect(await screen.findByText('Kebijakan Cuti')).toBeInTheDocument()
    expect(screen.getByRole('table', { name: 'Daftar dokumen knowledge' })).toBeInTheDocument()
    const row = screen.getByText('Kebijakan Cuti').closest('tr') as HTMLElement
    expect(within(row).getByText('cuti.md')).toBeInTheDocument()
    expect(within(row).getByText('Siap')).toHaveClass('t-ok')
    expect(within(row).getByText('1.234')).toBeInTheDocument()
    expect(within(row).getByText('7')).toBeInTheDocument()

    const processing = screen.getByText('Panduan Gaji').closest('tr') as HTMLElement
    expect(within(processing).getByText('Diproses')).toHaveClass('t-info')

    const failed = screen.getByText('Rusak').closest('tr') as HTMLElement
    const failedTag = within(failed).getByText('Gagal')
    expect(failedTag).toHaveClass('t-bad')
    expect(within(failed).getByText('Gagal memecah dokumen')).toHaveAttribute('title', 'Gagal memecah dokumen')
  })

  it('meminta halaman pertama dari server dengan limit dan offset', async () => {
    renderPage('/knowledge?hal=2&ukuran=50')
    await screen.findByText('Kebijakan Cuti')
    expect(get).toHaveBeenCalledWith('knowledge/documents', { params: { limit: 50, offset: 50 } })
  })

  it('pencarian masuk URL dan menjadi parameter q', async () => {
    renderPage()
    await screen.findByText('Kebijakan Cuti')
    await userEvent.type(screen.getByRole('searchbox'), 'cuti')
    await waitFor(() => expect(screen.getByTestId('where')).toHaveTextContent('?q=cuti'))
    await waitFor(() => expect(get).toHaveBeenCalledWith('knowledge/documents', { params: { q: 'cuti', limit: 20, offset: 0 } }))
  })

  it('filter keaktifan masuk URL dan menjadi is_active', async () => {
    renderPage()
    await screen.findByText('Kebijakan Cuti')
    await userEvent.selectOptions(screen.getByLabelText('Keaktifan'), 'Nonaktif')
    expect(screen.getByTestId('where')).toHaveTextContent('aktif=0')
    await waitFor(() => expect(get).toHaveBeenCalledWith('knowledge/documents', { params: { is_active: false, limit: 20, offset: 0 } }))
  })

  it('kosong: pesan ajakan unggah dan pager tersembunyi', async () => {
    docs = []
    total = 0
    renderPage()
    expect(await screen.findByText('Belum ada dokumen. Unggah dokumen pertama untuk mulai.')).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'Halaman dokumen' })).not.toBeInTheDocument()
  })

  it('kosong karena filter: pesan berbeda dari kosong sungguhan', async () => {
    docs = []
    total = 0
    renderPage('/knowledge?q=zzz')
    expect(await screen.findByText('Tidak ada dokumen yang cocok dengan pencarian atau filter.')).toBeInTheDocument()
  })

  it('pager tampil bila ada dokumen', async () => {
    renderPage()
    await screen.findByText('Kebijakan Cuti')
    expect(screen.getByRole('navigation', { name: 'Halaman dokumen' })).toHaveTextContent('Menampilkan 1-3 dari 3')
  })

  it('galat: tampil sebagai peringatan, bukan kosong, dan Coba Lagi memuat ulang', async () => {
    get.mockImplementation((url: string) => (url === 'knowledge/documents' ? Promise.reject(new ApiError(500, 'X', 'x')) : Promise.resolve({ data: route(url) })))
    renderPage()
    expect(await screen.findByRole('alert')).toHaveTextContent('Server sedang bermasalah')
    expect(screen.queryByText(/Belum ada dokumen/)).not.toBeInTheDocument()
    const before = listCalls().length
    get.mockImplementation((url: string) => Promise.resolve({ data: route(url) }))
    await userEvent.click(screen.getByRole('button', { name: 'Coba Lagi' }))
    expect(await screen.findByText('Kebijakan Cuti')).toBeInTheDocument()
    expect(listCalls().length).toBeGreaterThan(before)
  })

  it('hanya ada satu tombol utama: Unggah Dokumen', async () => {
    const { container } = renderPage()
    await screen.findByText('Kebijakan Cuti')
    const primary = container.querySelectorAll('.btn.pri')
    expect(primary).toHaveLength(1)
    expect(primary[0]).toHaveTextContent('Unggah Dokumen')
  })
})

describe('Knowledge: unggah', () => {
  it('mengirim FormData berisi semua berkas dan menampilkan hasil per berkas termasuk yang ditolak', async () => {
    post.mockResolvedValue({
      data: {
        results: [
          { filename: 'baru.md', outcome: 'created', document: doc() },
          { filename: 'lama.md', outcome: 'updated', document: doc() },
          { filename: 'sama.txt', outcome: 'unchanged', document: doc() },
          { filename: 'besar.md', outcome: 'rejected', error: { code: 'FILE_TOO_LARGE', message: 'Ukuran berkas melebihi batas 5000 KB' } },
        ],
      },
    })
    renderPage()
    await screen.findByText('Kebijakan Cuti')
    const before = listCalls().length
    const files = [new File(['# a'], 'baru.md', { type: 'text/markdown' }), new File(['b'], 'sama.txt', { type: 'text/plain' })]
    await userEvent.upload(screen.getByLabelText('Pilih berkas dokumen'), files)

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1))
    const [url, body] = post.mock.calls[0] as [string, FormData]
    expect(url).toBe('knowledge/documents')
    expect(body).toBeInstanceOf(FormData)
    expect(body.getAll('files').map((f) => (f as File).name)).toEqual(['baru.md', 'sama.txt'])

    const notice = await screen.findByRole('status', { name: 'Hasil unggahan' })
    expect(within(notice).getByText(/baru\.md/)).toHaveTextContent('Dibuat')
    expect(within(notice).getByText(/lama\.md/)).toHaveTextContent('Diperbarui')
    expect(within(notice).getByText(/sama\.txt/)).toHaveTextContent('Tidak berubah')
    expect(within(notice).getByText(/besar\.md/)).toHaveTextContent('Ditolak')
    expect(within(notice).getByText(/besar\.md/)).toHaveTextContent('Ukuran berkas melebihi batas 5000 KB')
    await waitFor(() => expect(listCalls().length).toBeGreaterThan(before))
  })

  it('berkas dengan ekstensi salah ditolak di klien dan tidak dikirim', async () => {
    const user = userEvent.setup({ applyAccept: false })
    renderPage()
    await screen.findByText('Kebijakan Cuti')
    await user.upload(screen.getByLabelText('Pilih berkas dokumen'), new File(['x'], 'laporan.pdf', { type: 'application/pdf' }))
    const notice = await screen.findByRole('status', { name: 'Hasil unggahan' })
    expect(notice).toHaveTextContent('laporan.pdf')
    expect(notice).toHaveTextContent('Hanya berkas .md dan .txt')
    expect(post).not.toHaveBeenCalled()
  })

  it('lebih dari 20 berkas tidak dikirim dan dijelaskan', async () => {
    renderPage()
    await screen.findByText('Kebijakan Cuti')
    const many = Array.from({ length: 21 }, (_, index) => new File(['x'], `f${index}.md`))
    await userEvent.upload(screen.getByLabelText('Pilih berkas dokumen'), many)
    expect(await screen.findByRole('alert')).toHaveTextContent('Maksimal 20 berkas per unggahan')
    expect(post).not.toHaveBeenCalled()
  })

  it('galat unggah dari server tampil sebagai peringatan', async () => {
    post.mockRejectedValue(new ApiError(422, 'TOO_MANY_FILES', 'Maksimal 20 berkas per unggahan'))
    renderPage()
    await screen.findByText('Kebijakan Cuti')
    await userEvent.upload(screen.getByLabelText('Pilih berkas dokumen'), new File(['x'], 'a.md'))
    expect(await screen.findByRole('alert')).toHaveTextContent('Maksimal 20 berkas per unggahan')
  })
})

describe('Knowledge: aksi baris', () => {
  it('saklar aktif memanggil PATCH dengan nilai baru', async () => {
    patch.mockResolvedValue({ data: doc({ is_active: false }) })
    renderPage()
    await screen.findByText('Kebijakan Cuti')
    await userEvent.click(screen.getByRole('switch', { name: /cuti\.md/ }))
    expect(patch).toHaveBeenCalledWith(`knowledge/documents/${ID1}`, { is_active: false })
  })

  it('saklar nonaktif diaktifkan dengan is_active true', async () => {
    patch.mockResolvedValue({ data: doc({ id: ID2, is_active: true }) })
    renderPage()
    await screen.findByText('Panduan Gaji')
    await userEvent.click(screen.getByRole('switch', { name: /gaji\.txt/ }))
    expect(patch).toHaveBeenCalledWith(`knowledge/documents/${ID2}`, { is_active: true })
  })

  it('hapus meminta konfirmasi yang menyebut nama berkas dan baru memanggil DELETE setelah dikonfirmasi', async () => {
    del.mockResolvedValue({ status: 204 })
    renderPage()
    await screen.findByText('Kebijakan Cuti')
    await userEvent.click(screen.getByRole('button', { name: /Aksi lainnya untuk cuti\.md/ }))
    await userEvent.click(screen.getByRole('menuitem', { name: 'Hapus' }))
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveTextContent('cuti.md')
    expect(del).not.toHaveBeenCalled()
    await userEvent.click(within(dialog).getByRole('button', { name: 'Hapus Dokumen' }))
    await waitFor(() => expect(del).toHaveBeenCalledWith(`knowledge/documents/${ID1}`))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('batal pada konfirmasi tidak menghapus', async () => {
    renderPage()
    await screen.findByText('Kebijakan Cuti')
    await userEvent.click(screen.getByRole('button', { name: /Aksi lainnya untuk cuti\.md/ }))
    await userEvent.click(screen.getByRole('menuitem', { name: 'Hapus' }))
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Batal' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(del).not.toHaveBeenCalled()
  })

  it('Proses Ulang memanggil POST reingest', async () => {
    post.mockResolvedValue({ data: doc({ status: 'processing' }) })
    renderPage()
    await screen.findByText('Kebijakan Cuti')
    await userEvent.click(screen.getByRole('button', { name: /Aksi lainnya untuk cuti\.md/ }))
    await userEvent.click(screen.getByRole('menuitem', { name: 'Proses Ulang' }))
    await waitFor(() => expect(post).toHaveBeenCalledWith(`knowledge/documents/${ID1}/reingest`))
  })

  it('galat aksi baris tampil sebagai peringatan', async () => {
    patch.mockRejectedValue(new ApiError(404, 'DOCUMENT_NOT_FOUND', 'Dokumen tidak ditemukan'))
    renderPage()
    await screen.findByText('Kebijakan Cuti')
    await userEvent.click(screen.getByRole('switch', { name: /cuti\.md/ }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Dokumen tidak ditemukan')
  })
})

describe('Knowledge: polling', () => {
  it('memuat ulang tiap 3 detik selama ada dokumen diproses dan berhenti setelah semuanya selesai', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    renderPage()
    await screen.findByText('Panduan Gaji')
    const first = listCalls().length

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3100)
    })
    expect(listCalls().length).toBeGreaterThan(first)

    docs = docs.map((d) => ({ ...d, status: 'ready' as const }))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3100)
    })
    await waitFor(() => expect(screen.queryByText('Diproses', { selector: '.tag' })).not.toBeInTheDocument())

    const settled = listCalls().length
    await act(async () => {
      await vi.advanceTimersByTimeAsync(12000)
    })
    expect(listCalls().length).toBe(settled)
  })

  it('tidak melakukan polling bila tidak ada dokumen diproses', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    docs = [doc()]
    total = 1
    renderPage()
    await screen.findByText('Kebijakan Cuti')
    const first = listCalls().length
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10000)
    })
    expect(listCalls().length).toBe(first)
  })
})

describe('Knowledge: rincian dokumen', () => {
  it('Lihat membuka panel dan menulis dok ke URL, tab Isi menampilkan teks asli apa adanya', async () => {
    renderPage()
    await screen.findByText('Kebijakan Cuti')
    await userEvent.click(screen.getByRole('button', { name: /Lihat cuti\.md/ }))
    expect(screen.getByTestId('where')).toHaveTextContent(`dok=${ID1}`)
    const dialog = await screen.findByRole('dialog', { name: /Kebijakan Cuti/ })
    expect(within(dialog).getByRole('tab', { name: 'Isi', selected: true })).toBeInTheDocument()
    const content = await within(dialog).findByText(/Isi asli/)
    expect(content.tagName).toBe('PRE')
    expect(content).toHaveTextContent('<script>alert(1)</script>')
    expect(dialog.querySelector('script')).toBeNull()
  })

  it('tab Bagian menampilkan section berpaginasi dan masuk ke URL', async () => {
    renderPage(`/knowledge?dok=${ID1}`)
    const dialog = await screen.findByRole('dialog', { name: /Kebijakan Cuti/ })
    await userEvent.click(within(dialog).getByRole('tab', { name: 'Bagian' }))
    expect(screen.getByTestId('where')).toHaveTextContent('tab=bagian')
    expect(await within(dialog).findByText('Cuti > Tahunan')).toBeInTheDocument()
    expect(within(dialog).getByText('Cuti tahunan 12 hari.')).toBeInTheDocument()
    expect(within(dialog).getByText('Cuti > Sakit')).toBeInTheDocument()
    expect(get).toHaveBeenCalledWith(`knowledge/documents/${ID1}/sections`, { params: { limit: 20, offset: 0 } })
    expect(within(dialog).getByRole('navigation', { name: 'Halaman bagian' })).toHaveTextContent('Menampilkan 1-2 dari 2')
  })

  it('pulih dari URL: dok dan tab membuka panel yang sama setelah muat ulang', async () => {
    renderPage(`/knowledge?dok=${ID1}&tab=bagian`)
    const dialog = await screen.findByRole('dialog', { name: /Kebijakan Cuti/ })
    expect(within(dialog).getByRole('tab', { name: 'Bagian', selected: true })).toBeInTheDocument()
    expect(await within(dialog).findByText('Cuti > Tahunan')).toBeInTheDocument()
  })

  it('Tutup menghapus dok dan tab dari URL', async () => {
    renderPage(`/knowledge?dok=${ID1}&tab=bagian`)
    const dialog = await screen.findByRole('dialog', { name: /Kebijakan Cuti/ })
    await userEvent.click(within(dialog).getByRole('button', { name: 'Tutup' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByTestId('where')).not.toHaveTextContent('dok=')
    expect(screen.getByTestId('where')).not.toHaveTextContent('tab=')
  })

  it('Escape menutup panel', async () => {
    renderPage(`/knowledge?dok=${ID1}`)
    await screen.findByRole('dialog', { name: /Kebijakan Cuti/ })
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
