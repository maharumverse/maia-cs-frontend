import type { ReactNode } from 'react'
import { IconInbox } from '@tabler/icons-react'
import { EmptyState } from '@/components/EmptyState'
import { ErrorNotice } from '@/components/ErrorNotice'

export interface Column<T> {
  key: string
  header: string
  render: (row: T) => ReactNode
  // Angka dan uang rata kanan dengan angka tabular.
  numeric?: boolean
}

interface DataTableProps<T> {
  caption: string
  columns: Column<T>[]
  rows: T[] | undefined
  rowKey: (row: T) => string
  // Muat pertama (belum ada data): skeleton. Muat ulang atau ganti halaman: baris lama tetap tampil.
  loading: boolean
  refetching?: boolean
  error?: unknown
  onRetry?: () => void
  emptyMessage: string
  onRowClick?: (row: T) => void
  skeletonRows?: number
}

// Tabel data bersama (table.component.md): skeleton, kosong, dan galat saling eksklusif;
// header selalu tampil; sort dan filter dikerjakan server.
export function DataTable<T>({
  caption,
  columns,
  rows,
  rowKey,
  loading,
  refetching,
  error,
  onRetry,
  emptyMessage,
  onRowClick,
  skeletonRows = 5,
}: DataTableProps<T>) {
  const showSkeleton = loading && rows === undefined
  const showEmpty = !showSkeleton && !error && rows !== undefined && rows.length === 0

  return (
    <>
      {error ? <ErrorNotice error={error} onRetry={onRetry} /> : null}
      <div className={'tablewrap' + (refetching ? ' refetching' : '')} aria-busy={showSkeleton || refetching ? true : undefined}>
        <table>
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key} scope="col" className={column.numeric ? 'num' : undefined}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {showSkeleton
              ? Array.from({ length: skeletonRows }, (_, index) => (
                  <tr key={index} aria-hidden="true">
                    {columns.map((column, position) => (
                      <td key={column.key}>
                        <div className="skel skel-cell" style={{ width: `${55 + ((index + position) % 4) * 12}%` }} />
                      </td>
                    ))}
                  </tr>
                ))
              : (rows ?? []).map((row) => (
                  <tr key={rowKey(row)} className={onRowClick ? 'clk' : undefined} onClick={onRowClick ? () => onRowClick(row) : undefined}>
                    {columns.map((column) => (
                      <td key={column.key} className={column.numeric ? 'num' : undefined}>
                        {column.render(row)}
                      </td>
                    ))}
                  </tr>
                ))}
          </tbody>
        </table>
        {showSkeleton ? (
          <div role="status" aria-live="polite" className="sr-only">
            Memuat data...
          </div>
        ) : null}
        {showEmpty ? <EmptyState icon={IconInbox} message={emptyMessage} /> : null}
      </div>
    </>
  )
}
