import { useId, useState } from 'react'

interface NumberFieldProps {
  label: string
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  step?: number | string
  hint?: string
  error?: string
  disabled?: boolean
}

function parse(text: string): number {
  return text.trim() === '' ? Number.NaN : Number(text)
}

function same(a: number, b: number): boolean {
  return a === b || (Number.isNaN(a) && Number.isNaN(b))
}

// Input angka yang menyimpan teks ketikan (mis. "0." atau kosong) terpisah dari nilainya,
// supaya mengetik tidak terpotong. Kosong atau tidak valid menjadi NaN dan ditandai sebagai galat.
export function NumberField({ label, value, onChange, min, max, step = 1, hint, error, disabled }: NumberFieldProps) {
  const id = useId()
  const [text, setText] = useState(() => (Number.isNaN(value) ? '' : String(value)))
  // Bila nilai berubah dari luar (batalkan, muat ulang), tampilkan nilai itu, bukan teks lama.
  const shown = same(parse(text), value) ? text : Number.isNaN(value) ? '' : String(value)
  const describedBy = [hint ? `${id}-hint` : '', error ? `${id}-error` : ''].filter(Boolean).join(' ') || undefined

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="number"
        inputMode="decimal"
        min={min}
        max={max}
        step={step}
        value={shown}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        onChange={(event) => {
          setText(event.target.value)
          onChange(parse(event.target.value))
        }}
      />
      {hint ? (
        <p className="hint" id={`${id}-hint`}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p className="hint field-error" id={`${id}-error`}>
          {error}
        </p>
      ) : null}
    </div>
  )
}
