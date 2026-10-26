import { useId } from 'react'

interface NumberFieldProps {
  label: string
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  hint?: string
}

// Isian bilangan bulat. Teks kosong atau tidak valid menjadi NaN supaya validasi simpan menolaknya,
// bukan diam-diam memakai nilai lama.
export function NumberField({ label, value, onChange, min, max, hint }: NumberFieldProps) {
  const id = useId()
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        step={1}
        value={Number.isNaN(value) ? '' : value}
        aria-describedby={hint ? `${id}-hint` : undefined}
        onChange={(event) => onChange(event.target.value === '' ? Number.NaN : Number(event.target.value))}
      />
      {hint ? (
        <p id={`${id}-hint`} className="hint">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
