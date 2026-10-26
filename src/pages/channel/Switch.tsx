import { useId, type ReactNode } from 'react'

interface SwitchProps {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  hint?: ReactNode
}

// Saklar on/off: kotak centang asli dengan role switch, jadi keyboard dan pembaca layar bekerja apa adanya.
export function Switch({ label, checked, onChange, hint }: SwitchProps) {
  const hintId = useId()
  return (
    <div className="ch-switch">
      <label>
        <input type="checkbox" role="switch" checked={checked} aria-describedby={hint ? hintId : undefined} onChange={(event) => onChange(event.target.checked)} />
        <span>{label}</span>
      </label>
      {hint ? (
        <p id={hintId} className="hint">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
