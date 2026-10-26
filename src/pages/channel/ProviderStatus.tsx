import type { UseQueryResult } from '@tanstack/react-query'
import { IconCircleCheck, IconCircleDashed, IconRefresh } from '@tabler/icons-react'
import { ErrorNotice } from '@/components/ErrorNotice'
import { ButtonSpinner } from '@/components/Spinner'
import type { WhatsAppStatus } from './types'

interface ProviderStatusProps {
  query: UseQueryResult<WhatsAppStatus>
}

function Filled({ ok }: { ok: boolean }) {
  return ok ? (
    <span className="tag t-ok">
      <IconCircleCheck size={14} aria-hidden="true" />
      Terisi
    </span>
  ) : (
    <span className="tag t-warn">
      <IconCircleDashed size={14} aria-hidden="true" />
      Belum diisi
    </span>
  )
}

// Hanya boolean yang dibaca dari backend: halaman ini tidak pernah punya nilai secret untuk ditampilkan.
function checklist(status: WhatsAppStatus): { label: string; set: boolean }[] {
  return [
    { label: 'Token Akses Meta', set: status.secrets.meta_access_token === true },
    { label: 'App Secret Meta', set: status.secrets.meta_app_secret === true },
    { label: 'Verify Token Meta', set: status.secrets.meta_verify_token === true },
    { label: 'Phone Number ID', set: status.phone_number_id_set === true },
    { label: 'WABA ID', set: status.waba_id_set === true },
  ]
}

export function ProviderStatus({ query }: ProviderStatusProps) {
  const status = query.data
  const polling = status?.provider === 'baileys' && status.baileys.state !== 'connected'

  return (
    <section className="card" aria-labelledby="ch-status-title">
      <div className="ch-panel-head">
        <h2 id="ch-status-title">Status Sambungan</h2>
        <button type="button" className="btn out sm" onClick={() => void query.refetch()} disabled={query.isFetching}>
          {query.isFetching ? <ButtonSpinner /> : <IconRefresh size={16} aria-hidden="true" />}
          Muat Ulang
        </button>
      </div>

      {query.isLoading ? (
        <div role="status" aria-live="polite">
          <span className="sr-only">Memuat status sambungan...</span>
          <div aria-hidden="true">
            <div className="skel skel-line" />
            <div className="skel skel-line" />
            <div className="skel skel-line" />
          </div>
        </div>
      ) : null}

      {query.isError ? <ErrorNotice error={query.error} onRetry={() => void query.refetch()} /> : null}

      {status ? (
        <>
          <dl className="ch-facts">
            <div>
              <dt>Provider Aktif</dt>
              <dd>
                <span className="tag t-acc">{status.provider === 'baileys' ? 'Baileys' : 'Meta'}</span>
              </dd>
            </div>
            <div>
              <dt>Bot</dt>
              <dd>
                <span className={'tag ' + (status.bot_enabled ? 't-ok' : 't-mut')}>{status.bot_enabled ? 'Hidup' : 'Mati'}</span>
              </dd>
            </div>
            <div>
              <dt>Mode Uji</dt>
              <dd>
                <span className={'tag ' + (status.test_mode ? 't-warn' : 't-mut')}>{status.test_mode ? 'Aktif' : 'Nonaktif'}</span>
              </dd>
            </div>
          </dl>
          <h3>Kelengkapan Konfigurasi</h3>
          <ul className="ch-checklist">
            {checklist(status).map((item) => (
              <li key={item.label}>
                <span>{item.label}</span>
                <Filled ok={item.set} />
              </li>
            ))}
          </ul>
          <p className="hint">Nilai token dan secret tidak pernah ditampilkan di sini; hanya terisi atau belum.</p>
          {polling ? <p className="hint">Status diperbarui otomatis tiap 5 detik sampai Baileys tersambung.</p> : null}
        </>
      ) : null}
    </section>
  )
}
