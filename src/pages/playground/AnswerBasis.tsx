import { formatNumber, formatUsd } from '@/lib/format'
import { fallbackReasonLabel } from '@/lib/labels'
import { MODE_LABELS } from './draft'
import type { PlaygroundReply } from './history'

// Penolakan yang diputuskan sistem, bukan jawaban model.
const SYSTEM_REJECTIONS: Record<string, string> = {
  low_score:
    'Ini penolakan dari sisi sistem: tidak ada bagian dokumen yang cukup mirip dengan pertanyaan, jadi model tidak dipanggil.',
  model_error:
    'Ini penolakan dari sisi sistem: model tidak bisa dihubungi atau gagal menjawab, jadi pelanggan menerima pesan cadangan.',
  invalid_citation:
    'Ini penolakan dari sisi sistem: sitasi pada jawaban model tidak valid, jadi jawaban dibuang dan diganti pesan cadangan.',
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </>
  )
}

export function AnswerBasis({ result }: { result: PlaygroundReply | undefined }) {
  return (
    <section className="card pg-pad" aria-labelledby="pg-basis-title">
      <h2 id="pg-basis-title" className="pg-h2">
        Dasar Jawaban
      </h2>
      {!result ? (
        <p className="muted">Kirim pertanyaan lalu pilih balasan bot untuk melihat sumber, token, dan biayanya.</p>
      ) : (
        <div className="stack">
          <div>
            <h3 className="pg-h3">Sumber</h3>
            {result.sources.length > 0 ? (
              <ul className="pg-sources">
                {result.sources.map((source) => (
                  <li key={source.ref_no}>
                    <details>
                      <summary>
                        {source.document_title} › {source.heading_path} <span className="muted">(Ref {source.ref_no})</span>
                      </summary>
                      <div className="pg-text pg-source-body">{source.body}</div>
                    </details>
                  </li>
                ))}
              </ul>
            ) : result.fallback_reason ? (
              <p className="muted">Tidak ada sumber dokumen yang dipakai.</p>
            ) : (
              <p className="muted">Balasan tanpa sumber dokumen (sapaan atau basa-basi)</p>
            )}
          </div>

          {result.fallback_reason && (
            <div className="notice warn" role="note">
              <div>
                <strong>Alasan fallback:</strong> <span>{fallbackReasonLabel(result.fallback_reason)}</span>
                {SYSTEM_REJECTIONS[result.fallback_reason] && <p>{SYSTEM_REJECTIONS[result.fallback_reason]}</p>}
              </div>
            </div>
          )}

          <dl className="pg-facts">
            <Row label="Mode Konteks" value={result.mode ? (MODE_LABELS[result.mode] ?? result.mode) : '-'} />
            <Row label="Model" value={result.model ?? '-'} />
            <Row label="Token Input" value={result.usage ? formatNumber(result.usage.input) : '-'} />
            <Row label="Token Output" value={result.usage ? formatNumber(result.usage.output) : '-'} />
            <Row label="Cache Baca" value={result.usage ? formatNumber(result.usage.cache_read) : '-'} />
            <Row label="Cache Tulis" value={result.usage ? formatNumber(result.usage.cache_write) : '-'} />
            <Row label="Biaya" value={formatUsd(result.cost)} />
            <Row label="Pengaturan" value={result.settings === 'draft' ? 'Draf' : 'Tersimpan'} />
          </dl>
        </div>
      )}
    </section>
  )
}
