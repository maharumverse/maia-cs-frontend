import { useCallback, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { IconArrowLeft, IconEye, IconEyeOff, IconInbox } from '@tabler/icons-react'
import { ApiError, parseApiError } from '@/api/errors'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { EmptyState } from '@/components/EmptyState'
import { ErrorNotice } from '@/components/ErrorNotice'
import { PageSkeleton } from '@/components/Skeleton'
import { formatDateTime } from '@/lib/format'
import { CHANNEL_LABELS } from '@/lib/labels'
import { revealNumber, useConversation, type ConversationDetail } from '@/pages/percakapan/api'
import { Transcript } from '@/pages/percakapan/Transcript'
import '@/pages/percakapan/percakapan.css'

const PROVIDER_LABELS: Record<string, string> = { meta: 'Meta', baileys: 'Baileys' }

// Query string daftar sebelumnya dibawa lewat state navigasi (bukan disimpan di tempat lain).
function useBackTo(): string {
  const { state } = useLocation() as { state: unknown }
  const search = typeof state === 'object' && state !== null && 'search' in state ? state.search : ''
  return '/percakapan' + (typeof search === 'string' && search.startsWith('?') ? search : '')
}

function BackLink({ to }: { to: string }) {
  return (
    <Link className="btn ghost" to={to}>
      <IconArrowLeft size={16} aria-hidden="true" />
      Kembali ke Daftar
    </Link>
  )
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  )
}

// Nomor penuh hanya hidup di state komponen ini: tidak masuk cache query, URL, atau penyimpanan,
// dan hilang saat komponen dilepas (berpindah halaman).
function DetailBody({ conversation, back }: { conversation: ConversationDetail; back: string }) {
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const [fullNumber, setFullNumber] = useState<string | null | undefined>(undefined)
  const cancel = useCallback(() => {
    setConfirming(false)
    setError(null)
  }, [])

  async function reveal() {
    setBusy(true)
    setError(null)
    try {
      setFullNumber(await revealNumber(conversation.id))
      setConfirming(false)
    } catch (caught) {
      setError(parseApiError(caught))
    } finally {
      setBusy(false)
    }
  }

  const revealed = fullNumber !== undefined
  const channel = CHANNEL_LABELS[conversation.channel] ?? conversation.channel

  return (
    <>
      <header className="pagehead">
        <h1>Rincian Percakapan</h1>
        <p>Transkrip lengkap beserta sumber, alasan fallback, dan penilaian pelanggan.</p>
      </header>
      <div className="cv-head-actions">
        <BackLink to={back} />
        {conversation.number_masked !== null ? (
          revealed ? (
            <button type="button" className="btn out" onClick={() => setFullNumber(undefined)}>
              <IconEyeOff size={16} aria-hidden="true" />
              Sembunyikan Nomor
            </button>
          ) : (
            <button type="button" className="btn out" onClick={() => setConfirming(true)}>
              <IconEye size={16} aria-hidden="true" />
              Tampilkan Nomor Lengkap
            </button>
          )
        ) : null}
      </div>
      <section className="card cv-head" aria-label="Informasi percakapan">
        <dl className="cv-facts">
          <Fact label="Channel">
            <span className={'tag ' + (conversation.channel === 'whatsapp' ? 't-ok' : 't-info')}>{channel}</span>
          </Fact>
          <Fact label="Provider">{conversation.provider ? (PROVIDER_LABELS[conversation.provider] ?? conversation.provider) : '-'}</Fact>
          <Fact label="Nomor">
            <span aria-live="polite">{revealed ? (fullNumber ?? 'Nomor tidak tersedia') : (conversation.number_masked ?? '-')}</span>
          </Fact>
          {conversation.contact_name ? <Fact label="Nama Kontak">{conversation.contact_name}</Fact> : null}
          <Fact label="Mulai">{formatDateTime(conversation.started_at)}</Fact>
          <Fact label="Terakhir Aktif">{formatDateTime(conversation.last_activity_at)}</Fact>
        </dl>
      </section>
      <Transcript messages={conversation.messages} />
      <ConfirmDialog
        open={confirming}
        title="Tampilkan nomor lengkap?"
        confirmLabel="Tampilkan Nomor"
        busy={busy}
        onConfirm={() => void reveal()}
        onCancel={cancel}
      >
        <p>
          Nomor lengkap pelanggan {conversation.number_masked ?? ''} akan ditampilkan di layar ini. Tindakan ini tercatat di log audit beserta NIP Anda.
        </p>
        {error ? <ErrorNotice error={error} /> : null}
      </ConfirmDialog>
    </>
  )
}

export default function PercakapanDetail() {
  const { id } = useParams()
  const back = useBackTo()
  const query = useConversation(id)

  if (query.isLoading) return <PageSkeleton label="Memuat percakapan..." />

  if (query.error instanceof ApiError && query.error.status === 404) {
    return (
      <EmptyState icon={IconInbox} message="Percakapan tidak ditemukan." action={<BackLink to={back} />} />
    )
  }
  if (query.error || !query.data) {
    return (
      <div className="stack">
        <ErrorNotice error={query.error} onRetry={() => void query.refetch()} />
        <div>
          <BackLink to={back} />
        </div>
      </div>
    )
  }
  // key: pindah ke percakapan lain selalu mulai dengan nomor tersamar.
  return <DetailBody key={query.data.id} conversation={query.data} back={back} />
}
