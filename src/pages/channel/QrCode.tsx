import { useEffect, useMemo, useState } from 'react'
import QRCode from 'qrcode'
import { getHttp } from '@/api/client'
import { ButtonSpinner } from '@/components/Spinner'
import { BAILEYS_PATH, baileysMessage } from './api'

const MARGIN = 2
export const QR_POLL_MS = 3000
export const QR_LABEL = 'Kode QR untuk menautkan WhatsApp'

// Menggambar QR sebagai SVG inline dari matriks modul. Sengaja bukan toDataURL ke <img>:
// CSP nginx (img-src 'self') memblokir gambar data:, sedangkan elemen SVG inline tidak.
export function QrImage({ text }: { text: string }) {
  const drawing = useMemo(() => {
    try {
      const { modules } = QRCode.create(text, { errorCorrectionLevel: 'M' })
      let path = ''
      for (let row = 0; row < modules.size; row += 1) {
        for (let col = 0; col < modules.size; col += 1) {
          if (modules.get(row, col)) path += `M${col + MARGIN} ${row + MARGIN}h1v1h-1z`
        }
      }
      return { span: modules.size + MARGIN * 2, path }
    } catch {
      return null
    }
  }, [text])

  if (!drawing) {
    return (
      <p className="hint" role="alert">
        QR tidak bisa ditampilkan. Coba lagi sebentar lagi.
      </p>
    )
  }
  return (
    <svg className="ch-qr" role="img" aria-label={QR_LABEL} viewBox={`0 0 ${drawing.span} ${drawing.span}`} width={240} height={240} shapeRendering="crispEdges">
      <rect width={drawing.span} height={drawing.span} fill="#fff" />
      <path d={drawing.path} fill="#000" />
    </svg>
  )
}

interface QrState {
  loaded: boolean
  qr: string | null
  error: unknown
}

// QR hanya hidup di state komponen ini: tidak masuk cache query, URL, atau storage, dan hilang
// begitu panel ditutup. Polling berjalan selagi komponen terpasang dan berhenti saat dilepas.
export function QrPanel() {
  const [state, setState] = useState<QrState>({ loaded: false, qr: null, error: null })

  useEffect(() => {
    const controller = new AbortController()
    let active = true
    let timer: ReturnType<typeof setTimeout> | undefined

    const tick = async () => {
      try {
        const response = await getHttp().get<{ qr: string | null }>(`${BAILEYS_PATH}/qr`, { signal: controller.signal })
        if (active) setState({ loaded: true, qr: response.data.qr, error: null })
      } catch (error) {
        if (active) setState({ loaded: true, qr: null, error })
      }
      if (active) timer = setTimeout(() => void tick(), QR_POLL_MS)
    }
    void tick()

    return () => {
      active = false
      controller.abort()
      clearTimeout(timer)
    }
  }, [])

  return (
    <div className="ch-sub-body">
      <p className="hint">{'Di ponsel, buka WhatsApp > Perangkat tertaut > Tautkan perangkat, lalu pindai kode ini. Kode berganti tiap beberapa detik.'}</p>
      {!state.loaded ? (
        <p role="status" className="ch-loading">
          <ButtonSpinner />
          <span>Memuat QR...</span>
        </p>
      ) : state.error ? (
        <div className="notice bad" role="alert">
          <span>{baileysMessage(state.error)}</span>
        </div>
      ) : state.qr ? (
        <QrImage text={state.qr} />
      ) : (
        <p className="muted">Tidak ada QR. Sudah terhubung atau menunggu sambungan.</p>
      )}
    </div>
  )
}
