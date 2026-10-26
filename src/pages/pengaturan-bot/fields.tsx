import { useId, type ReactNode } from 'react'
import { formatNumber } from '@/lib/format'
import type { NumberRule } from './botConfig'

interface TextFieldProps {
  label: string
  value: string
  maxLength: number
  onChange: (value: string) => void
  error?: string
  hint?: ReactNode
}

export function TextField({ label, value, maxLength, onChange, error, hint }: TextFieldProps) {
  const id = useId()
  const describedBy = [error ? `${id}-err` : null, hint ? `${id}-hint` : null].filter(Boolean).join(' ') || undefined
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input id={id} type="text" value={value} maxLength={maxLength} onChange={(event) => onChange(event.target.value)} aria-invalid={error ? true : undefined} aria-describedby={describedBy} />
      {error ? (
        <p className="field-error" id={`${id}-err`}>
          {error}
        </p>
      ) : null}
      {hint ? (
        <p className="hint" id={`${id}-hint`}>
          {hint}
        </p>
      ) : null}
    </div>
  )
}

interface TextAreaFieldProps {
  label: string
  value: string
  maxLength: number
  onChange: (value: string) => void
  rows?: number
  hint?: ReactNode
}

// Textarea dengan penghitung karakter; batas maxLength ditegakkan browser dan backend.
export function TextAreaField({ label, value, maxLength, onChange, rows = 4, hint }: TextAreaFieldProps) {
  const id = useId()
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <textarea id={id} className="bot-textarea" rows={rows} value={value} maxLength={maxLength} onChange={(event) => onChange(event.target.value)} aria-describedby={`${id}-count${hint ? ` ${id}-hint` : ''}`} />
      <p className="hint char-count" id={`${id}-count`}>
        {formatNumber(value.length)} / {formatNumber(maxLength)}
      </p>
      {hint ? (
        <p className="hint" id={`${id}-hint`}>
          {hint}
        </p>
      ) : null}
    </div>
  )
}

interface NumberFieldProps {
  label: string
  value: number
  rule: NumberRule
  onChange: (value: number) => void
  error?: string
  hint?: ReactNode
}

// Kosong dikirim sebagai NaN supaya validasi menolaknya, bukan diam-diam menjadi 0.
export function NumberField({ label, value, rule, onChange, error, hint }: NumberFieldProps) {
  const id = useId()
  const describedBy = [error ? `${id}-err` : null, hint ? `${id}-hint` : null].filter(Boolean).join(' ') || undefined
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="number"
        inputMode={rule.integer ? 'numeric' : 'decimal'}
        value={Number.isNaN(value) ? '' : value}
        min={rule.min}
        max={rule.max}
        step={rule.step}
        onChange={(event) => onChange(event.target.value === '' ? Number.NaN : Number(event.target.value))}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
      />
      {error ? (
        <p className="field-error" id={`${id}-err`}>
          {error}
        </p>
      ) : null}
      {hint ? (
        <p className="hint" id={`${id}-hint`}>
          {hint}
        </p>
      ) : null}
    </div>
  )
}
