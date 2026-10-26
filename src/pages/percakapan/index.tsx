import { Link, useLocation, useNavigate } from 'react-router-dom'
import { IconThumbDown, IconThumbUp } from '@tabler/icons-react'
import { DataTable, type Column } from '@/components/DataTable'
import { Pager } from '@/components/Pager'
import { pagingOf, useUrlParams } from '@/hooks/useUrlParams'
import { formatDateTime, formatNumber, formatUsd } from '@/lib/format'
import { CHANNEL_LABELS } from '@/lib/labels'
import { useConversations, type ConversationItem } from '@/pages/percakapan/api'
import { ExportButtons } from '@/pages/percakapan/ExportButtons'
import { FILTER_DEFAULTS, filterParams, sortParam } from '@/pages/percakapan/filters'
import { Toolbar } from '@/pages/percakapan/Toolbar'
import '@/pages/percakapan/percakapan.css'

function Feedback({ up, down }: { up: number; down: number }) {
  return (
    <span className="cv-feedback">
      <span>
        <IconThumbUp size={14} aria-hidden="true" />
        <span className="sr-only">Jempol naik </span>
        {formatNumber(up)}
      </span>
      <span>
        <IconThumbDown size={14} aria-hidden="true" />
        <span className="sr-only">Jempol turun </span>
        {formatNumber(down)}
      </span>
    </span>
  )
}

export default function PercakapanPage() {
  const [values, update] = useUrlParams(FILTER_DEFAULTS)
  const navigate = useNavigate()
  const location = useLocation()
  const filters = filterParams(values)
  const { limit, offset } = pagingOf(values)
  const query = useConversations({ ...filters, sort: sortParam(values.urut), limit, offset })

  // Query string daftar ikut ke rincian supaya "Kembali ke Daftar" memulihkan filter dan halaman.
  const state = { search: location.search }
  const open = (row: ConversationItem) => void navigate(`/percakapan/${row.id}`, { state })

  const columns: Column<ConversationItem>[] = [
    { key: 'last', header: 'Terakhir Aktif', render: (row) => formatDateTime(row.last_activity_at) },
    {
      key: 'channel',
      header: 'Channel',
      render: (row) => <span className={'tag ' + (row.channel === 'whatsapp' ? 't-ok' : 't-info')}>{CHANNEL_LABELS[row.channel] ?? row.channel}</span>,
    },
    { key: 'number', header: 'Nomor', render: (row) => row.number_masked ?? '-' },
    { key: 'messages', header: 'Pesan', numeric: true, render: (row) => formatNumber(row.message_count) },
    {
      key: 'fallback',
      header: 'Fallback',
      render: (row) => <span className={'tag ' + (row.fallback_count > 0 ? 't-warn' : 't-mut')}>{formatNumber(row.fallback_count)}</span>,
    },
    { key: 'feedback', header: 'Feedback', render: (row) => <Feedback up={row.feedback_up} down={row.feedback_down} /> },
    { key: 'cost', header: 'Biaya', numeric: true, render: (row) => formatUsd(row.cost) },
    {
      key: 'open',
      header: 'Aksi',
      render: (row) => (
        <Link
          className="btn sm out"
          to={`/percakapan/${row.id}`}
          state={state}
          aria-label={`Lihat percakapan ${row.number_masked ?? formatDateTime(row.last_activity_at)}`}
          onClick={(event) => event.stopPropagation()}
        >
          Lihat
        </Link>
      ),
    },
  ]

  const data = query.data
  return (
    <>
      <header className="pagehead">
        <h1>Percakapan</h1>
        <p>Riwayat percakapan pelanggan dengan bot. Nomor ditampilkan tersamar; isi pesan hanya bisa dibaca di rincian.</p>
      </header>
      <Toolbar values={values} onChange={(patch) => update(patch)} />
      <ExportButtons filters={filters} />
      <DataTable<ConversationItem>
        caption="Daftar percakapan"
        columns={columns}
        rows={data?.items}
        rowKey={(row) => row.id}
        loading={query.isLoading}
        refetching={query.isFetching && data !== undefined}
        error={query.error}
        onRetry={() => void query.refetch()}
        emptyMessage="Belum ada percakapan yang cocok dengan filter ini."
        onRowClick={open}
      />
      {data && data.total > 0 ? (
        <Pager
          label="Navigasi halaman percakapan"
          total={data.total}
          limit={limit}
          offset={offset}
          onPage={(page) => update({ hal: String(page) }, { keepPage: true })}
          onSize={(size) => update({ ukuran: String(size) })}
        />
      ) : null}
    </>
  )
}
