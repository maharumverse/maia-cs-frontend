import { useState } from 'react'
import { IconDownload } from '@tabler/icons-react'
import { parseApiError, userMessage } from '@/api/errors'
import { ButtonSpinner } from '@/components/Spinner'
import { fetchExport, type ExportFormat } from '@/pages/percakapan/api'
import { EXPORT_CAP, type ConversationFilters } from '@/pages/percakapan/filters'

const FILE_NAMES: Record<ExportFormat, string> = { csv: 'percakapan.csv', json: 'percakapan.json' }

// Unduhan lewat blob karena API memakai cookie dan header, bukan tautan biasa.
function saveBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export function ExportButtons({ filters }: { filters: ConversationFilters }) {
  const [busy, setBusy] = useState<ExportFormat | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function run(format: ExportFormat) {
    setBusy(format)
    setError(null)
    try {
      saveBlob(await fetchExport(filters, format), FILE_NAMES[format])
    } catch (caught) {
      setError(`Ekspor gagal. ${userMessage(parseApiError(caught))}`)
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="cv-export">
      <div className="cv-export-note">
        <p className="hint">
          Ekspor memakai filter yang sedang aktif, satu baris per pesan, paling banyak {EXPORT_CAP.toLocaleString('id-ID')} percakapan.
        </p>
        {busy ? (
          <p role="status" className="hint">
            Menyiapkan ekspor...
          </p>
        ) : null}
        {error ? (
          <p role="alert" className="cv-error">
            {error}
          </p>
        ) : null}
      </div>
      <div className="row-actions">
        <button type="button" className="btn ghost" disabled={busy !== null} onClick={() => void run('json')}>
          {busy === 'json' ? <ButtonSpinner /> : <IconDownload size={16} aria-hidden="true" />}
          Ekspor JSON
        </button>
        <button type="button" className="btn out" disabled={busy !== null} onClick={() => void run('csv')}>
          {busy === 'csv' ? <ButtonSpinner /> : <IconDownload size={16} aria-hidden="true" />}
          Ekspor CSV
        </button>
      </div>
    </div>
  )
}
