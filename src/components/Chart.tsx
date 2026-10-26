import { useEffect, useRef, useState } from 'react'
import type * as ChartJsModule from 'chart.js'
import type { Chart as ChartInstance, ChartConfiguration } from 'chart.js'
import { formatNumber } from '@/lib/format'

export interface ChartDataset {
  label: string
  data: number[]
}

interface ChartProps {
  type: 'line' | 'bar'
  labels: string[]
  datasets: ChartDataset[]
  // Batang mendatar: kategori di sumbu y, nilai di sumbu x.
  horizontal?: boolean
  ariaLabel: string
  // Format nilai di sumbu dan tooltip. Bawaan: angka id-ID.
  formatValue?: (value: number) => string
  height?: number
}

// Palet seri berurutan dari buku resep grafik (maksimal 6 seri). Teks sumbu dan legenda memakai ink.
const SERIES_COLORS = ['#1273AE', '#A50000', '#16915a', '#5D5DED', '#b9791a', '#0891b2'] as const
const INK = '#1a1d29'
const GRID = '#e6e8ec'

type ChartJs = typeof ChartJsModule

// Satu pemuatan untuk seluruh aplikasi; modul chart.js tidak masuk bundel awal.
let loader: Promise<ChartJs> | undefined
function loadChartJs(): Promise<ChartJs> {
  loader ??= import('chart.js').catch((error: unknown) => {
    loader = undefined
    throw error
  })
  return loader
}

function register(mod: ChartJs): void {
  mod.Chart.register(
    mod.LineController,
    mod.BarController,
    mod.LineElement,
    mod.BarElement,
    mod.PointElement,
    mod.CategoryScale,
    mod.LinearScale,
    mod.Tooltip,
    mod.Legend,
  )
}

interface Snapshot {
  type: 'line' | 'bar'
  labels: string[]
  datasets: ChartDataset[]
  horizontal: boolean
}

// Pembungkus Chart.js (chart.component.md): dimuat malas, hanya komponen yang dipakai didaftarkan,
// dan instance selalu dihancurkan saat data berubah atau komponen dilepas.
export function Chart({ type, labels, datasets, horizontal = false, ariaLabel, formatValue, height = 280 }: ChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const formatRef = useRef<(value: number) => string>(formatNumber)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    formatRef.current = formatValue ?? formatNumber
  })

  // Kunci isi supaya render ulang dengan data yang sama tidak membangun ulang grafik.
  const key = JSON.stringify({ type, labels, datasets, horizontal } satisfies Snapshot)

  useEffect(() => {
    const snapshot = JSON.parse(key) as Snapshot
    let cancelled = false
    let instance: ChartInstance | undefined

    loadChartJs().then(
      (mod) => {
        const canvas = canvasRef.current
        if (cancelled || !canvas) return
        register(mod)
        const valueAxis = snapshot.horizontal ? 'x' : 'y'
        const format = (value: number | string) => formatRef.current(Number(value))
        const config: ChartConfiguration<'line' | 'bar', number[], string> = {
          type: snapshot.type,
          data: {
            labels: snapshot.labels,
            datasets: snapshot.datasets.map((dataset, index) => {
              const color = SERIES_COLORS[index % SERIES_COLORS.length]
              return {
                label: dataset.label,
                data: dataset.data,
                borderColor: color,
                backgroundColor: color,
                borderWidth: snapshot.type === 'line' ? 2 : 0,
                pointRadius: snapshot.type === 'line' ? 2 : 0,
                tension: 0,
              }
            }),
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: snapshot.horizontal ? 'y' : 'x',
            plugins: {
              legend: { display: true, labels: { color: INK } },
              tooltip: {
                callbacks: {
                  label: (context) => `${context.dataset.label ?? ''}: ${format(context.parsed[valueAxis] ?? 0)}`,
                },
              },
            },
            scales: {
              [valueAxis]: {
                beginAtZero: true,
                grid: { color: GRID },
                ticks: { color: INK, precision: 0, callback: (value) => format(value) },
              },
              [valueAxis === 'x' ? 'y' : 'x']: {
                grid: { display: false },
                ticks: { color: INK },
              },
            },
          },
        }
        instance = new mod.Chart(canvas, config)
        setFailed(false)
        setReady(true)
      },
      () => {
        if (!cancelled) setFailed(true)
      },
    )

    return () => {
      cancelled = true
      instance?.destroy()
    }
  }, [key])

  return (
    <div style={{ position: 'relative', height }}>
      <canvas ref={canvasRef} role="img" aria-label={ariaLabel} />
      {!ready && !failed ? <div className="skel skel-block" aria-hidden="true" style={{ position: 'absolute', inset: 0, height: '100%' }} /> : null}
      {failed ? (
        <p className="muted" role="status" style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
          Grafik gagal dimuat. Gunakan tampilan tabel.
        </p>
      ) : null}
    </div>
  )
}
