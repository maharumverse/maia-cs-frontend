import { useCallback, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { IconKey, IconLogout, IconQrcode, IconRefresh } from '@tabler/icons-react'
import { getHttp } from '@/api/client'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { formatDateTime } from '@/lib/format'
import { baileysMessage, BAILEYS_PATH, STATUS_KEY } from './api'
import { PairingPanel } from './PairingCode'
import { QrPanel } from './QrCode'
import type { WhatsAppStatus } from './types'

type Action = 'reconnect' | 'logout'

const STATE_TAGS: Record<string, { label: string; cls: string }> = {
  connected: { label: 'Terhubung', cls: 't-ok' },
  disconnected: { label: 'Terputus', cls: 't-warn' },
  error: { label: 'Galat', cls: 't-bad' },
}

function StateTag({ state }: { state: string | null }) {
  if (state === null) return <span className="tag t-mut">Belum ada laporan</span>
  const known = STATE_TAGS[state]
  return <span className={'tag ' + (known?.cls ?? 't-mut')}>{known?.label ?? state}</span>
}

const COPY: Record<Action, { title: string; confirm: string; done: string }> = {
  reconnect: {
    title: 'Sambung Ulang Baileys',
    confirm: 'Sambung Ulang',
    done: 'Permintaan sambung ulang diterima. Status akan diperbarui sebentar lagi.',
  },
  logout: {
    title: 'Keluarkan Perangkat Baileys',
    confirm: 'Keluarkan Perangkat',
    done: 'Perangkat dikeluarkan. Pindai QR lagi untuk menautkan perangkat.',
  },
}

export function BaileysPanel({ status }: { status: WhatsAppStatus }) {
  const client = useQueryClient()
  const { configured, state, last_error, updated_at } = status.baileys
  const [qrOpen, setQrOpen] = useState(false)
  const [pairingOpen, setPairingOpen] = useState(false)
  const [confirm, setConfirm] = useState<Action | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const run = useMutation({
    mutationFn: async (action: Action) => {
      await getHttp().post(`${BAILEYS_PATH}/${action}`)
      return action
    },
    onSuccess: (action) => {
      setConfirm(null)
      setNotice(COPY[action].done)
      if (action === 'logout') {
        setQrOpen(false)
        setPairingOpen(false)
      }
      void client.invalidateQueries({ queryKey: STATUS_KEY })
    },
  })

  const { reset } = run
  const close = useCallback(() => {
    setConfirm(null)
    reset()
  }, [reset])

  return (
    <section className="card" aria-labelledby="ch-baileys-title">
      <div className="ch-panel-head">
        <h2 id="ch-baileys-title">Koneksi Baileys</h2>
        <StateTag state={state} />
      </div>

      {!configured ? (
        <div className="notice warn">
          <span>BAILEYS_URL belum diisi di backend, jadi service Baileys belum bisa dihubungi. Isi dulu di environment backend.</span>
        </div>
      ) : null}
      {last_error ? <p className="hint">Galat terakhir: {last_error}</p> : null}
      {updated_at ? <p className="hint">Laporan terakhir: {formatDateTime(updated_at)}</p> : null}
      {notice ? (
        <div className="notice ok" role="status">
          <span>{notice}</span>
        </div>
      ) : null}

      <div className="ch-sub">
        <h3>Tautkan Perangkat</h3>
        <div className="row-actions ch-left">
          <button type="button" className="btn out" disabled={!configured} onClick={() => setQrOpen((open) => !open)} aria-expanded={qrOpen}>
            <IconQrcode size={16} aria-hidden="true" />
            {qrOpen ? 'Tutup QR' : 'Tampilkan QR'}
          </button>
          <button type="button" className="btn out" disabled={!configured} onClick={() => setPairingOpen((open) => !open)} aria-expanded={pairingOpen}>
            <IconKey size={16} aria-hidden="true" />
            {pairingOpen ? 'Tutup Kode Pairing' : 'Pakai Kode Pairing'}
          </button>
        </div>
        {qrOpen ? <QrPanel /> : null}
        {pairingOpen ? <PairingPanel /> : null}
      </div>

      <div className="ch-sub">
        <h3>Kelola Sambungan</h3>
        <p className="hint">Gunakan bila bot berhenti membalas. Mengeluarkan perangkat menghapus sesi dan tidak bisa dibatalkan.</p>
        <div className="row-actions ch-left">
          <button type="button" className="btn out" disabled={!configured} onClick={() => setConfirm('reconnect')}>
            <IconRefresh size={16} aria-hidden="true" />
            Sambung Ulang
          </button>
          <button type="button" className="btn bad" disabled={!configured} onClick={() => setConfirm('logout')}>
            <IconLogout size={16} aria-hidden="true" />
            Keluarkan Perangkat
          </button>
        </div>
      </div>

      {confirm ? (
        <ConfirmDialog
          open
          title={COPY[confirm].title}
          confirmLabel={COPY[confirm].confirm}
          destructive={confirm === 'logout'}
          busy={run.isPending}
          onConfirm={() => run.mutate(confirm)}
          onCancel={close}
        >
          {confirm === 'logout' ? (
            <p>Mengeluarkan perangkat tertaut Baileys akan menghapus sesi di server. Bot berhenti menerima dan membalas pesan WhatsApp sampai Anda memindai QR lagi.</p>
          ) : (
            <p>Sambungan perangkat tertaut Baileys diputus sebentar lalu disambung lagi dengan sesi yang ada. Pesan yang masuk selama itu bisa terlambat dibalas.</p>
          )}
          {run.isError ? (
            <div className="notice bad" role="alert">
              <span>{baileysMessage(run.error)}</span>
            </div>
          ) : null}
        </ConfirmDialog>
      ) : null}
    </section>
  )
}
