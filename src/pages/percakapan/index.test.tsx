import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/api/errors'
import PercakapanPage from '@/pages/percakapan'

const get = vi.fn()
vi.mock('@/api/client', () => ({ getHttp: () => ({ get }) }))

const ID_1 = '0b9a6f0e-1111-4c1d-9c5b-aaaaaaaaaaaa'
const ID_2 = '0b9a6f0e-2222-4c1d-9c5b-bbbbbbbbbbbb'

const item = (over: Record<string, unknown> = {}) => ({
  id: ID_1,
  channel: 'whatsapp',
  provider: 'meta',
  number_masked: '6281****678',
  started_at: '2026-10-20T03:00:00Z',
  last_activity_at: '2026-10-20T04:30:00Z',
  message_count: 12,
  fallback_count: 2,
  feedback_up: 3,
  feedback_down: 1,
  cost: '0.01234',
  ...over,
})

const page = (items = [item(), item({ id: ID_2, channel: 'web', number_masked: null, fallback_count: 0 })], total = 2) => ({
  data: { items, total, limit: 20, offset: 0 },
})

function Probe() {
  const location = useLocation()
  return <div data-testid="loc">{location.pathname + location.search}</div>
}

function renderAt(url: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[url]}>
        <Probe />
        <Routes>
          <Route path="/percakapan" element={<PercakapanPage />} />
          <Route path="/percakapan/:id" element={<p>HALAMAN RINCIAN</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

const listCall = () => get.mock.calls.filter(([path]) => path === 'conversations').at(-1) as [string, { params: Record<string, unknown> }]
const listParams = () => listCall()[1].params

describe('Percakapan (daftar)', () => {
  beforeEach(() => {
    get.mockReset()
    get.mockResolvedValue(page())
  })
  afterEach(() => vi.restoreAllMocks())

  it('menampilkan baris dengan nomor tersamar dan tanpa UUID mentah', async () => {
    renderAt('/percakapan')
    const table = await screen.findByRole('table', { name: 'Daftar percakapan' })
    await within(table).findByText('6281****678')
    const rows = within(table).getAllByRole('row')
    expect(rows).toHaveLength(3)
    expect(within(rows[1]!).getByText('6281****678')).toBeInTheDocument()
    expect(within(rows[1]!).getByText('WhatsApp')).toBeInTheDocument()
    expect(within(rows[1]!).getByText('12')).toBeInTheDocument()
    expect(within(rows[1]!).getByText('$0.0123')).toBeInTheDocument()
    expect(within(rows[1]!).getByText('2')).toHaveClass('t-warn')
    expect(within(rows[2]!).getByText('0')).not.toHaveClass('t-warn')
    expect(document.body.textContent).not.toContain(ID_1)
    expect(document.body.textContent).not.toContain('0b9a6f0e')
  })

  it('memakai urutan terbaru dulu dan halaman pertama secara default', async () => {
    renderAt('/percakapan')
    await screen.findByRole('table')
    expect(listParams()).toEqual({ sort: '-last_activity_at', limit: 20, offset: 0 })
  })

  it('filter dari URL diteruskan ke backend, tanggal diubah menjadi ISO WIB', async () => {
    renderAt(
      '/percakapan?channel=whatsapp&dari=2026-10-01&sampai=2026-10-31&nomor=6281234567&fallback=ada&alasan=low_score&feedback=down',
    )
    await screen.findByRole('table')
    expect(listParams()).toEqual({
      channel: 'whatsapp',
      dari: '2026-10-01T00:00:00+07:00',
      sampai: '2026-10-31T23:59:59.999+07:00',
      nomor: '6281234567',
      fallback: true,
      alasan: 'low_score',
      feedback: 'down',
      sort: '-last_activity_at',
      limit: 20,
      offset: 0,
    })
    expect(screen.getByLabelText('Channel')).toHaveValue('whatsapp')
    expect(screen.getByLabelText('Dari')).toHaveValue('2026-10-01')
    expect(screen.getByLabelText('Nomor')).toHaveValue('6281234567')
    expect(screen.getByLabelText('Alasan')).toHaveValue('low_score')
  })

  it('mengubah filter menulis URL dan memicu parameter baru, kembali ke halaman 1', async () => {
    renderAt('/percakapan?hal=3')
    await screen.findByRole('table')
    await userEvent.selectOptions(screen.getByLabelText('Channel'), 'web')
    await userEvent.selectOptions(screen.getByLabelText('Fallback'), 'tanpa')
    await userEvent.selectOptions(screen.getByLabelText('Alasan'), 'rate_limit')
    await userEvent.selectOptions(screen.getByLabelText('Feedback'), 'up')
    fireEvent.change(screen.getByLabelText('Dari'), { target: { value: '2026-10-05' } })
    fireEvent.change(screen.getByLabelText('Sampai'), { target: { value: '2026-10-06' } })
    await waitFor(() => expect(listParams()).toMatchObject({ channel: 'web', fallback: false, alasan: 'rate_limit', feedback: 'up', offset: 0 }))
    expect(listParams().dari).toBe('2026-10-05T00:00:00+07:00')
    expect(listParams().sampai).toBe('2026-10-06T23:59:59.999+07:00')
    const url = screen.getByTestId('loc').textContent ?? ''
    expect(url).toContain('channel=web')
    expect(url).toContain('fallback=tanpa')
    expect(url).toContain('dari=2026-10-05')
    expect(url).not.toContain('hal=')
  })

  it('nomor kurang dari 6 digit tidak dikirim, 6 digit atau lebih dikirim sebagai angka saja', async () => {
    renderAt('/percakapan')
    await screen.findByRole('table')
    const input = screen.getByLabelText('Nomor')
    expect(screen.getByText(/sama persis, mis\. 62812/)).toBeInTheDocument()
    await userEvent.type(input, '62812')
    await waitFor(() => expect(screen.getByTestId('loc').textContent).toContain('nomor=62812'))
    expect(listParams().nomor).toBeUndefined()
    await userEvent.type(input, '3 45')
    await waitFor(() => expect(listParams().nomor).toBe('62812345'))
  })

  it('Reset Filter hanya muncul bila ada filter aktif, lalu membersihkan filter', async () => {
    renderAt('/percakapan')
    await screen.findByRole('table')
    expect(screen.queryByRole('button', { name: 'Reset Filter' })).not.toBeInTheDocument()
    await userEvent.selectOptions(screen.getByLabelText('Channel'), 'web')
    await userEvent.type(screen.getByLabelText('Nomor'), '628123')
    await userEvent.click(await screen.findByRole('button', { name: 'Reset Filter' }))
    await waitFor(() => expect(listParams()).toEqual({ sort: '-last_activity_at', limit: 20, offset: 0 }))
    expect(screen.getByLabelText('Channel')).toHaveValue('')
    expect(screen.getByLabelText('Nomor')).toHaveValue('')
    expect(screen.getByTestId('loc')).toHaveTextContent(/^\/percakapan$/)
    expect(screen.queryByRole('button', { name: 'Reset Filter' })).not.toBeInTheDocument()
  })

  it('urutan terlama dikirim sebagai sort naik dan ditulis di URL', async () => {
    renderAt('/percakapan')
    await screen.findByRole('table')
    await userEvent.selectOptions(screen.getByLabelText('Urutan'), 'terlama')
    await waitFor(() => expect(listParams().sort).toBe('last_activity_at'))
    expect(screen.getByTestId('loc')).toHaveTextContent('urut=terlama')
  })

  it('klik baris membuka rincian dan membawa query string daftar', async () => {
    renderAt('/percakapan?channel=whatsapp')
    await screen.findByText('6281****678')
    const row = screen.getAllByRole('row')[1]!
    await userEvent.click(within(row).getByText('6281****678'))
    expect(await screen.findByText('HALAMAN RINCIAN')).toBeInTheDocument()
    expect(screen.getByTestId('loc')).toHaveTextContent(`/percakapan/${ID_1}`)
  })

  it('tombol Lihat adalah tautan asli ke rincian', async () => {
    renderAt('/percakapan')
    await screen.findByText('6281****678')
    const row = screen.getAllByRole('row')[1]!
    const link = within(row).getByRole('link', { name: /Lihat/ })
    expect(link).toHaveAttribute('href', `/percakapan/${ID_1}`)
    await userEvent.click(link)
    expect(await screen.findByText('HALAMAN RINCIAN')).toBeInTheDocument()
  })

  it('pager memakai offset dari halaman di URL', async () => {
    get.mockResolvedValue({ data: { items: [item()], total: 45, limit: 20, offset: 20 } })
    renderAt('/percakapan?hal=2')
    await screen.findByText('Halaman 2 dari 3')
    expect(listParams().offset).toBe(20)
    await userEvent.click(screen.getByRole('button', { name: 'Halaman berikutnya' }))
    await waitFor(() => expect(listParams().offset).toBe(40))
  })

  it('keadaan kosong dan galat tidak tercampur', async () => {
    get.mockResolvedValueOnce(page([], 0))
    const first = renderAt('/percakapan')
    expect(await screen.findByText('Belum ada percakapan yang cocok dengan filter ini.')).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: /halaman/i })).not.toBeInTheDocument()
    first.unmount()
    get.mockReset()
    get.mockRejectedValue(new ApiError(500, 'INTERNAL_ERROR', 'x'))
    renderAt('/percakapan')
    expect(await screen.findByRole('alert')).toHaveTextContent('Server sedang bermasalah')
    expect(screen.queryByText('Belum ada percakapan yang cocok dengan filter ini.')).not.toBeInTheDocument()
  })

  describe('ekspor', () => {
    let click: ReturnType<typeof vi.spyOn>
    const createObjectURL = vi.fn(() => 'blob:fake')
    const revokeObjectURL = vi.fn()
    beforeEach(() => {
      createObjectURL.mockClear()
      revokeObjectURL.mockClear()
      Object.assign(URL, { createObjectURL, revokeObjectURL })
      click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
      get.mockImplementation((path: string) =>
        path === 'conversations/export' ? Promise.resolve({ data: new Blob(['a']) }) : Promise.resolve(page()),
      )
    })

    const exportCall = () => get.mock.calls.find(([path]) => path === 'conversations/export') as [string, { params: Record<string, unknown>; responseType: string }]

    it('Ekspor CSV memakai filter aktif, format csv, dan memicu unduhan lalu mencabut URL', async () => {
      renderAt('/percakapan?channel=web&dari=2026-10-01&nomor=12&sampai=2026-10-31&fallback=ada&urut=terlama&hal=2')
      await screen.findByRole('table')
      await userEvent.click(screen.getByRole('button', { name: 'Ekspor CSV' }))
      await waitFor(() => expect(click).toHaveBeenCalled())
      expect(exportCall()[1].params).toEqual({
        channel: 'web',
        dari: '2026-10-01T00:00:00+07:00',
        sampai: '2026-10-31T23:59:59.999+07:00',
        fallback: true,
        format: 'csv',
      })
      expect(exportCall()[1].responseType).toBe('blob')
      expect(createObjectURL).toHaveBeenCalledTimes(1)
      expect(revokeObjectURL).toHaveBeenCalledWith('blob:fake')
    })

    it('Ekspor JSON meminta format json', async () => {
      renderAt('/percakapan')
      await screen.findByRole('table')
      await userEvent.click(screen.getByRole('button', { name: 'Ekspor JSON' }))
      await waitFor(() => expect(click).toHaveBeenCalled())
      expect(exportCall()[1].params).toEqual({ format: 'json' })
    })

    it('menampilkan status menyiapkan ekspor selama menunggu', async () => {
      let resolve: (value: unknown) => void = () => undefined
      get.mockImplementation((path: string) =>
        path === 'conversations/export' ? new Promise((r) => (resolve = r)) : Promise.resolve(page()),
      )
      renderAt('/percakapan')
      await screen.findByRole('table')
      await userEvent.click(screen.getByRole('button', { name: 'Ekspor CSV' }))
      expect(await screen.findByRole('status')).toHaveTextContent('Menyiapkan ekspor...')
      resolve({ data: new Blob(['a']) })
      await waitFor(() => expect(screen.queryByText('Menyiapkan ekspor...')).not.toBeInTheDocument())
    })

    it('menampilkan galat bila ekspor gagal dan tidak mengunduh', async () => {
      get.mockImplementation((path: string) =>
        path === 'conversations/export' ? Promise.reject(new ApiError(500, 'INTERNAL_ERROR', 'x')) : Promise.resolve(page()),
      )
      renderAt('/percakapan')
      await screen.findByRole('table')
      await userEvent.click(screen.getByRole('button', { name: 'Ekspor CSV' }))
      expect(await screen.findByRole('alert')).toHaveTextContent('Ekspor gagal')
      expect(click).not.toHaveBeenCalled()
    })

    it('mencatat batas 5.000 percakapan di hint', async () => {
      renderAt('/percakapan')
      expect(await screen.findByText(/5\.000 percakapan/)).toBeInTheDocument()
    })
  })
})
