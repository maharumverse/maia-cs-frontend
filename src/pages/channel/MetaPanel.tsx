import { useMutation } from '@tanstack/react-query'
import { IconPlugConnected } from '@tabler/icons-react'
import { getHttp } from '@/api/client'
import { ErrorNotice } from '@/components/ErrorNotice'
import { ButtonSpinner } from '@/components/Spinner'
import type { MetaTestResult, WhatsAppStatus } from './types'

export function MetaPanel({ status }: { status: WhatsAppStatus }) {
  const test = useMutation({
    mutationFn: async () => (await getHttp().post<MetaTestResult>('channels/whatsapp/meta/test')).data,
  })
  const result = test.data
  const incomplete = !status.secrets.meta_access_token || !status.phone_number_id_set

  return (
    <section className="card" aria-labelledby="ch-meta-title">
      <h2 id="ch-meta-title">Koneksi Meta</h2>
      <p className="muted">Tes memanggil Graph API dengan token dan Phone Number ID yang sedang dipakai backend.</p>
      {incomplete ? (
        <div className="notice warn">
          <span>Token akses atau Phone Number ID belum terisi, jadi tes hampir pasti gagal.</span>
        </div>
      ) : null}
      <div className="row-actions ch-left">
        <button type="button" className="btn out" onClick={() => test.mutate()} disabled={test.isPending}>
          {test.isPending ? <ButtonSpinner /> : <IconPlugConnected size={16} aria-hidden="true" />}
          {test.isPending ? 'Memproses...' : 'Tes Koneksi'}
        </button>
      </div>
      {test.isError ? <ErrorNotice error={test.error} /> : null}
      {result?.ok === true ? (
        <div className="notice ok" role="status">
          <span>
            Terhubung. Nama terverifikasi: {result.verified_name ?? 'tidak tersedia'}. Nomor tampilan: {result.display_phone_number ?? 'tidak tersedia'}.
          </span>
        </div>
      ) : null}
      {result?.ok === false ? (
        <div className="notice bad" role="alert">
          <span>
            Tes koneksi gagal. Status HTTP: {result.status ?? 'tidak ada'}, kode galat: {result.code ?? 'tidak ada'}.
          </span>
        </div>
      ) : null}
    </section>
  )
}
