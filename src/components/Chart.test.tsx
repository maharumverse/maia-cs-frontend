import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Chart } from '@/components/Chart'

interface Instance {
  canvas: HTMLCanvasElement
  config: {
    type: string
    data: { labels: string[]; datasets: Array<{ label: string; data: number[] }> }
    options: { indexAxis?: string; responsive?: boolean; maintainAspectRatio?: boolean }
  }
  destroy: ReturnType<typeof vi.fn>
}

const mocks = vi.hoisted(() => ({
  instances: [] as unknown[],
  register: vi.fn(),
}))

vi.mock('chart.js', () => {
  class FakeChart {
    static register = mocks.register
    destroy = vi.fn()
    constructor(
      public canvas: HTMLCanvasElement,
      public config: unknown,
    ) {
      mocks.instances.push(this)
    }
  }
  return {
    Chart: FakeChart,
    LineController: { id: 'LineController' },
    BarController: { id: 'BarController' },
    LineElement: { id: 'LineElement' },
    BarElement: { id: 'BarElement' },
    PointElement: { id: 'PointElement' },
    CategoryScale: { id: 'CategoryScale' },
    LinearScale: { id: 'LinearScale' },
    Tooltip: { id: 'Tooltip' },
    Legend: { id: 'Legend' },
  }
})

const instances = () => mocks.instances as Instance[]

const datasets = [{ label: 'Percakapan', data: [1, 2, 3] }]
const labels = ['Sen', 'Sel', 'Rab']

describe('Chart', () => {
  beforeEach(() => {
    mocks.instances.length = 0
    mocks.register.mockClear()
  })

  it('membuat grafik dengan tipe, label, dan data yang diberikan', async () => {
    render(<Chart type="line" labels={labels} datasets={datasets} ariaLabel="Aktivitas harian" />)
    await waitFor(() => expect(instances()).toHaveLength(1))
    const { config, canvas } = instances()[0] as Instance
    expect(config.type).toBe('line')
    expect(config.data.labels).toEqual(labels)
    expect(config.data.datasets[0]).toMatchObject({ label: 'Percakapan', data: [1, 2, 3] })
    expect(config.options.responsive).toBe(true)
    expect(config.options.maintainAspectRatio).toBe(false)
    expect(canvas).toBe(screen.getByRole('img', { name: 'Aktivitas harian' }))
  })

  it('mendaftarkan hanya komponen yang dipakai', async () => {
    render(<Chart type="bar" labels={labels} datasets={datasets} ariaLabel="Biaya" />)
    await waitFor(() => expect(mocks.register).toHaveBeenCalled())
    const ids = (mocks.register.mock.calls.flat() as Array<{ id: string }>).map((item) => item.id).sort()
    expect(ids).toEqual(
      ['BarController', 'BarElement', 'CategoryScale', 'LinearScale', 'Legend', 'LineController', 'LineElement', 'PointElement', 'Tooltip'].sort(),
    )
  })

  it('batang horizontal memakai sumbu indeks y', async () => {
    render(<Chart type="bar" horizontal labels={labels} datasets={datasets} ariaLabel="Alasan" />)
    await waitFor(() => expect(instances()).toHaveLength(1))
    expect((instances()[0] as Instance).config.options.indexAxis).toBe('y')
  })

  it('skeleton area plot hilang setelah modul termuat', async () => {
    const { container } = render(<Chart type="line" labels={labels} datasets={datasets} ariaLabel="Aktivitas" />)
    expect(container.querySelector('.skel')).toBeInTheDocument()
    await waitFor(() => expect(instances()).toHaveLength(1))
    await waitFor(() => expect(container.querySelector('.skel')).not.toBeInTheDocument())
  })

  it('data berubah: instance lama dihancurkan dan grafik baru memakai data baru', async () => {
    const { rerender } = render(<Chart type="line" labels={labels} datasets={datasets} ariaLabel="Aktivitas" />)
    await waitFor(() => expect(instances()).toHaveLength(1))
    const first = instances()[0] as Instance

    rerender(<Chart type="line" labels={labels} datasets={[{ label: 'Percakapan', data: [9, 8, 7] }]} ariaLabel="Aktivitas" />)
    await waitFor(() => expect(instances()).toHaveLength(2))
    expect(first.destroy).toHaveBeenCalledTimes(1)
    expect((instances()[1] as Instance).config.data.datasets[0]?.data).toEqual([9, 8, 7])
  })

  it('render ulang dengan data yang sama tidak membuat grafik baru', async () => {
    const { rerender } = render(<Chart type="line" labels={labels} datasets={datasets} ariaLabel="Aktivitas" />)
    await waitFor(() => expect(instances()).toHaveLength(1))
    rerender(<Chart type="line" labels={[...labels]} datasets={datasets.map((item) => ({ ...item }))} ariaLabel="Aktivitas" />)
    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(instances()).toHaveLength(1)
    expect((instances()[0] as Instance).destroy).not.toHaveBeenCalled()
  })

  it('unmount menghancurkan instance', async () => {
    const { unmount } = render(<Chart type="line" labels={labels} datasets={datasets} ariaLabel="Aktivitas" />)
    await waitFor(() => expect(instances()).toHaveLength(1))
    unmount()
    expect((instances()[0] as Instance).destroy).toHaveBeenCalledTimes(1)
  })

  it('unmount sebelum modul termuat tidak membuat grafik', async () => {
    const { unmount } = render(<Chart type="line" labels={labels} datasets={datasets} ariaLabel="Aktivitas" />)
    unmount()
    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(instances()).toHaveLength(0)
  })
})
