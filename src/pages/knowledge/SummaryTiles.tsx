import { ErrorNotice } from '@/components/ErrorNotice'
import { StatTile, StatTileSkeleton } from '@/components/StatTile'
import { formatNumber } from '@/lib/format'
import type { KnowledgeSummary } from '@/pages/knowledge/api'

const MODE_LABELS = { full_context: 'Full Context', retrieval: 'Retrieval' } as const
const MODE_HINTS = {
  full_context: 'Seluruh dokumen dikirim ke model.',
  retrieval: 'Hanya bagian yang cocok dengan pertanyaan yang dikirim ke model.',
} as const

interface SummaryTilesProps {
  summary: KnowledgeSummary | undefined
  error: unknown
  onRetry: () => void
}

export function SummaryTiles({ summary, error, onRetry }: SummaryTilesProps) {
  if (error && !summary) return <ErrorNotice error={error} onRetry={onRetry} />
  if (!summary) {
    return (
      <div className="stat-grid" role="status" aria-live="polite">
        <span className="sr-only">Memuat ringkasan...</span>
        <StatTileSkeleton />
        <StatTileSkeleton />
        <StatTileSkeleton />
        <StatTileSkeleton />
      </div>
    )
  }
  const hints = [`${formatNumber(summary.inactive_documents)} nonaktif`]
  if (summary.processing_documents > 0) hints.push(`${formatNumber(summary.processing_documents)} diproses`)
  if (summary.failed_documents > 0) hints.push(`${formatNumber(summary.failed_documents)} gagal`)
  const configured = summary.configured_mode === 'auto' ? 'Dipilih otomatis berdasarkan total token. ' : ''
  return (
    <div className="stat-grid">
      <StatTile label="Dokumen Aktif" value={formatNumber(summary.active_documents)} hint={hints.join(', ')} tone={summary.failed_documents > 0 ? 'warn' : undefined} />
      <StatTile label="Total Token Aktif" value={formatNumber(summary.active_tokens)} hint="Jumlah token seluruh dokumen aktif." />
      <StatTile label="Mode Konteks" value={MODE_LABELS[summary.effective_mode]} hint={configured + MODE_HINTS[summary.effective_mode]} />
      <StatTile label="Batas Token Full Context" value={formatNumber(summary.full_context_max_tokens)} hint="Dipakai saat mode konteks diatur otomatis." />
    </div>
  )
}
