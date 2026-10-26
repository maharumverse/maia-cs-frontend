import { useId } from 'react'
import type { Schemas } from '@/api/types'
import { LIMITS } from './botConfig'
import { TextAreaField } from './fields'

type PerChannelText = Schemas['PerChannelText']

interface Props {
  greeting: PerChannelText
  fallback: PerChannelText
  onGreeting: (value: PerChannelText) => void
  onFallback: (value: PerChannelText) => void
}

export function MessagesSection({ greeting, fallback, onGreeting, onFallback }: Props) {
  const headingId = useId()
  return (
    <section className="card" aria-labelledby={headingId}>
      <h2 id={headingId}>Pesan</h2>
      <p className="muted section-intro">Pesan tetap yang dikirim bot, terpisah untuk widget web dan WhatsApp.</p>
      <div className="stack">
        <div className="grid-2">
          <TextAreaField label="Pesan Pembuka (Web)" value={greeting.web} maxLength={LIMITS.message} onChange={(web) => onGreeting({ ...greeting, web })} />
          <TextAreaField label="Pesan Pembuka (WhatsApp)" value={greeting.whatsapp} maxLength={LIMITS.message} onChange={(whatsapp) => onGreeting({ ...greeting, whatsapp })} />
        </div>
        <div className="grid-2">
          <TextAreaField
            label="Pesan Fallback (Web)"
            value={fallback.web}
            maxLength={LIMITS.message}
            onChange={(web) => onFallback({ ...fallback, web })}
            hint="Dikirim saat bot tidak menemukan jawaban di dokumen."
          />
          <TextAreaField
            label="Pesan Fallback (WhatsApp)"
            value={fallback.whatsapp}
            maxLength={LIMITS.message}
            onChange={(whatsapp) => onFallback({ ...fallback, whatsapp })}
            hint="Dikirim saat bot tidak menemukan jawaban di dokumen."
          />
        </div>
      </div>
    </section>
  )
}
