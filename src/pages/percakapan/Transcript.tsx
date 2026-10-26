import { IconFileUnknown, IconThumbDown, IconThumbUp } from '@tabler/icons-react'
import { formatDateTime, formatNumber, formatUsd } from '@/lib/format'
import { fallbackReasonLabel } from '@/lib/labels'
import type { MessageOut } from '@/pages/percakapan/api'

const DELIVERY_LABELS: Record<string, string> = {
  sent: 'Terkirim',
  delivered: 'Diterima',
  read: 'Dibaca',
  failed: 'Gagal terkirim',
}

function metaParts(message: MessageOut): string[] {
  const parts: string[] = []
  if (message.model) parts.push(message.model)
  if (message.cost !== null) parts.push(formatUsd(message.cost))
  if (message.input_tokens !== null || message.output_tokens !== null) {
    parts.push(`${formatNumber(message.input_tokens ?? 0)} token masuk, ${formatNumber(message.output_tokens ?? 0)} token keluar`)
  }
  if (message.delivery_status) parts.push(DELIVERY_LABELS[message.delivery_status] ?? message.delivery_status)
  return parts
}

function MessageBlock({ message }: { message: MessageOut }) {
  const bot = message.role === 'assistant'
  const meta = metaParts(message)
  return (
    <li className={'cv-msg ' + (bot ? 'cv-bot' : 'cv-user')}>
      <div className="cv-msg-head">
        <strong>{bot ? 'Bot' : 'Pelanggan'}</strong>
        <time dateTime={message.created_at}>{formatDateTime(message.created_at)}</time>
        {message.kind === 'non_text' ? (
          <span className="tag t-mut">
            <IconFileUnknown size={14} aria-hidden="true" />
            Pesan non-teks
          </span>
        ) : null}
        {message.fallback_reason ? <span className="tag t-warn">{fallbackReasonLabel(message.fallback_reason)}</span> : null}
        {message.feedback === 'up' ? (
          <span className="tag t-ok">
            <IconThumbUp size={14} aria-hidden="true" />
            Jempol naik
          </span>
        ) : null}
        {message.feedback === 'down' ? (
          <span className="tag t-bad">
            <IconThumbDown size={14} aria-hidden="true" />
            Jempol turun
          </span>
        ) : null}
      </div>
      {/* Teks biasa: React meloloskan isinya, pre-wrap menjaga baris baru. */}
      <div className="cv-text">{message.text}</div>
      {message.sources.length > 0 ? (
        <div className="cv-sources">
          <h3>Sumber</h3>
          <ol>
            {message.sources.map((source) => (
              <li key={source.ref_no}>
                {source.document_title} › {source.heading_path}
              </li>
            ))}
          </ol>
        </div>
      ) : null}
      {meta.length > 0 ? <p className="cv-meta">{meta.join(' · ')}</p> : null}
    </li>
  )
}

export function Transcript({ messages }: { messages: MessageOut[] }) {
  if (messages.length === 0) return <p className="muted">Percakapan ini belum memiliki pesan.</p>
  return (
    <ol className="cv-transcript" aria-label="Transkrip percakapan">
      {messages.map((message) => (
        <MessageBlock key={message.id} message={message} />
      ))}
    </ol>
  )
}
