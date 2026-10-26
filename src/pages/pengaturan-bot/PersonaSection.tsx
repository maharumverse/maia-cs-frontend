import { useId } from 'react'
import { LIMITS, type FieldErrors, type Persona } from './botConfig'
import { TextAreaField, TextField } from './fields'
import { ListEditor } from './ListEditor'

interface Props {
  persona: Persona
  errors: FieldErrors
  onChange: (persona: Persona) => void
}

const EMOJI_OPTIONS: Array<{ value: Persona['emoji']; label: string }> = [
  { value: 'none', label: 'Tanpa emoji' },
  { value: 'sparing', label: 'Sesekali' },
]

export function PersonaSection({ persona, errors, onChange }: Props) {
  const headingId = useId()
  const emojiId = useId()
  const patch = (change: Partial<Persona>) => onChange({ ...persona, ...change })

  return (
    <section className="card" aria-labelledby={headingId}>
      <h2 id={headingId}>Identitas Bot</h2>
      <p className="muted section-intro">Cara bot memperkenalkan diri dan berbicara kepada pelanggan.</p>
      <div className="stack">
        <div className="grid-2">
          <TextField label="Nama" value={persona.name} maxLength={LIMITS.name} error={errors['persona.name']} onChange={(name) => patch({ name })} />
          <TextField label="Peran" value={persona.role} maxLength={LIMITS.role} error={errors['persona.role']} onChange={(role) => patch({ role })} />
        </div>
        <div className="grid-2">
          <TextField
            label="Sebutan Pelanggan"
            value={persona.address_term}
            maxLength={LIMITS.addressTerm}
            error={errors['persona.address_term']}
            onChange={(address_term) => patch({ address_term })}
            hint='Cara bot menyapa pelanggan, misalnya "Kak".'
          />
          <div className="field">
            <label htmlFor={emojiId}>Emoji</label>
            <select id={emojiId} value={persona.emoji} onChange={(event) => patch({ emoji: event.target.value as Persona['emoji'] })}>
              {EMOJI_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <ListEditor
          label="Sifat"
          noun="sifat"
          items={persona.traits ?? []}
          max={LIMITS.traitsMax}
          maxChars={LIMITS.itemMaxChars}
          onChange={(traits) => patch({ traits })}
          hint={`Maksimal ${LIMITS.traitsMax} sifat, masing-masing sampai ${LIMITS.itemMaxChars} karakter.`}
        />
        <TextAreaField label="Gaya Bicara" value={persona.speaking_style} maxLength={LIMITS.speakingStyle} rows={5} onChange={(speaking_style) => patch({ speaking_style })} />
        <p className="hint">Aturan bahwa bot tidak mengaku sebagai manusia tertanam di sistem dan tidak bisa diubah dari halaman ini.</p>
      </div>
    </section>
  )
}

