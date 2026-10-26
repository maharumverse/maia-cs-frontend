import { useId, useState, type ReactNode } from 'react'
import type { Icon } from '@tabler/icons-react'
import { EmptyState } from '@/components/EmptyState'

interface ChartCardProps {
  title: string
  // Temuan utama dari data, tampil tepat di bawah judul. Aman bila data kosong.
  finding?: string
  chart: ReactNode
  table: ReactNode
  empty?: { icon: Icon; message: string }
}

type View = 'grafik' | 'tabel'

// Kartu grafik dengan tombol alih ke tampilan tabel dari data yang sama (chart.component.md).
export function ChartCard({ title, finding, chart, table, empty }: ChartCardProps) {
  const titleId = useId()
  const [view, setView] = useState<View>('grafik')

  return (
    <section className="card chart-card" aria-labelledby={titleId}>
      <div className="chart-head">
        <div>
          <h2 id={titleId}>{title}</h2>
          {finding ? <p className="muted">{finding}</p> : null}
        </div>
        {empty ? null : (
          <div className="chart-switch" role="group" aria-label={`Tampilan ${title}`}>
            <button type="button" className={'btn sm ' + (view === 'grafik' ? 'dark' : 'out')} aria-pressed={view === 'grafik'} onClick={() => setView('grafik')}>
              Grafik
            </button>
            <button type="button" className={'btn sm ' + (view === 'tabel' ? 'dark' : 'out')} aria-pressed={view === 'tabel'} onClick={() => setView('tabel')}>
              Tampilan Tabel
            </button>
          </div>
        )}
      </div>
      {empty ? <EmptyState icon={empty.icon} message={empty.message} /> : view === 'grafik' ? chart : table}
    </section>
  )
}

export function ChartCardSkeleton() {
  return (
    <div className="card chart-card" aria-hidden="true">
      <div className="skel skel-line" style={{ margin: '0 0 14px', width: 200 }} />
      <div className="skel skel-block" style={{ height: 280 }} />
    </div>
  )
}
