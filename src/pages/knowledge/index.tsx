import { IconUpload } from '@tabler/icons-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError } from '@/api/errors'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { ErrorNotice } from '@/components/ErrorNotice'
import { Pager } from '@/components/Pager'
import { SearchBox } from '@/components/SearchBox'
import { ButtonSpinner } from '@/components/Spinner'
import { useUrlParams, pagingOf } from '@/hooks/useUrlParams'
import { uploadFiles, useDocuments, useRowActions, useSummary, type DocStatus, type KnowledgeDoc, type ListParams, type UploadResult } from '@/pages/knowledge/api'
import { DetailPanel, type DetailTab } from '@/pages/knowledge/DetailPanel'
import { DocumentsTable } from '@/pages/knowledge/DocumentsTable'
import { MAX_FILES, rejectLocally } from '@/pages/knowledge/files'
import { SummaryTiles } from '@/pages/knowledge/SummaryTiles'
import { UploadResults } from '@/pages/knowledge/UploadResults'
import '@/pages/knowledge/knowledge.css'

const DEFAULTS = { q: '', aktif: '', status: '', hal: '', ukuran: '', dok: '', tab: '', bhal: '', bukuran: '' }

const STATUS_FILTERS: DocStatus[] = ['processing', 'ready', 'failed']
const STATUS_FILTER_LABELS: Record<DocStatus, string> = { processing: 'Diproses', ready: 'Siap', failed: 'Gagal' }

export default function KnowledgePage() {
  const [params, update] = useUrlParams(DEFAULTS)
  const { limit, offset } = pagingOf(params)
  const status = STATUS_FILTERS.find((item) => item === params.status)
  const query: ListParams = { limit, offset }
  if (params.q) query.q = params.q
  if (status) query.status = status
  if (params.aktif === '1') query.is_active = true
  if (params.aktif === '0') query.is_active = false

  const documents = useDocuments(query)
  const summary = useSummary()
  const actions = useRowActions()

  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<unknown>(null)
  const [results, setResults] = useState<UploadResult[] | null>(null)
  const [pendingDelete, setPendingDelete] = useState<KnowledgeDoc | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  const data = documents.data
  const total = data?.total ?? 0
  const filtered = Boolean(params.q || status || params.aktif)

  // Menghapus dokumen terakhir di halaman belakang: pindah ke halaman terakhir yang masih ada.
  useEffect(() => {
    if (!data || data.items.length > 0 || data.total === 0 || offset === 0) return
    update({ hal: String(Math.max(1, Math.ceil(data.total / limit))) })
  }, [data, offset, limit, update])

  const onSearch = useCallback((value: string) => update({ q: value }), [update])

  const onFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(event.target.files ?? [])
    event.target.value = ''
    if (picked.length === 0) return
    void upload(picked)
  }

  const upload = async (picked: File[]) => {
    setUploadError(null)
    setResults(null)
    actions.dismiss()
    const local: UploadResult[] = []
    const accepted: File[] = []
    for (const file of picked) {
      const rejected = rejectLocally(file)
      if (rejected) local.push(rejected)
      else accepted.push(file)
    }
    if (accepted.length === 0) {
      setResults(local)
      return
    }
    if (accepted.length > MAX_FILES) {
      setUploadError(new ApiError(422, 'TOO_MANY_FILES', `Maksimal ${MAX_FILES} berkas per unggahan`))
      return
    }
    setUploading(true)
    try {
      const fromServer = await uploadFiles(accepted)
      setResults([...local, ...fromServer])
      await actions.refresh()
    } catch (caught) {
      setUploadError(caught)
    } finally {
      setUploading(false)
    }
  }

  const confirmDelete = async () => {
    if (!pendingDelete) return
    const target = pendingDelete
    const ok = await actions.remove(target)
    if (!ok) return
    setPendingDelete(null)
    if (params.dok === target.id) closePanel()
  }

  const tab: DetailTab = params.tab === 'bagian' ? 'bagian' : 'isi'
  const sectionPaging = pagingOf({ hal: params.bhal, ukuran: params.bukuran })
  const closePanel = useCallback(() => update({ dok: '', tab: '', bhal: '', bukuran: '' }, { keepPage: true }), [update])

  return (
    <>
      <header className="pagehead">
        <h1>Knowledge</h1>
        <p>Dokumen sumber jawaban bot. Hanya dokumen aktif yang dipakai bot.</p>
      </header>

      <SummaryTiles summary={summary.data} error={summary.error} onRetry={() => void summary.refetch()} />

      <div className="toolbar">
        <SearchBox label="Cari dokumen" placeholder="Cari judul atau nama berkas" value={params.q} onChange={onSearch} />
        <div className="field">
          <label htmlFor="filter-aktif">Keaktifan</label>
          <select id="filter-aktif" value={params.aktif} onChange={(event) => update({ aktif: event.target.value })}>
            <option value="">Semua</option>
            <option value="1">Aktif</option>
            <option value="0">Nonaktif</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="filter-status">Status Proses</label>
          <select id="filter-status" value={status ?? ''} onChange={(event) => update({ status: event.target.value })}>
            <option value="">Semua</option>
            {STATUS_FILTERS.map((item) => (
              <option key={item} value={item}>
                {STATUS_FILTER_LABELS[item]}
              </option>
            ))}
          </select>
        </div>
        <div className="toolbar-end">
          <input ref={fileInput} type="file" hidden multiple accept=".md,.txt" aria-label="Pilih berkas dokumen" onChange={onFiles} />
          <button type="button" className="btn pri" disabled={uploading} onClick={() => fileInput.current?.click()}>
            {uploading ? <ButtonSpinner /> : <IconUpload size={16} aria-hidden="true" />}
            {uploading ? 'Memproses...' : 'Unggah Dokumen'}
          </button>
        </div>
      </div>

      {results ? <UploadResults results={results} onClose={() => setResults(null)} /> : null}
      {uploadError ? <ErrorNotice error={uploadError} /> : null}
      {actions.error ? <ErrorNotice error={actions.error} /> : null}
      {actions.info ? (
        <div className="notice info" role="status">
          <span>{actions.info}</span>
        </div>
      ) : null}

      <DocumentsTable
        rows={data?.items}
        loading={documents.isPending}
        refetching={documents.isFetching && data !== undefined}
        error={documents.error}
        emptyMessage={filtered ? 'Tidak ada dokumen yang cocok dengan pencarian atau filter.' : 'Belum ada dokumen. Unggah dokumen pertama untuk mulai.'}
        busy={actions.busy}
        onRetry={() => void documents.refetch()}
        onView={(doc) => update({ dok: doc.id, tab: '', bhal: '', bukuran: '' }, { keepPage: true })}
        onToggle={(doc, active) => void actions.toggle(doc, active)}
        onReingest={(doc) => void actions.reingest(doc)}
        onDelete={setPendingDelete}
      />

      {data && total > 0 ? (
        <Pager
          label="Halaman dokumen"
          total={total}
          limit={limit}
          offset={offset}
          onPage={(page) => update({ hal: String(page) })}
          onSize={(size) => update({ ukuran: String(size), hal: '' })}
        />
      ) : null}

      {params.dok ? (
        <DetailPanel
          id={params.dok}
          tab={tab}
          limit={sectionPaging.limit}
          offset={sectionPaging.offset}
          onTab={(next) => update({ tab: next, bhal: '' }, { keepPage: true })}
          onPage={(page) => update({ bhal: String(page) }, { keepPage: true })}
          onSize={(size) => update({ bukuran: String(size), bhal: '' }, { keepPage: true })}
          onClose={closePanel}
        />
      ) : null}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Hapus Dokumen"
        confirmLabel="Hapus Dokumen"
        destructive
        busy={pendingDelete ? actions.busy.has(pendingDelete.id) : false}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setPendingDelete(null)}
      >
        <p>
          Dokumen <strong>{pendingDelete?.original_filename}</strong> ({pendingDelete?.title}) dan seluruh bagiannya akan dihapus permanen. Bot tidak lagi bisa memakainya untuk menjawab.
        </p>
      </ConfirmDialog>
    </>
  )
}
