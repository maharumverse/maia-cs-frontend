import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/api/errors'
import type { Schemas } from '@/api/types'
import { addDays, todayJakarta } from '@/lib/format'
import RingkasanPage from '@/pages/ringkasan'

const get = vi.fn()
vi.mock('@/api/client', () => ({ getHttp: () => ({ get }) }))

interface ChartConfig {
  type: string
  data: { labels: string[]; datasets: Array<{ label: string; data: number[] }> }
  options: { indexAxis?: string }
}
const charts = vi.hoisted(() => ({ created: [] as unknown[] }))

vi.mock('chart.js', () => {
  class FakeChart {
    static register = vi.fn()
    destroy = vi.fn()
    constructor(
      public canvas: HTMLCanvasElement,
      public config: unknown,
    ) {
      charts.created.push(config)
    }
  }
  return {
    Chart: FakeChart,
    LineController: {},
    BarController: {},
    LineElement: {},
    BarElement: {},
    PointElement: {},
    CategoryScale: {},
    LinearScale: {},
    Tooltip: {},
    Legend: {},
  }
})

type Summary = Schemas['app__api__v1__dashboard__SummaryOut']
type Timeseries = Schemas['TimeseriesOut']

const summary = (patch: Partial<Summary> = {}): Summary => ({
  range: { dari: '2026-10-01', sampai: '2026-10-30' },
  conversations: 120,
  by_channel: { web: 100, whatsapp: 20 },
  messages_in: 450,
  answers: 400,
  answered: 360,
  fallback: { total: 40, rate: 0.1, by_reason: { low_score: 15, not_in_document: 25 } },
  feedback: { up: 30, down: 10, rate_up: 0.75 },
  cost: { total: '12.3456', today: '1.5', daily_limit: '10', warning: false },
  tokens: { input: 1, output: 1, cache_read: 0, cache_write: 0 },
  ...patch,
})

const series: Timeseries = {
  range: { dari: '2026-10-01', sampai: '2026-10-03' },
  items: [
    { date: '2026-10-01', conversations: 10, user_messages: 30, fallbacks: 2, cost: '0.5', feedback_up: 1, feedback_down: 0 },
    { date: '2026-10-02', conversations: 25, user_messages: 80, fallbacks: 5, cost: '1.25', feedback_up: 2, feedback_down: 1 },
    { date: '2026-10-03', conversations: 15, user_messages: 40, fallbacks: 1, cost: '0.75', feedback_up: 0, feedback_down: 0 },
  ],
}

function respond(options: { summary?: Summary; series?: Timeseries } = {}) {
  get.mockImplementation((path: string) => {
    if (path === 'dashboard/summary') return Promise.resolve({ data: options.summary ?? summary() })
    if (path === 'dashboard/timeseries') return Promise.resolve({ data: options.series ?? series })
    return Promise.reject(new Error(`path tak terduga: ${path}`))
  })
}

function Where() {
  const location = useLocation()
  return <div data-testid="search">{location.search}</div>
}

function setup(url = '/') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[url]}>
        <RingkasanPage />
        <Where />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

const tile = (label: string) => {
  const element = screen.getByText(label).closest('.stat')
  if (!(element instanceof HTMLElement)) throw new Error(`kartu ${label} tidak ditemukan`)
  return within(element)
}
const card = (name: string) => within(screen.getByRole('region', { name }))
const calls = (path: string) => get.mock.calls.filter((call) => call[0] === path)

const today = todayJakarta()

describe('Ringkasan', () => {
  beforeEach(() => {
    get.mockReset()
    charts.created.length = 0
    respond()
  })

  it('memuat pertama: skeleton kartu dengan status untuk pembaca layar, lalu angka', async () => {
    setup()
    expect(screen.getByRole('status')).toHaveTextContent('Memuat ringkasan...')
    expect(document.querySelector('.stat-grid .skel')).toBeInTheDocument()
    await screen.findByText('Pesan Masuk')
    expect(screen.queryByText('Memuat ringkasan...')).not.toBeInTheDocument()
  })

  it('kartu menampilkan angka dari respons', async () => {
    setup()
    await screen.findByText('Pesan Masuk')
    expect(tile('Percakapan').getByText('120')).toBeInTheDocument()
    expect(tile('Percakapan').getByText(/Web 100/)).toBeInTheDocument()
    expect(tile('Percakapan').getByText(/WhatsApp 20/)).toBeInTheDocument()
    expect(tile('Pesan Masuk').getByText('450')).toBeInTheDocument()
    expect(tile('Tingkat Fallback').getByText('10%')).toBeInTheDocument()
    expect(tile('Tingkat Fallback').getByText('40 dari 400 jawaban')).toBeInTheDocument()
    expect(tile('Kepuasan').getByText('75%')).toBeInTheDocument()
    expect(tile('Kepuasan').getByText('30 jempol naik, 10 jempol turun')).toBeInTheDocument()
    expect(tile('Biaya Periode').getByText('$12.3456')).toBeInTheDocument()
    expect(tile('Biaya Hari Ini').getByText('$1.50')).toBeInTheDocument()
    expect(tile('Biaya Hari Ini').getByText('dari batas $10.00')).toBeInTheDocument()
  })

  it('rasio null: fallback tampil tanda hubung dan kepuasan menjelaskan belum ada penilaian', async () => {
    respond({
      summary: summary({
        answers: 0,
        answered: 0,
        fallback: { total: 0, rate: null, by_reason: {} },
        feedback: { up: 0, down: 0, rate_up: null },
      }),
    })
    setup()
    await screen.findByText('Pesan Masuk')
    expect(tile('Tingkat Fallback').getByText('-')).toBeInTheDocument()
    expect(tile('Kepuasan').getByText('Belum ada penilaian')).toBeInTheDocument()
    expect(tile('Kepuasan').queryByText('0%')).not.toBeInTheDocument()
  })

  it('batas harian belum diatur', async () => {
    respond({ summary: summary({ cost: { total: '1', today: '0', daily_limit: null, warning: false } }) })
    setup()
    await screen.findByText('Pesan Masuk')
    expect(tile('Biaya Hari Ini').getByText('Batas harian belum diatur')).toBeInTheDocument()
  })

  it('tanpa peringatan biaya: tidak ada alert', async () => {
    setup()
    await screen.findByText('Pesan Masuk')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(document.querySelector('.stat.warn')).not.toBeInTheDocument()
  })

  it('peringatan biaya: notice di atas halaman dan kartu bernada peringatan dengan teks', async () => {
    respond({ summary: summary({ cost: { total: '50', today: '9', daily_limit: '10', warning: true } }) })
    setup()
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Biaya hari ini sudah mendekati batas harian.')
    expect(alert).toHaveClass('notice', 'warn')
    expect(tile('Biaya Hari Ini').getByText(/Mendekati batas/)).toBeInTheDocument()
    expect(screen.getByText('Biaya Hari Ini').closest('.stat')).toHaveClass('warn')
  })

  it('default 30 hari terakhir: meminta rentang lengkap dan URL tetap bersih', async () => {
    setup()
    await screen.findByText('Pesan Masuk')
    const params = { dari: addDays(today, -29), sampai: today }
    expect(get).toHaveBeenCalledWith('dashboard/summary', { params })
    expect(get).toHaveBeenCalledWith('dashboard/timeseries', { params })
    expect(screen.getByTestId('search')).toHaveTextContent('')
    expect(screen.getByLabelText('Dari')).toHaveValue(params.dari)
    expect(screen.getByLabelText('Sampai')).toHaveValue(params.sampai)
    expect(screen.getByRole('button', { name: '30 Hari' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('preset 7 hari mengubah URL dan meminta rentang baru; preset 30 menghapus parameter', async () => {
    setup()
    await screen.findByText('Pesan Masuk')
    await userEvent.click(screen.getByRole('button', { name: '7 Hari' }))

    const params = { dari: addDays(today, -6), sampai: today }
    await waitFor(() => expect(get).toHaveBeenCalledWith('dashboard/summary', { params }))
    expect(get).toHaveBeenCalledWith('dashboard/timeseries', { params })
    expect(screen.getByTestId('search')).toHaveTextContent(`?dari=${params.dari}`)
    expect(screen.getByRole('button', { name: '7 Hari' })).toHaveAttribute('aria-pressed', 'true')

    await userEvent.click(screen.getByRole('button', { name: '90 Hari' }))
    await waitFor(() => expect(get).toHaveBeenCalledWith('dashboard/summary', { params: { dari: addDays(today, -89), sampai: today } }))

    await userEvent.click(screen.getByRole('button', { name: '30 Hari' }))
    await waitFor(() => expect(screen.getByTestId('search')).toHaveTextContent(''))
  })

  it('mengubah tanggal manual masuk ke URL dan permintaan', async () => {
    setup()
    await screen.findByText('Pesan Masuk')
    fireEvent.change(screen.getByLabelText('Dari'), { target: { value: '2026-09-01' } })
    await waitFor(() => expect(get).toHaveBeenCalledWith('dashboard/summary', { params: { dari: '2026-09-01', sampai: today } }))
    expect(screen.getByTestId('search')).toHaveTextContent('?dari=2026-09-01')
  })

  it('state awal dibaca dari URL', async () => {
    setup('/?dari=2026-09-01&sampai=2026-09-30')
    await screen.findByText('Pesan Masuk')
    expect(screen.getByLabelText('Dari')).toHaveValue('2026-09-01')
    expect(screen.getByLabelText('Sampai')).toHaveValue('2026-09-30')
    expect(get).toHaveBeenCalledWith('dashboard/summary', { params: { dari: '2026-09-01', sampai: '2026-09-30' } })
  })

  it('rentang terbalik: pesan tampil dan API tidak dipanggil', async () => {
    setup('/?dari=2026-10-10&sampai=2026-10-05')
    expect(await screen.findByRole('alert')).toHaveTextContent('Tanggal Dari harus sebelum atau sama dengan tanggal Sampai.')
    expect(get).not.toHaveBeenCalled()
    expect(screen.queryByText('Memuat ringkasan...')).not.toBeInTheDocument()
  })

  it('rentang lebih dari 366 hari: pesan tampil dan API tidak dipanggil', async () => {
    setup('/?dari=2025-01-01&sampai=2026-10-01')
    expect(await screen.findByRole('alert')).toHaveTextContent('Rentang maksimal 366 hari.')
    expect(get).not.toHaveBeenCalled()
  })

  it('rentang tepat 366 hari masih sah', async () => {
    setup('/?dari=2025-09-30&sampai=2026-09-30')
    await screen.findByText('Pesan Masuk')
    expect(get).toHaveBeenCalled()
  })

  it('galat awal: alert dengan Coba Lagi, bukan skeleton atau kartu kosong, dan pulih saat dicoba lagi', async () => {
    get.mockRejectedValue(new ApiError(500, 'X', 'x'))
    setup()
    expect(await screen.findByRole('alert')).toHaveTextContent('Server sedang bermasalah')
    expect(document.querySelector('.skel')).not.toBeInTheDocument()
    expect(screen.queryByText('Pesan Masuk')).not.toBeInTheDocument()

    respond()
    await userEvent.click(screen.getByRole('button', { name: 'Coba Lagi' }))
    await screen.findByText('Pesan Masuk')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('muat ulang: refetch kedua endpoint dan angka lama tetap tampil selama menunggu', async () => {
    setup()
    await screen.findByText('Pesan Masuk')
    let release: (value: unknown) => void = () => undefined
    get.mockImplementation(() => new Promise((resolve) => (release = resolve)))

    await userEvent.click(screen.getByRole('button', { name: 'Muat ulang' }))
    await waitFor(() => expect(calls('dashboard/summary')).toHaveLength(2))
    expect(calls('dashboard/timeseries')).toHaveLength(2)
    expect(tile('Percakapan').getByText('120')).toBeInTheDocument()
    expect(document.querySelector('.stat-grid .skel')).not.toBeInTheDocument()
    release({ data: summary() })
  })

  it('galat saat muat ulang: alert tampil dan data lama bertahan', async () => {
    setup()
    await screen.findByText('Pesan Masuk')
    get.mockRejectedValue(new ApiError(0, 'NETWORK_ERROR', 'x'))

    await userEvent.click(screen.getByRole('button', { name: 'Muat ulang' }))
    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(tile('Percakapan').getByText('120')).toBeInTheDocument()
    expect(tile('Pesan Masuk').getByText('450')).toBeInTheDocument()
    expect(card('Aktivitas Harian').getByRole('img', { name: /aktivitas harian/i })).toBeInTheDocument()

    respond()
    await userEvent.click(screen.getByRole('button', { name: 'Coba Lagi' }))
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument())
  })

  describe('grafik', () => {
    const configs = () => charts.created as ChartConfig[]

    it('Aktivitas Harian: garis percakapan, pesan masuk, dan fallback per hari', async () => {
      setup()
      await waitFor(() => expect(configs().length).toBeGreaterThanOrEqual(3))
      const activity = configs().find((config) => config.type === 'line')
      expect(activity?.data.datasets).toEqual([
        expect.objectContaining({ label: 'Percakapan', data: [10, 25, 15] }),
        expect.objectContaining({ label: 'Pesan Masuk', data: [30, 80, 40] }),
        expect.objectContaining({ label: 'Fallback', data: [2, 5, 1] }),
      ])
      expect(activity?.data.labels).toHaveLength(3)
    })

    it('Alasan Fallback: batang mendatar, label Indonesia, terbesar dulu', async () => {
      setup()
      await waitFor(() => expect(configs().some((config) => config.options.indexAxis === 'y')).toBe(true))
      const reasons = configs().find((config) => config.options.indexAxis === 'y')
      expect(reasons?.type).toBe('bar')
      expect(reasons?.data.labels).toEqual(['Tidak ada di dokumen', 'Kemiripan terlalu rendah'])
      expect(reasons?.data.datasets[0]?.data).toEqual([25, 15])
    })

    it('Biaya Harian: batang per hari dalam angka biaya', async () => {
      setup()
      await waitFor(() => expect(configs().some((config) => config.type === 'bar' && config.options.indexAxis !== 'y')).toBe(true))
      const cost = configs().find((config) => config.type === 'bar' && config.options.indexAxis !== 'y')
      expect(cost?.data.datasets[0]).toMatchObject({ label: 'Biaya (USD)', data: [0.5, 1.25, 0.75] })
    })

    it('judul grafik menyebut temuan', async () => {
      setup()
      await screen.findByText('Pesan Masuk')
      expect(card('Alasan Fallback').getByText('Fallback terbanyak: Tidak ada di dokumen (25 dari 40)')).toBeInTheDocument()
      expect(card('Aktivitas Harian').getByText(/Puncak 25 percakapan/)).toBeInTheDocument()
      expect(card('Biaya Harian').getByText(/Biaya tertinggi \$1\.25/)).toBeInTheDocument()
    })

    it('Tampilan Tabel Aktivitas Harian memuat data yang sama dengan grafik', async () => {
      setup()
      await screen.findByText('Pesan Masuk')
      const section = card('Aktivitas Harian')
      await userEvent.click(section.getByRole('button', { name: 'Tampilan Tabel' }))

      const table = section.getByRole('table', { name: /aktivitas harian/i })
      expect(within(table).getAllByRole('columnheader').map((header) => header.textContent)).toEqual(['Tanggal', 'Percakapan', 'Pesan Masuk', 'Fallback'])
      const body = within(table).getAllByRole('row').slice(1)
      expect(body.map((row) => within(row).getAllByRole('cell').slice(1).map((cell) => cell.textContent))).toEqual([
        ['10', '30', '2'],
        ['25', '80', '5'],
        ['15', '40', '1'],
      ])
      expect(section.queryByRole('img')).not.toBeInTheDocument()

      await userEvent.click(section.getByRole('button', { name: 'Grafik' }))
      expect(section.getByRole('img', { name: /aktivitas harian/i })).toBeInTheDocument()
    })

    it('Tampilan Tabel Alasan Fallback dan Biaya Harian', async () => {
      setup()
      await screen.findByText('Pesan Masuk')

      const reasons = card('Alasan Fallback')
      await userEvent.click(reasons.getByRole('button', { name: 'Tampilan Tabel' }))
      const reasonRows = reasons.getAllByRole('row').slice(1)
      expect(reasonRows.map((row) => within(row).getAllByRole('cell').map((cell) => cell.textContent))).toEqual([
        ['Tidak ada di dokumen', '25'],
        ['Kemiripan terlalu rendah', '15'],
      ])

      const cost = card('Biaya Harian')
      await userEvent.click(cost.getByRole('button', { name: 'Tampilan Tabel' }))
      const costRows = cost.getAllByRole('row').slice(1)
      expect(costRows.map((row) => within(row).getAllByRole('cell')[1]?.textContent)).toEqual(['$0.50', '$1.25', '$0.75'])
    })

    it('tanpa fallback: keadaan kosong pada Alasan Fallback', async () => {
      respond({ summary: summary({ fallback: { total: 0, rate: 0, by_reason: {} } }) })
      setup()
      await screen.findByText('Pesan Masuk')
      expect(card('Alasan Fallback').getByText('Tidak ada fallback pada rentang ini.')).toBeInTheDocument()
      expect(card('Alasan Fallback').queryByRole('img')).not.toBeInTheDocument()
    })

    it('tanpa data harian: keadaan kosong tanpa galat', async () => {
      respond({ series: { range: series.range, items: [] } })
      setup()
      await screen.findByText('Pesan Masuk')
      expect(card('Aktivitas Harian').getByText('Belum ada data pada rentang ini.')).toBeInTheDocument()
      expect(card('Biaya Harian').getByText('Belum ada data pada rentang ini.')).toBeInTheDocument()
    })
  })
})
