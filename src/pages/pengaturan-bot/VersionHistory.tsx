import { useCallback, useId, useState } from 'react'
import { IconHistory } from '@tabler/icons-react'
import { ApiError, userMessage } from '@/api/errors'
import { useRestoreVersion, useVersions } from '@/api/settings'
import type { Schemas } from '@/api/types'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { DataTable, type Column } from '@/components/DataTable'
import { Pager } from '@/components/Pager'
import { pagingOf, useUrlParams } from '@/hooks/useUrlParams'
import { formatDateTime } from '@/lib/format'

type Version = Schemas['VersionSummary']

const PAGING_DEFAULTS = { hal: '1', ukuran: '20' }

interface Props {
  activeVersion: number
  // Form punya perubahan yang belum disimpan; memulihkan akan membuangnya.
  dirty: boolean
}

// Kartu terpisah dari form: tidak ikut dirty form. Memulihkan membuat versi baru di backend dan
// cache pengaturan diperbarui, sehingga form di atasnya memuat nilai baru sendiri.
export function VersionHistory({ activeVersion, dirty }: Props) {
  const headingId = useId()
  const noteId = useId()
  const [params, setParams] = useUrlParams(PAGING_DEFAULTS)
  const { limit, offset } = pagingOf(params)
  const versions = useVersions(limit, offset)
  const restore = useRestoreVersion()
  const [target, setTarget] = useState<number | null>(null)
  const [note, setNote] = useState('')
  const [done, setDone] = useState<{ from: number; to: number } | null>(null)

  function open(version: number) {
    restore.reset()
    setNote('')
    setDone(null)
    setTarget(version)
  }

  // Harus stabil: ConfirmDialog memasang ulang efek fokusnya setiap onCancel berganti, sehingga
  // fokus akan kembali ke Batal pada tiap ketikan di kolom catatan.
  const pending = restore.isPending
  const close = useCallback(() => {
    if (!pending) setTarget(null)
  }, [pending])

  function confirm() {
    if (target === null) return
    const from = target
    restore.mutate(
      { version: from, note },
      {
        onSuccess: (saved) => {
          setTarget(null)
          setDone({ from, to: saved.version })
        },
      },
    )
  }

  const columns: Column<Version>[] = [
    {
      key: 'version',
      header: 'Versi',
      numeric: true,
      render: (row) => (
        <span className="version-cell">
          {row.version}
          {row.version === activeVersion ? <span className="tag t-ok">Aktif</span> : null}
        </span>
      ),
    },
    { key: 'by', header: 'Pengubah (NIP)', render: (row) => row.changed_by_nip },
    {
      key: 'note',
      header: 'Catatan',
      render: (row) => (
        <>
          {row.change_note ? <span>{row.change_note}</span> : <span className="muted">-</span>}
          {row.restored_from_version !== null ? <span className="tag t-info">Dipulihkan dari v{row.restored_from_version}</span> : null}
        </>
      ),
    },
    { key: 'at', header: 'Waktu', render: (row) => formatDateTime(row.created_at) },
    {
      key: 'act',
      header: 'Aksi',
      render: (row) => (
        <div className="row-actions">
          <button type="button" className="btn sm out" aria-label={`Pulihkan versi ${row.version}`} disabled={row.version === activeVersion || restore.isPending} onClick={() => open(row.version)}>
            <IconHistory size={16} aria-hidden="true" />
            Pulihkan
          </button>
        </div>
      ),
    },
  ]

  const restoreError = restore.error
  const total = versions.data?.total ?? 0

  return (
    <section className="card" aria-labelledby={headingId}>
      <h2 id={headingId}>Riwayat Versi</h2>
      <p className="muted section-intro">Setiap penyimpanan di halaman pengaturan membuat versi baru. Pulihkan untuk kembali ke isi versi lama.</p>
      {done ? (
        <div className="notice ok" role="status">
          <span>Versi {done.from} dipulihkan sebagai versi {done.to} dan langsung berlaku.</span>
        </div>
      ) : null}
      <DataTable<Version>
        caption="Riwayat versi"
        columns={columns}
        rows={versions.data?.items}
        rowKey={(row) => String(row.version)}
        loading={versions.isLoading}
        refetching={versions.isFetching && versions.data !== undefined}
        error={versions.error}
        onRetry={() => void versions.refetch()}
        emptyMessage="Belum ada versi tersimpan."
      />
      {total > 0 ? (
        <Pager
          label="Halaman riwayat versi"
          total={total}
          limit={limit}
          offset={offset}
          onPage={(page) => setParams({ hal: String(page) })}
          onSize={(size) => setParams({ ukuran: String(size) })}
        />
      ) : null}
      <ConfirmDialog
        open={target !== null}
        title={`Pulihkan ke versi ${target ?? ''}?`}
        confirmLabel="Pulihkan"
        destructive={dirty}
        busy={restore.isPending}
        onConfirm={confirm}
        onCancel={close}
      >
        <div className="stack">
          <p>
            Ini membuat versi baru dengan isi sama seperti versi {target}, lalu langsung berlaku. Seluruh pengaturan (bot, model, limit, dan channel) ikut dikembalikan, dan versi lama tetap ada di riwayat.
          </p>
          {dirty ? <p className="notice warn">Perubahan di form yang belum disimpan akan dibuang.</p> : null}
          <div className="field">
            <label htmlFor={noteId}>Catatan (opsional)</label>
            <input id={noteId} type="text" maxLength={500} value={note} disabled={restore.isPending} onChange={(event) => setNote(event.target.value)} />
          </div>
          {restoreError ? (
            <p className="notice bad" role="alert">
              {restoreError instanceof ApiError ? userMessage(restoreError) : 'Versi tidak bisa dipulihkan.'}
            </p>
          ) : null}
        </div>
      </ConfirmDialog>
    </section>
  )
}
