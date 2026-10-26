import { useId } from 'react'
import type { LimitsConfig } from '@/api/types'
import { NumberField } from '@/pages/model/NumberField'
import { CHANNEL_LIMITS, type ChannelErrors } from './rules'

type ChannelLimits = LimitsConfig['web']

interface ChannelCardProps {
  title: string
  value: ChannelLimits
  errors: ChannelErrors
  onChange: (next: ChannelLimits) => void
}

// Satu kartu batas untuk satu channel; nilainya tidak dibagi dengan channel lain.
export function ChannelCard({ title, value, errors, onChange }: ChannelCardProps) {
  const id = useId()
  const set = (patch: Partial<ChannelLimits>) => onChange({ ...value, ...patch })
  const c = CHANNEL_LIMITS
  return (
    <section className="card model-card" aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`}>{title}</h2>
      <div className="grid-2">
        <NumberField
          label="Maksimum Karakter per Pesan"
          value={value.max_message_chars}
          min={c.max_message_chars.min}
          max={c.max_message_chars.max}
          error={errors.max_message_chars}
          onChange={(next) => set({ max_message_chars: next })}
        />
        <NumberField
          label="Maksimum Giliran"
          value={value.max_turns}
          min={c.max_turns.min}
          max={c.max_turns.max}
          hint="Jumlah giliran tanya-jawab dalam satu percakapan."
          error={errors.max_turns}
          onChange={(next) => set({ max_turns: next })}
        />
        <NumberField
          label="Batas per Menit"
          value={value.per_minute}
          min={c.per_minute.min}
          max={c.per_minute.max}
          hint="Pesan per pengguna dalam satu menit."
          error={errors.per_minute}
          onChange={(next) => set({ per_minute: next })}
        />
        <NumberField
          label="Batas per Hari"
          value={value.per_day}
          min={c.per_day.min}
          max={c.per_day.max}
          hint="Pesan per pengguna dalam satu hari."
          error={errors.per_day}
          onChange={(next) => set({ per_day: next })}
        />
      </div>
      <div className="field">
        <label htmlFor={`${id}-pesan`}>Pesan Saat Batas Tercapai</label>
        <textarea
          id={`${id}-pesan`}
          maxLength={c.limit_message.maxLength}
          value={value.limit_message}
          onChange={(event) => set({ limit_message: event.target.value })}
        />
        <p className="hint">Dikirim ke pelanggan saat salah satu batas di atas tercapai.</p>
      </div>
    </section>
  )
}
