import { DataTable, type Column } from '@/components/DataTable'
import { formatDateTime, formatNumber } from '@/lib/format'
import { STATUS_LABELS, STATUS_TONES } from '@/pages/knowledge/files'
import { RowMenu } from '@/pages/knowledge/RowMenu'
import type { KnowledgeDoc } from '@/pages/knowledge/api'

interface DocumentsTableProps {
  rows: KnowledgeDoc[] | undefined
  loading: boolean
  refetching: boolean
  error: unknown
  emptyMessage: string
  busy: ReadonlySet<string>
  onRetry: () => void
  onView: (doc: KnowledgeDoc) => void
  onToggle: (doc: KnowledgeDoc, active: boolean) => void
  onReingest: (doc: KnowledgeDoc) => void
  onDelete: (doc: KnowledgeDoc) => void
}

export function DocumentsTable({ rows, loading, refetching, error, emptyMessage, busy, onRetry, onView, onToggle, onReingest, onDelete }: DocumentsTableProps) {
  const columns: Column<KnowledgeDoc>[] = [
    {
      key: 'title',
      header: 'Judul',
      render: (doc) => (
        <div className="doc-name">
          <span className="doc-title">{doc.title}</span>
          <span className="muted doc-file">{doc.original_filename}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (doc) => (
        <div className="doc-status">
          <span className={'tag ' + STATUS_TONES[doc.status]}>{STATUS_LABELS[doc.status]}</span>
          {doc.status === 'failed' && doc.error_message ? (
            <span className="doc-error" title={doc.error_message}>
              {doc.error_message}
            </span>
          ) : null}
        </div>
      ),
    },
    { key: 'sections', header: 'Bagian', numeric: true, render: (doc) => formatNumber(doc.section_count) },
    { key: 'tokens', header: 'Token', numeric: true, render: (doc) => formatNumber(doc.token_count) },
    {
      key: 'active',
      header: 'Aktif',
      render: (doc) => (
        <label className="switch">
          <input
            type="checkbox"
            role="switch"
            checked={doc.is_active}
            disabled={busy.has(doc.id)}
            aria-label={`Aktif: ${doc.original_filename}`}
            onChange={(event) => onToggle(doc, event.target.checked)}
          />
          <span className="muted">{doc.is_active ? 'Aktif' : 'Nonaktif'}</span>
        </label>
      ),
    },
    { key: 'updated', header: 'Diperbarui', render: (doc) => formatDateTime(doc.updated_at) },
    {
      key: 'actions',
      header: 'Aksi',
      render: (doc) => (
        <div className="row-actions">
          <button type="button" className="btn sm out" aria-label={`Lihat ${doc.original_filename}`} onClick={() => onView(doc)}>
            Lihat
          </button>
          <RowMenu filename={doc.original_filename} disabled={busy.has(doc.id)} onReingest={() => onReingest(doc)} onDelete={() => onDelete(doc)} />
        </div>
      ),
    },
  ]

  return (
    <DataTable<KnowledgeDoc>
      caption="Daftar dokumen knowledge"
      columns={columns}
      rows={rows}
      rowKey={(doc) => doc.id}
      loading={loading}
      refetching={refetching}
      error={error}
      onRetry={onRetry}
      emptyMessage={emptyMessage}
    />
  )
}
