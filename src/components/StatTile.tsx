import type { ReactNode } from 'react'

interface StatTileProps {
  label: string
  value: ReactNode
  hint?: ReactNode
  // Warna status hanya bila nilainya memang berarti baik atau buruk, dan selalu disertai teks.
  tone?: 'ok' | 'warn' | 'bad'
}

export function StatTile({ label, value, hint, tone }: StatTileProps) {
  return (
    <div className={'stat' + (tone ? ` ${tone}` : '')}>
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value}</p>
      {hint ? <p className="stat-hint">{hint}</p> : null}
    </div>
  )
}

export function StatTileSkeleton() {
  return (
    <div className="stat" aria-hidden="true">
      <div className="skel skel-line" style={{ width: '45%' }} />
      <div className="skel skel-stat" />
    </div>
  )
}
