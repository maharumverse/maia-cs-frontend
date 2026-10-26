import { IconX } from '@tabler/icons-react'
import { useEffect, useRef } from 'react'
import { ErrorNotice } from '@/components/ErrorNotice'
import { Pager } from '@/components/Pager'
import { formatNumber } from '@/lib/format'
import { useContent, useDocument, useSections } from '@/pages/knowledge/api'
import { STATUS_LABELS, STATUS_TONES } from '@/pages/knowledge/files'

export type DetailTab = 'isi' | 'bagian'

interface DetailPanelProps {
  id: string
  tab: DetailTab
  limit: number
  offset: number
  onTab: (tab: DetailTab) => void
  onPage: (page: number) => void
  onSize: (size: number) => void
  onClose: () => void
}

const TABS: Array<{ key: DetailTab; label: string }> = [
  { key: 'isi', label: 'Isi' },
  { key: 'bagian', label: 'Bagian' },
]

// Rincian dokumen sebagai dialog di dalam halaman. Keadaannya (dok, tab, halaman) hidup di URL.
export function DetailPanel({ id, tab, limit, offset, onTab, onPage, onSize, onClose }: DetailPanelProps) {
  const detail = useDocument(id)
  const closeButton = useRef<HTMLButtonElement>(null)
  const opener = useRef<Element | null>(null)

  useEffect(() => {
    opener.current = document.activeElement
    closeButton.current?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      if (opener.current instanceof HTMLElement && opener.current.isConnected) opener.current.focus()
    }
  }, [onClose])

  const doc = detail.data
  const onTabKey = (event: React.KeyboardEvent, index: number) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
    event.preventDefault()
    const next = TABS[(index + (event.key === 'ArrowRight' ? 1 : TABS.length - 1)) % TABS.length]
    if (next) onTab(next.key)
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal card detail-panel" role="dialog" aria-modal="true" aria-labelledby="detail-title" onClick={(event) => event.stopPropagation()}>
        <div className="detail-head">
          <div>
            <h2 id="detail-title">{doc ? doc.title : 'Rincian Dokumen'}</h2>
            {doc ? (
              <p className="muted detail-meta">
                {doc.original_filename} · <span className={'tag ' + STATUS_TONES[doc.status]}>{STATUS_LABELS[doc.status]}</span> · {formatNumber(doc.token_count)} token · {formatNumber(doc.section_count)} bagian
              </p>
            ) : null}
          </div>
          <button ref={closeButton} type="button" className="btn sm out" onClick={onClose}>
            <IconX size={16} aria-hidden="true" />
            Tutup
          </button>
        </div>

        {detail.error ? <ErrorNotice error={detail.error} onRetry={() => void detail.refetch()} /> : null}

        <div role="tablist" aria-label="Rincian dokumen" className="detail-tabs">
          {TABS.map((item, index) => (
            <button
              key={item.key}
              type="button"
              role="tab"
              id={`tab-${item.key}`}
              aria-selected={tab === item.key}
              aria-controls="detail-body"
              tabIndex={tab === item.key ? 0 : -1}
              onClick={() => onTab(item.key)}
              onKeyDown={(event) => onTabKey(event, index)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div id="detail-body" role="tabpanel" aria-labelledby={`tab-${tab}`} className="detail-body">
          {tab === 'isi' ? <ContentTab id={id} /> : <SectionsTab id={id} limit={limit} offset={offset} onPage={onPage} onSize={onSize} />}
        </div>
      </div>
    </div>
  )
}

function ContentTab({ id }: { id: string }) {
  const content = useContent(id, true)
  if (content.error && !content.data) return <ErrorNotice error={content.error} onRetry={() => void content.refetch()} />
  if (!content.data) return <Loading label="Memuat isi dokumen..." />
  return <pre className="doc-text">{content.data.content}</pre>
}

interface SectionsTabProps {
  id: string
  limit: number
  offset: number
  onPage: (page: number) => void
  onSize: (size: number) => void
}

function SectionsTab({ id, limit, offset, onPage, onSize }: SectionsTabProps) {
  const sections = useSections(id, limit, offset, true)
  if (sections.error && !sections.data) return <ErrorNotice error={sections.error} onRetry={() => void sections.refetch()} />
  if (!sections.data) return <Loading label="Memuat bagian dokumen..." />
  if (sections.data.total === 0) return <p className="muted">Dokumen ini belum punya bagian. Bagian muncul setelah dokumen selesai diproses.</p>
  return (
    <>
      <ol className="section-list">
        {sections.data.items.map((section) => (
          <li key={section.id} className="section-item">
            <div className="section-head">
              <span className="tag t-mut">#{section.ref_no}</span>
              <strong>{section.heading_path}</strong>
              <span className="muted">{formatNumber(section.token_count)} token</span>
            </div>
            <pre className="doc-text">{section.body}</pre>
          </li>
        ))}
      </ol>
      <Pager label="Halaman bagian" total={sections.data.total} limit={limit} offset={offset} onPage={onPage} onSize={onSize} />
    </>
  )
}

function Loading({ label }: { label: string }) {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      <div className="skel skel-block" aria-hidden="true" />
    </div>
  )
}
