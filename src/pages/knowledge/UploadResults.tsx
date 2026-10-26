import { IconAlertTriangle, IconCircleCheck } from '@tabler/icons-react'
import { OUTCOME_LABELS } from '@/pages/knowledge/files'
import type { UploadResult } from '@/pages/knowledge/api'

interface UploadResultsProps {
  results: UploadResult[]
  onClose: () => void
}

// Hasil unggahan per berkas. Nama berkas dan pesan galat selalu dirender sebagai teks.
export function UploadResults({ results, onClose }: UploadResultsProps) {
  const rejected = results.filter((result) => result.outcome === 'rejected').length
  const Icon = rejected > 0 ? IconAlertTriangle : IconCircleCheck
  return (
    <div className={'notice upload-results ' + (rejected > 0 ? 'warn' : 'ok')} role="status" aria-label="Hasil unggahan">
      <Icon size={18} aria-hidden="true" />
      <div>
        <p>
          {results.length - rejected} dari {results.length} berkas diterima{rejected > 0 ? `, ${rejected} ditolak` : ''}.
        </p>
        <ul>
          {results.map((result, index) => (
            <li key={`${result.filename}-${index}`}>
              {`${result.filename}: ${OUTCOME_LABELS[result.outcome]}${result.outcome === 'rejected' && result.error ? `. ${result.error.message}` : ''}`}
            </li>
          ))}
        </ul>
      </div>
      <button type="button" className="btn sm out" onClick={onClose}>
        Tutup
      </button>
    </div>
  )
}
