import { useId, useState, type ReactNode } from 'react'
import { IconPlus, IconX } from '@tabler/icons-react'

interface ListEditorProps {
  label: string
  addLabel: string
  items: string[]
  onChange: (items: string[]) => void
  normalize: (raw: string) => string
  validate: (value: string) => string | null
  max: number
  emptyText: string
  hint?: ReactNode
  placeholder?: string
  inputMode?: 'text' | 'numeric' | 'url'
}

// Editor daftar string: ketik, tekan Enter atau Tambah, hapus lewat tombol pada tiap butir.
// Nilai dinormalkan dan divalidasi sebelum masuk, jadi daftar yang tersimpan selalu sah.
export function ListEditor({ label, addLabel, items, onChange, normalize, validate, max, emptyText, hint, placeholder, inputMode }: ListEditorProps) {
  const id = useId()
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)

  function add() {
    const value = normalize(text)
    if (!value) return
    const problem = validate(value) ?? (items.includes(value) ? 'Entri ini sudah ada di daftar.' : null) ?? (items.length >= max ? `Maksimal ${max} entri.` : null)
    if (problem) {
      setError(problem)
      return
    }
    onChange([...items, value])
    setText('')
    setError(null)
  }

  return (
    <div className="field">
      <label htmlFor={`${id}-input`}>{label}</label>
      <div className="ch-add-row">
        <input
          id={`${id}-input`}
          type="text"
          inputMode={inputMode}
          autoComplete="off"
          placeholder={placeholder}
          value={text}
          aria-invalid={error ? true : undefined}
          aria-describedby={`${id}-hint${error ? ` ${id}-error` : ''}`}
          onChange={(event) => {
            setText(event.target.value)
            setError(null)
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              add()
            }
          }}
        />
        <button type="button" className="btn out" onClick={add}>
          <IconPlus size={16} aria-hidden="true" />
          {addLabel}
        </button>
      </div>
      {error ? (
        <p id={`${id}-error`} className="hint ch-err" role="alert">
          {error}
        </p>
      ) : null}
      <p id={`${id}-hint`} className="hint">
        {hint}
      </p>
      {items.length === 0 ? (
        <p className="hint">{emptyText}</p>
      ) : (
        <ul className="chips ch-chips" aria-label={`Daftar ${label}`}>
          {items.map((item) => (
            <li key={item} className="tag t-mut ch-chip">
              <span>{item}</span>
              <button type="button" className="ch-chip-x" aria-label={`Hapus ${item}`} onClick={() => onChange(items.filter((other) => other !== item))}>
                <IconX size={14} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
